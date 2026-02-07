import { useState, useCallback, useEffect, useRef } from 'react';
import type { UserState, UserCardState, CardStatus, AIAnalysis, Rarity } from '@/types/cloud';
import { cloudCards } from '@/data/cloudCards';
import { RARITY_CONFIG } from '@/data/rarityConfig';
import {
  fetchUserState,
  serverLitCard,
  serverUnlockCard,
  migrateLocalState,
} from '@/services/userStateApi';
import type { ServerUserState } from '@/services/userStateApi';

// 连续发现加成：同一稀有度连续收集时的积分倍率
function getStreakMultiplier(streakCount: number): number {
  // 第1次: 1.0, 第2次: 1.2, 第3次: 1.4, ..., 上限: 2.0
  return Math.min(1 + (streakCount - 1) * 0.2, 2.0);
}

const STORAGE_KEY = 'cloud-collection-user';
const MIGRATED_KEY = 'cloud-collection-migrated';
const INITIAL_POINTS = 30;
const COOLDOWN_MS = 5 * 60 * 1000; // 同一张卡 5 分钟内重复发现不给积分

// Starter cards for new users (unlocked but not lit)
const STARTER_CARD_IDS = ['cirrus', 'cumulus', 'stratus'];

function createStarterCards(): Record<string, UserCardState> {
  const cards: Record<string, UserCardState> = {};
  for (const id of STARTER_CARD_IDS) {
    cards[id] = {
      cardId: id,
      status: 'unlocked',
      litCount: 0,
      litRecords: [],
      unlockedAt: Date.now(),
    };
  }
  return cards;
}

function getInitialState(): UserState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore parse errors
  }
  return {
    points: INITIAL_POINTS,
    cards: createStarterCards(),
    totalLitCount: 0,
  };
}

/**
 * 将服务端状态合并到本地（服务端积分为准，本地缩略图保留）
 */
function mergeServerState(serverState: ServerUserState, localState: UserState): UserState {
  const mergedCards: Record<string, UserCardState> = {};

  // 合并服务端卡牌（保留本地缩略图）
  for (const [cardId, serverCard] of Object.entries(serverState.cards)) {
    const localCard = localState.cards[cardId];
    mergedCards[cardId] = {
      cardId: serverCard.cardId,
      status: serverCard.status as CardStatus,
      litCount: serverCard.litCount,
      unlockedAt: serverCard.unlockedAt ?? undefined,
      litRecords: serverCard.litRecords.map((sr, i) => ({
        timestamp: sr.timestamp,
        earnedScore: sr.earnedScore,
        aiAnalysis: sr.aiAnalysis,
        // 保留本地缩略图（按时间戳匹配）
        thumbnail: localCard?.litRecords?.find(lr => lr.timestamp === sr.timestamp)?.thumbnail
          || localCard?.litRecords?.[i]?.thumbnail,
        imageUrl: undefined, // session URL 不持久化
      })),
    };
  }

  // 保留本地独有的卡牌（可能是离线操作，待同步）
  for (const [cardId, localCard] of Object.entries(localState.cards)) {
    if (!mergedCards[cardId]) {
      mergedCards[cardId] = localCard;
    }
  }

  return {
    points: serverState.points,
    totalLitCount: serverState.totalLitCount,
    streakRarity: (serverState.streakRarity as Rarity) || undefined,
    streakCount: serverState.streakCount,
    cards: mergedCards,
  };
}

export function useUserState(isAuthenticated?: boolean) {
  const [state, setState] = useState<UserState>(getInitialState);
  const [syncing, setSyncing] = useState(false);
  const syncedRef = useRef(false);

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // 登录后从服务器加载状态
  useEffect(() => {
    if (!isAuthenticated || syncedRef.current) return;
    syncedRef.current = true;

    const syncFromServer = async () => {
      setSyncing(true);
      try {
        const serverState = await fetchUserState();

        // 检查服务端是否有有意义的数据
        const serverHasData = serverState.totalLitCount > 0
          || Object.keys(serverState.cards).length > STARTER_CARD_IDS.length;

        if (serverHasData) {
          // 服务端有数据，合并到本地
          setState(prev => mergeServerState(serverState, prev));
        } else {
          // 服务端无数据，检查本地是否需要迁移
          const localState = getInitialState();
          const alreadyMigrated = localStorage.getItem(MIGRATED_KEY) === '1';

          if (!alreadyMigrated && localState.totalLitCount > 0) {
            // 本地有数据需要迁移
            try {
              await migrateLocalState(localState);
              localStorage.setItem(MIGRATED_KEY, '1');
            } catch {
              // 迁移失败不阻塞，下次再试
            }
          }
        }
      } catch {
        // 离线或请求失败，继续使用本地数据
      } finally {
        setSyncing(false);
      }
    };

    syncFromServer();
  }, [isAuthenticated]);

  // 当 auth 状态变为 false（登出）时重置 synced 标记
  useEffect(() => {
    if (!isAuthenticated) {
      syncedRef.current = false;
    }
  }, [isAuthenticated]);

  // Get card state (defaults to locked)
  const getCardState = useCallback((cardId: string): UserCardState => {
    return state.cards[cardId] || {
      cardId,
      status: 'locked' as CardStatus,
      litCount: 0,
      litRecords: [],
    };
  }, [state.cards]);

  // Light up a card (natural discovery or re-identification)
  const litCard = useCallback((cardId: string, imageUrl?: string, thumbnail?: string, aiAnalysis?: AIAnalysis) => {
    const card = cloudCards.find(c => c.id === cardId);
    if (!card) return;

    // 乐观更新本地
    setState(prev => {
      const existing = prev.cards[cardId];
      const now = Date.now();

      // 防刷：检查同一张卡的冷却时间
      const lastRecord = existing?.litRecords?.[existing.litRecords.length - 1];
      const inCooldown = lastRecord && (now - lastRecord.timestamp) < COOLDOWN_MS;

      // 连续发现加成计算（冷却中不更新连击）
      const isSameRarity = prev.streakRarity === card.rarity;
      const newStreakCount = inCooldown
        ? (prev.streakCount || 1)
        : (isSameRarity ? (prev.streakCount || 1) + 1 : 1);
      const multiplier = getStreakMultiplier(newStreakCount);
      const baseScore = card.score;
      const finalScore = inCooldown ? 0 : Math.round(baseScore * multiplier);

      const newRecord = {
        timestamp: now,
        imageUrl,
        thumbnail,
        aiAnalysis,
        earnedScore: finalScore,
      };

      const newCardState: UserCardState = {
        cardId,
        status: 'lit',
        litCount: (existing?.litCount || 0) + 1,
        litRecords: [...(existing?.litRecords || []), newRecord],
        unlockedAt: existing?.unlockedAt,
      };

      return {
        ...prev,
        points: prev.points + finalScore,
        cards: { ...prev.cards, [cardId]: newCardState },
        totalLitCount: prev.totalLitCount + (inCooldown ? 0 : 1),
        ...(inCooldown ? {} : { streakRarity: card.rarity, streakCount: newStreakCount }),
      };
    });

    // 后台同步到服务端
    if (isAuthenticated) {
      serverLitCard(cardId, aiAnalysis)
        .then(response => {
          // 用服务端返回的积分覆盖本地（服务端为准）
          setState(prev => ({
            ...prev,
            points: response.newPoints,
            streakCount: response.streakCount,
            streakRarity: (response.streakRarity as Rarity) || undefined,
          }));
        })
        .catch(() => {
          // 同步失败，保持本地乐观更新
        });
    }
  }, [isAuthenticated]);

  // Unlock a card with points (buy hint/clue)
  const unlockCard = useCallback(async (cardId: string): Promise<boolean> => {
    const card = cloudCards.find(c => c.id === cardId);
    if (!card) return false;

    const cost = RARITY_CONFIG[card.rarity].unlockCost;
    if (state.points < cost) return false;

    // 如果已登录，先请求服务端
    if (isAuthenticated) {
      try {
        const response = await serverUnlockCard(cardId);
        if (response.success) {
          setState(prev => {
            const existing = prev.cards[cardId];
            if (existing?.status === 'lit') return prev;

            return {
              ...prev,
              points: response.newPoints,
              cards: {
                ...prev.cards,
                [cardId]: {
                  cardId,
                  status: 'unlocked',
                  litCount: existing?.litCount || 0,
                  litRecords: existing?.litRecords || [],
                  unlockedAt: Date.now(),
                },
              },
            };
          });
          return true;
        }
        return false;
      } catch {
        // 服务端失败，回退到本地逻辑
      }
    }

    // 本地离线逻辑
    setState(prev => {
      const existing = prev.cards[cardId];
      // Don't downgrade if already lit
      if (existing?.status === 'lit') return prev;

      return {
        ...prev,
        points: prev.points - cost,
        cards: {
          ...prev.cards,
          [cardId]: {
            cardId,
            status: 'unlocked',
            litCount: existing?.litCount || 0,
            litRecords: existing?.litRecords || [],
            unlockedAt: Date.now(),
          },
        },
      };
    });

    return true;
  }, [state.points, isAuthenticated]);

  // Get collection stats
  const getStats = useCallback(() => {
    const total = cloudCards.length;
    const lit = Object.values(state.cards).filter(c => c.status === 'lit').length;
    const unlocked = Object.values(state.cards).filter(c => c.status === 'unlocked').length;
    return { total, lit, unlocked, locked: total - lit - unlocked };
  }, [state.cards]);

  // Get lit cards sorted by most recent
  const getLitCards = useCallback(() => {
    return Object.values(state.cards)
      .filter(c => c.status === 'lit')
      .sort((a, b) => {
        const aLast = a.litRecords[a.litRecords.length - 1]?.timestamp || 0;
        const bLast = b.litRecords[b.litRecords.length - 1]?.timestamp || 0;
        return bLast - aLast;
      });
  }, [state.cards]);

  // 获取当前连击信息（用于UI展示）
  const getStreakInfo = useCallback((rarity: Rarity) => {
    const isSameRarity = state.streakRarity === rarity;
    const nextStreakCount = isSameRarity ? (state.streakCount || 1) + 1 : 1;
    const multiplier = getStreakMultiplier(nextStreakCount);
    return { streakCount: nextStreakCount, multiplier, hasBonus: multiplier > 1 };
  }, [state.streakRarity, state.streakCount]);

  // 检查某张卡是否在冷却中
  const isInCooldown = useCallback((cardId: string): boolean => {
    const existing = state.cards[cardId];
    const lastRecord = existing?.litRecords?.[existing.litRecords.length - 1];
    return !!lastRecord && (Date.now() - lastRecord.timestamp) < COOLDOWN_MS;
  }, [state.cards]);

  // Reset (for testing)
  const reset = useCallback(() => {
    setState({
      points: INITIAL_POINTS,
      cards: createStarterCards(),
      totalLitCount: 0,
    });
  }, []);

  return {
    points: state.points,
    cards: state.cards,
    totalLitCount: state.totalLitCount,
    streakRarity: state.streakRarity,
    streakCount: state.streakCount || 0,
    syncing,
    getCardState,
    litCard,
    unlockCard,
    getStats,
    getLitCards,
    getStreakInfo,
    isInCooldown,
    reset,
  };
}
