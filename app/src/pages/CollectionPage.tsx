import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cloudCards, getCloudsByCategory, CATEGORY_ORDER } from '@/data/cloudCards';
import { RARITY_CONFIG } from '@/data/rarityConfig';
import { CloudCardComponent } from '@/components/CloudCard';
import { PointsDisplay } from '@/components/PointsDisplay';
import type { UserCardState, CloudCard } from '@/types/cloud';
import { ArrowLeft, ChevronDown, ChevronRight, Lock } from 'lucide-react';

interface CollectionPageProps {
  points: number;
  getCardState: (cardId: string) => UserCardState;
  onCardClick: (card: CloudCard) => void;
  onUnlockCard: (cardId: string) => Promise<boolean>;
  onBack: () => void;
}

export function CollectionPage({ points, getCardState, onCardClick, onUnlockCard, onBack }: CollectionPageProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['基础云型']));
  const [unlockingCard, setUnlockingCard] = useState<string | null>(null);
  const cloudsByCategory = getCloudsByCategory();

  // Collection stats
  const totalCards = cloudCards.length;
  const litCards = cloudCards.filter(c => getCardState(c.id).status === 'lit').length;
  const unlockedCards = cloudCards.filter(c => getCardState(c.id).status === 'unlocked').length;

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleCardAction = (card: CloudCard) => {
    const state = getCardState(card.id);
    if (state.status === 'locked') {
      // Show unlock prompt
      setUnlockingCard(card.id);
    } else {
      onCardClick(card);
    }
  };

  const handleUnlock = async (cardId: string) => {
    const success = await onUnlockCard(cardId);
    if (success) {
      setUnlockingCard(null);
    }
  };

  return (
    <motion.div
      className="relative w-full overflow-y-auto pb-20"
      style={{ height: '100%' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div
        className="sticky top-0 z-30 flex items-center justify-between px-6 pb-4"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          background: 'rgba(232, 244, 252, 0.9)',
          backdropFilter: 'blur(12px)',
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.button
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          style={{ fontFamily: '"Montserrat", sans-serif' }}
          onClick={onBack}
          whileHover={{ x: -2 }}
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </motion.button>

        <h1
          className="text-lg tracking-[0.15em] font-light"
          style={{ fontFamily: '"Cormorant Garamond", serif' }}
        >
          云彩图鉴
        </h1>

        <PointsDisplay points={points} />
      </motion.div>

      {/* Collection progress */}
      <motion.div
        className="px-6 py-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-2">
          <p
            className="text-sm text-gray-500"
            style={{ fontFamily: '"Montserrat", sans-serif' }}
          >
            收集进度
          </p>
          <p
            className="text-sm font-medium"
            style={{ fontFamily: '"Montserrat", sans-serif', color: '#c9a962' }}
          >
            {litCards} / {totalCards}
          </p>
        </div>
        <div className="w-full h-1.5 bg-gray-200/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #CD7F32, #FFD700)' }}
            initial={{ width: 0 }}
            animate={{ width: `${(litCards / totalCards) * 100}%` }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
        <div className="flex items-center gap-4 mt-2">
          <p className="text-[10px] text-gray-400">
            <span className="inline-block w-2 h-2 rounded-full bg-[#c9a962] mr-1" />
            已点亮 {litCards}
          </p>
          <p className="text-[10px] text-gray-400">
            <span className="inline-block w-2 h-2 rounded-full bg-gray-300 mr-1" />
            已解锁 {unlockedCards}
          </p>
          <p className="text-[10px] text-gray-400">
            <span className="inline-block w-2 h-2 rounded-full bg-gray-200 mr-1" />
            未发现 {totalCards - litCards - unlockedCards}
          </p>
        </div>
      </motion.div>

      {/* Categories */}
      <div className="px-4 space-y-2">
        {CATEGORY_ORDER.map(({ key, label, sublabel }) => {
          const categoryClouds = cloudsByCategory[key];
          if (!categoryClouds || categoryClouds.length === 0) return null;

          const isExpanded = expandedCategories.has(key);
          const categoryLit = categoryClouds.filter(c => getCardState(c.id).status === 'lit').length;

          return (
            <motion.div
              key={key}
              className="rounded-xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.3)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.4)',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Category header */}
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/20 transition-colors"
                onClick={() => toggleCategory(key)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                    {label}
                  </span>
                  <span className="text-[10px] text-gray-400 italic" style={{ fontFamily: '"Montserrat", sans-serif' }}>
                    {sublabel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400" style={{ fontFamily: '"Montserrat", sans-serif' }}>
                    {categoryLit}/{categoryClouds.length}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Card grid */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    className="px-3 pb-3"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 justify-items-center">
                      {[...categoryClouds].sort((a, b) => {
                        const order = { lit: 0, unlocked: 1, locked: 2 };
                        return order[getCardState(a.id).status] - order[getCardState(b.id).status];
                      }).map(cloud => (
                        <div key={cloud.id} className="relative">
                          <CloudCardComponent
                            card={cloud}
                            cardState={getCardState(cloud.id)}
                            size="sm"
                            onClick={() => handleCardAction(cloud)}
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Unlock dialog */}
      <AnimatePresence>
        {unlockingCard && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setUnlockingCard(null)}
            />

            {/* Dialog */}
            <motion.div
              className="relative z-10 w-full max-w-sm rounded-2xl p-6"
              style={{
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.6)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              }}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              {(() => {
                const card = cloudCards.find(c => c.id === unlockingCard);
                if (!card) return null;
                const r = RARITY_CONFIG[card.rarity];
                const cost = r.unlockCost;
                const canAfford = points >= cost;

                return (
                  <>
                    <div className="text-center mb-4">
                      <span className="text-4xl">☁️</span>
                    </div>
                    <h3
                      className="text-lg text-center font-medium text-gray-800 mb-1"
                      style={{ fontFamily: '"Cormorant Garamond", serif' }}
                    >
                      解锁这朵云的线索？
                    </h3>
                    <p
                      className="text-xs text-center text-gray-500 mb-4"
                      style={{ fontFamily: '"Montserrat", sans-serif' }}
                    >
                      解锁后可查看云彩名称与寻找线索，但仍需拍摄到才能点亮
                    </p>
                    <div className="flex items-center justify-center gap-1 mb-4">
                      <Lock className="w-3.5 h-3.5 text-gray-400" />
                      <span
                        className="text-sm font-medium"
                        style={{ color: canAfford ? r.border : '#ef4444', fontFamily: '"Montserrat", sans-serif' }}
                      >
                        消耗 {cost} 积分
                      </span>
                      {!canAfford && (
                        <span className="text-xs text-red-400 ml-1">
                          (积分不足)
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button
                        className="flex-1 py-2.5 rounded-full text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
                        style={{ fontFamily: '"Montserrat", sans-serif' }}
                        onClick={() => setUnlockingCard(null)}
                      >
                        取消
                      </button>
                      <button
                        className="flex-1 py-2.5 rounded-full text-sm text-white transition-colors disabled:opacity-50"
                        style={{
                          fontFamily: '"Montserrat", sans-serif',
                          background: canAfford ? r.bgGradient : '#ccc',
                        }}
                        onClick={() => handleUnlock(unlockingCard)}
                        disabled={!canAfford}
                      >
                        解锁线索
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
