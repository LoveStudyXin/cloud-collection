import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardFlip } from '@/components/CardFlip';
import { RARITY_CONFIG } from '@/data/rarityConfig';
import type { RecognitionResult } from '@/types/cloud';
import { cloudCardMap } from '@/data/cloudCards';
import { Sparkles, Flame } from 'lucide-react';

interface StreakInfo {
  streakCount: number;
  multiplier: number;
  hasBonus: boolean;
}

interface ResultPageProps {
  result: RecognitionResult;
  streakInfo?: StreakInfo;
  inCooldown?: boolean;
  onLitCard: () => void;
  onBack: () => void;
}

export function ResultPage({ result, streakInfo, inCooldown, onLitCard, onBack }: ResultPageProps) {
  const [flipped, setFlipped] = useState(false);
  const [litAnimating, setLitAnimating] = useState(false);
  const card = cloudCardMap.get(result.cloudId);
  const rarity = card ? RARITY_CONFIG[card.rarity] : RARITY_CONFIG['常见'];

  const handleLit = () => {
    setLitAnimating(true);
    setTimeout(() => {
      onLitCard();
    }, 1200);
  };

  return (
    <motion.div
      className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden py-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo */}
      <motion.div
        className="absolute top-8 left-0 right-0 z-20 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h1
          className="text-2xl tracking-[0.15em] font-light"
          style={{ fontFamily: '"Cormorant Garamond", serif' }}
        >
          Cloud Collection
        </h1>
      </motion.div>

      {/* Subtitle before flip */}
      {!flipped && (
        <motion.p
          className="text-sm tracking-[0.3em] uppercase text-gray-500 mb-6"
          style={{ fontFamily: '"Montserrat", sans-serif' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          发现了一朵云
        </motion.p>
      )}

      {/* Card flip area */}
      {card && (
        <CardFlip
          card={card}
          onFlipComplete={() => setFlipped(true)}
          size="lg"
        />
      )}

      {/* Result info after flip */}
      <AnimatePresence>
        {flipped && !litAnimating && (
          <motion.div
            className="flex flex-col items-center gap-6 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {/* Confidence */}
            <p
              className="text-xs text-gray-400 tracking-wider"
              style={{ fontFamily: '"Montserrat", sans-serif' }}
            >
              识别置信度: {Math.round(result.confidence * 100)}%
            </p>

            {/* Light up button */}
            <motion.button
              className="flex items-center gap-2 px-6 py-3 rounded-full text-sm tracking-wider"
              style={{
                fontFamily: '"Montserrat", sans-serif',
                background: rarity.bgGradient,
                color: '#fff',
                boxShadow: `0 4px 20px ${rarity.glow}`,
              }}
              onClick={handleLit}
              whileHover={{ scale: 1.05, boxShadow: `0 6px 30px ${rarity.glowStrong}` }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-4 h-4" />
              点亮图鉴
            </motion.button>

            {/* Score info */}
            <div className="flex flex-col items-center gap-1">
              {inCooldown ? (
                <p className="text-xs text-gray-400">
                  短时间内重复发现，本次 <span className="text-orange-400">+0</span> 积分
                </p>
              ) : (
                <>
                  <p className="text-xs text-gray-400">
                    点亮可获得 <span style={{ color: rarity.border }}>+{streakInfo?.hasBonus ? Math.round(result.score * streakInfo.multiplier) : result.score}</span> 积分
                  </p>
                  {streakInfo?.hasBonus && (
                    <p className="flex items-center gap-1 text-[10px] text-orange-400">
                      <Flame className="w-3 h-3" />
                      连续发现 ×{streakInfo.streakCount}  加成 +{Math.round((streakInfo.multiplier - 1) * 100)}%
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lit animation - stars converging */}
      <AnimatePresence>
        {litAnimating && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              const startR = 300;
              const startX = Math.cos(angle) * startR;
              const startY = Math.sin(angle) * startR;
              return (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2"
                  style={{ left: '50%', top: '40%' }}
                  initial={{ x: startX, y: startY, opacity: 0, scale: 0 }}
                  animate={{
                    x: 0,
                    y: 0,
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1.5, 1, 0],
                  }}
                  transition={{
                    duration: 1,
                    delay: i * 0.05,
                    ease: 'easeIn',
                  }}
                >
                  <svg viewBox="0 0 12 12" className="w-full h-full">
                    <path
                      d="M6 0l1.5 4.5L12 6l-4.5 1.5L6 12l-1.5-4.5L0 6l4.5-1.5L6 0z"
                      fill="#FFD700"
                    />
                  </svg>
                </motion.div>
              );
            })}

            {/* Central flash */}
            <motion.div
              className="absolute rounded-full"
              style={{
                left: '50%',
                top: '40%',
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ width: 0, height: 0, opacity: 0 }}
              animate={{
                width: [0, 100, 0],
                height: [0, 100, 0],
                opacity: [0, 0.6, 0],
              }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <div
                className="w-full h-full rounded-full"
                style={{
                  background: `radial-gradient(circle, ${rarity.glowStrong} 0%, transparent 70%)`,
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back button */}
      <motion.button
        className="absolute bottom-8 text-xs tracking-wider text-gray-400 hover:text-gray-600 transition-colors"
        style={{ fontFamily: '"Montserrat", sans-serif' }}
        onClick={onBack}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        whileHover={{ scale: 1.05 }}
      >
        返回首页
      </motion.button>
    </motion.div>
  );
}
