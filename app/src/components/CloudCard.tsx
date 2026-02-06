import { motion } from 'framer-motion';
import type { CloudCard } from '@/types/cloud';
import type { UserCardState } from '@/types/cloud';
import { RARITY_CONFIG } from '@/data/rarityConfig';
import { StarProgress } from './StarProgress';
import { CardBack } from './CardBack';

interface CloudCardProps {
  card: CloudCard;
  cardState: UserCardState;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  showDetails?: boolean;
}

const SIZES = {
  sm: { w: 120, h: 180, iconSize: 'text-2xl', nameSize: 'text-xs', latinSize: 'text-[8px]' },
  md: { w: 180, h: 270, iconSize: 'text-4xl', nameSize: 'text-sm', latinSize: 'text-[10px]' },
  lg: { w: 240, h: 360, iconSize: 'text-5xl', nameSize: 'text-lg', latinSize: 'text-xs' },
};

export function CloudCardComponent({ card, cardState, size = 'md', onClick, showDetails = false }: CloudCardProps) {
  const { status, litCount } = cardState;
  const rarity = RARITY_CONFIG[card.rarity];
  const dim = SIZES[size];

  // Locked: show card back
  if (status === 'locked') {
    return (
      <motion.div
        className="cursor-pointer"
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <CardBack size={size} />
      </motion.div>
    );
  }

  const isLit = status === 'lit';
  const isUnlocked = status === 'unlocked';

  return (
    <motion.div
      className="relative cursor-pointer select-none"
      style={{ width: dim.w, height: dim.h }}
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Main card body */}
      <div
        className="relative w-full h-full rounded-xl overflow-hidden"
        style={{
          background: isLit
            ? 'linear-gradient(160deg, #f8f6f0 0%, #faf8f2 40%, #f0ece0 100%)'
            : 'linear-gradient(160deg, #dedede 0%, #d6d6d6 40%, #cecece 100%)',
          border: `2px solid ${isLit ? rarity.border : 'rgba(150, 150, 150, 0.4)'}`,
          boxShadow: isLit
            ? `0 8px 32px rgba(0,0,0,0.2), 0 0 20px ${rarity.glow}`
            : '0 4px 16px rgba(0,0,0,0.15)',
          filter: 'none',
        }}
      >
        {/* Mythic shimmer effect */}
        {isLit && card.rarity === '极罕见' && (
          <motion.div
            className="absolute inset-0 z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,215,0,0.15) 45%, rgba(255,215,0,0.3) 50%, rgba(255,215,0,0.15) 55%, transparent 60%)',
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          />
        )}

        {/* Rarity indicator bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: isLit ? rarity.bgGradient : 'rgba(150,150,150,0.3)',
          }}
        />

        {/* Icon */}
        <div className="flex items-center justify-center pt-6 pb-2">
          <span className={`${dim.iconSize} ${isUnlocked ? 'opacity-40' : ''}`}>
            {card.icon}
          </span>
        </div>

        {/* Card name */}
        <div className="text-center px-3">
          <p
            className={`${dim.nameSize} font-medium tracking-wide ${isUnlocked ? 'text-gray-500' : 'text-gray-800'}`}
            style={{ fontFamily: '"Cormorant Garamond", serif' }}
          >
            {card.name}
          </p>
          <p
            className={`${dim.latinSize} tracking-wider mt-0.5 ${isUnlocked ? 'text-gray-400' : 'text-gray-500'} italic`}
            style={{ fontFamily: '"Montserrat", sans-serif' }}
          >
            {card.latin}
          </p>
        </div>

        {/* Rarity label */}
        <div className="flex justify-center mt-2">
          <span
            className="px-2 py-0.5 rounded-full text-[9px] tracking-wider uppercase"
            style={{
              fontFamily: '"Montserrat", sans-serif',
              background: isLit ? `${rarity.glow}` : 'rgba(150,150,150,0.2)',
              color: isLit ? rarity.border : '#888',
              border: `1px solid ${isLit ? rarity.border : 'rgba(150,150,150,0.3)'}`,
            }}
          >
            {rarity.label}
          </span>
        </div>

        {/* Content area */}
        <div className="px-3 mt-3">
          {isLit && showDetails && (
            // Lit with details: show description
            <p className="text-[10px] text-gray-600 leading-relaxed line-clamp-3" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
              {card.description}
            </p>
          )}
        </div>

        {/* Star progress (lit cards only) */}
        {isLit && litCount > 0 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <StarProgress litCount={litCount} size={size === 'sm' ? 'sm' : 'md'} />
          </div>
        )}

        {/* Unlocked overlay hint */}
        {isUnlocked && (
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <p className="text-[9px] text-gray-400 tracking-wider" style={{ fontFamily: '"Montserrat", sans-serif' }}>
              等待发现...
            </p>
          </div>
        )}
      </div>

      {/* Star border decorations for lit cards */}
      {isLit && litCount >= 2 && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: Math.min(litCount - 1, 4) }).map((_, i) => {
            const positions = [
              { top: '10%', right: '-4px' },
              { top: '30%', left: '-4px' },
              { bottom: '30%', right: '-4px' },
              { bottom: '10%', left: '-4px' },
            ];
            const pos = positions[i];
            return (
              <motion.div
                key={i}
                className="absolute w-2 h-2"
                style={pos}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.2 }}
              >
                <svg viewBox="0 0 12 12" className="w-full h-full">
                  <path
                    d="M6 0l1.5 4.5L12 6l-4.5 1.5L6 12l-1.5-4.5L0 6l4.5-1.5L6 0z"
                    fill={rarity.border}
                  />
                </svg>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Expert crown */}
      {isLit && litCount >= 5 && (
        <motion.div
          className="absolute -top-3 left-0 right-0 flex justify-center"
          initial={{ scale: 0, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
        >
          <span className="text-lg">👑</span>
        </motion.div>
      )}
    </motion.div>
  );
}
