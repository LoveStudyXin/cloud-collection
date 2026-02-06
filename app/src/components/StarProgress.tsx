import { motion } from 'framer-motion';
import { MAX_STARS } from '@/data/rarityConfig';

interface StarProgressProps {
  litCount: number;
  size?: 'sm' | 'md';
}

export function StarProgress({ litCount, size = 'md' }: StarProgressProps) {
  const starSize = size === 'sm' ? 10 : 16;
  const stars = Math.min(litCount, MAX_STARS);
  const isExpert = litCount >= MAX_STARS;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: MAX_STARS }).map((_, i) => {
        const isActive = i < stars;
        return (
          <motion.svg
            key={i}
            width={starSize}
            height={starSize}
            viewBox="0 0 24 24"
            initial={false}
            animate={isActive ? { scale: [0, 1.3, 1], opacity: 1 } : { scale: 1, opacity: 0.2 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={isActive ? '#FFD700' : '#444'}
              stroke={isActive ? '#DAA520' : '#555'}
              strokeWidth="1"
            />
          </motion.svg>
        );
      })}
      {isExpert && size !== 'sm' && (
        <motion.span
          className="ml-1 text-xs font-medium"
          style={{ color: '#FFD700', fontFamily: '"Montserrat", sans-serif' }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          Expert
        </motion.span>
      )}
    </div>
  );
}
