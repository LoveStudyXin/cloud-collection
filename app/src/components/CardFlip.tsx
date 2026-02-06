import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CloudCard } from '@/types/cloud';
import { CardBack } from './CardBack';
import { RARITY_CONFIG } from '@/data/rarityConfig';

interface CardFlipProps {
  card: CloudCard;
  onFlipComplete?: () => void;
  autoFlip?: boolean;
  size?: 'md' | 'lg';
}

export function CardFlip({ card, onFlipComplete, autoFlip = false, size = 'lg' }: CardFlipProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const rarity = RARITY_CONFIG[card.rarity];

  const dim = size === 'lg'
    ? { w: 240, h: 360 }
    : { w: 180, h: 270 };

  const handleFlip = () => {
    if (isFlipped) return;
    setShowParticles(true);
    setIsFlipped(true);
    setTimeout(() => {
      onFlipComplete?.();
    }, 800);
  };

  // Auto-flip after delay
  if (autoFlip && !isFlipped) {
    setTimeout(handleFlip, 1500);
  }

  return (
    <div className="relative" style={{ width: dim.w, height: dim.h, perspective: 1200 }}>
      {/* Gold particles effect */}
      <AnimatePresence>
        {showParticles && (
          <div className="absolute inset-0 z-30 pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: Math.random() * 4 + 2,
                  height: Math.random() * 4 + 2,
                  left: '50%',
                  top: '50%',
                  background: `hsl(${40 + Math.random() * 20}, 80%, ${60 + Math.random() * 30}%)`,
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{
                  x: (Math.random() - 0.5) * dim.w * 1.5,
                  y: (Math.random() - 0.5) * dim.h * 1.2,
                  opacity: 0,
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 1 + Math.random() * 0.5,
                  delay: Math.random() * 0.3,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Flip container */}
      <motion.div
        className="relative w-full h-full cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        onClick={handleFlip}
      >
        {/* Back face */}
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <CardBack size={size} />
          {!isFlipped && (
            <motion.div
              className="absolute inset-0 flex items-end justify-center pb-8"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <p
                className="text-xs tracking-[0.2em] uppercase text-gray-400"
                style={{ fontFamily: '"Montserrat", sans-serif' }}
              >
                轻触翻转
              </p>
            </motion.div>
          )}
        </div>

        {/* Front face */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(160deg, #f8f6f0 0%, #faf8f2 40%, #f0ece0 100%)',
            border: `2px solid ${rarity.border}`,
            boxShadow: `0 12px 40px rgba(0,0,0,0.25), 0 0 30px ${rarity.glow}`,
          }}
        >
          {/* Mythic shimmer */}
          {card.rarity === '极罕见' && (
            <motion.div
              className="absolute inset-0 z-10 pointer-events-none"
              style={{
                background: 'linear-gradient(105deg, transparent 40%, rgba(255,215,0,0.2) 45%, rgba(255,215,0,0.4) 50%, rgba(255,215,0,0.2) 55%, transparent 60%)',
              }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
            />
          )}

          {/* Rarity bar */}
          <div className="h-1" style={{ background: rarity.bgGradient }} />

          {/* Icon */}
          <div className="flex items-center justify-center pt-8 pb-3">
            <span className="text-5xl">{card.icon}</span>
          </div>

          {/* Name */}
          <div className="text-center px-4">
            <p
              className="text-xl font-medium tracking-wide text-gray-800"
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              {card.name}
            </p>
            <p
              className="text-xs tracking-wider text-gray-500 mt-1 italic"
              style={{ fontFamily: '"Montserrat", sans-serif' }}
            >
              {card.latin}
            </p>
          </div>

          {/* Rarity badge */}
          <div className="flex justify-center mt-3">
            <span
              className="px-3 py-1 rounded-full text-[10px] tracking-wider uppercase font-medium"
              style={{
                fontFamily: '"Montserrat", sans-serif',
                background: rarity.glow,
                color: rarity.border,
                border: `1px solid ${rarity.border}`,
              }}
            >
              {rarity.label}
            </span>
          </div>

          {/* Description */}
          <div className="px-4 mt-4">
            <p
              className="text-xs text-gray-600 leading-relaxed text-center line-clamp-4"
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              {card.description}
            </p>
          </div>

          {/* Score */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <div className="flex items-center gap-1">
              <span className="text-xs" style={{ color: rarity.border }}>+{card.score}</span>
              <span className="text-[10px] text-gray-400">积分</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
