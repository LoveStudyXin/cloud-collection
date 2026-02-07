/**
 * 用户收集状态 API 服务
 * 与后端同步积分、卡牌状态、点亮记录
 */

import type { UserState, AIAnalysis } from '@/types/cloud';

// Capacitor 原生应用中页面从本地加载，必须用完整地址
const isNative = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
const API_BASE_URL = isNative
  ? 'http://106.14.148.230:8000/api'
  : '/api';

function getToken(): string {
  try {
    const raw = localStorage.getItem('cloud-auth');
    if (raw) {
      const auth = JSON.parse(raw);
      return auth.token || '';
    }
  } catch { /* ignore */ }
  return '';
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  if (!token) throw new Error('NOT_LOGGED_IN');

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}

// ============ 响应类型 ============

export interface ServerUserState {
  points: number;
  totalLitCount: number;
  streakRarity: string | null;
  streakCount: number;
  cards: Record<string, {
    cardId: string;
    status: string;
    litCount: number;
    litRecords: Array<{
      timestamp: number;
      earnedScore: number;
      aiAnalysis?: AIAnalysis;
    }>;
    unlockedAt?: number | null;
  }>;
}

export interface ServerLitResponse {
  earnedScore: number;
  newPoints: number;
  streakCount: number;
  streakRarity: string | null;
  inCooldown: boolean;
}

export interface ServerUnlockResponse {
  success: boolean;
  newPoints: number;
}

// ============ API 方法 ============

/**
 * 获取用户完整收集状态（登录时调用）
 */
export async function fetchUserState(): Promise<ServerUserState> {
  const resp = await authFetch(`${API_BASE_URL}/user/state`);

  if (!resp.ok) {
    if (resp.status === 401) throw new Error('NOT_LOGGED_IN');
    throw new Error('获取用户状态失败');
  }

  return resp.json();
}

/**
 * 点亮卡牌（服务端计算积分）
 */
export async function serverLitCard(
  cardId: string,
  aiAnalysis?: AIAnalysis,
): Promise<ServerLitResponse> {
  const resp = await authFetch(`${API_BASE_URL}/user/lit`, {
    method: 'POST',
    body: JSON.stringify({
      card_id: cardId,
      ai_family: aiAnalysis?.family || null,
      ai_genus: aiAnalysis?.genus || null,
      ai_species: aiAnalysis?.species || null,
      ai_features: aiAnalysis?.features || null,
      ai_weather: aiAnalysis?.weather || null,
      ai_knowledge: aiAnalysis?.knowledge || null,
    }),
  });

  if (!resp.ok) {
    if (resp.status === 401) throw new Error('NOT_LOGGED_IN');
    throw new Error('点亮卡牌同步失败');
  }

  return resp.json();
}

/**
 * 解锁卡牌（花费积分）
 */
export async function serverUnlockCard(cardId: string): Promise<ServerUnlockResponse> {
  const resp = await authFetch(`${API_BASE_URL}/user/unlock`, {
    method: 'POST',
    body: JSON.stringify({ card_id: cardId }),
  });

  if (!resp.ok) {
    if (resp.status === 401) throw new Error('NOT_LOGGED_IN');
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.detail || '解锁失败');
  }

  return resp.json();
}

/**
 * 迁移本地 localStorage 数据到服务器
 */
export async function migrateLocalState(state: UserState): Promise<{ migrated: boolean }> {
  // 转换卡牌数据格式：去掉 thumbnail 和 imageUrl
  const cards: Record<string, unknown> = {};
  for (const [cardId, cardState] of Object.entries(state.cards)) {
    cards[cardId] = {
      status: cardState.status,
      litCount: cardState.litCount,
      unlockedAt: cardState.unlockedAt,
      litRecords: cardState.litRecords.map(r => ({
        timestamp: r.timestamp,
        earnedScore: r.earnedScore || 0,
        aiAnalysis: r.aiAnalysis,
      })),
    };
  }

  const resp = await authFetch(`${API_BASE_URL}/user/migrate`, {
    method: 'POST',
    body: JSON.stringify({
      points: state.points,
      total_lit_count: state.totalLitCount,
      streak_rarity: state.streakRarity || null,
      streak_count: state.streakCount || 0,
      cards,
    }),
  });

  if (!resp.ok) {
    throw new Error('迁移数据失败');
  }

  return resp.json();
}
