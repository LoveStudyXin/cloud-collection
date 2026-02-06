import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PointsDisplayProps {
  points: number;
  className?: string;
}

export function PointsDisplay({ points, className = '' }: PointsDisplayProps) {
  const [displayPoints, setDisplayPoints] = useState(points);
  const [delta, setDelta] = useState<number | null>(null);

  useEffect(() => {
    if (points !== displayPoints) {
      setDelta(points - displayPoints);
      // Animate counting
      const start = displayPoints;
      const diff = points - start;
      const steps = 20;
      let step = 0;
      const interval = setInterval(() => {
        step++;
        setDisplayPoints(Math.round(start + (diff * step) / steps));
        if (step >= steps) {
          clearInterval(interval);
          setDisplayPoints(points);
          setTimeout(() => setDelta(null), 1000);
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [points]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`relative flex items-center gap-1.5 ${className}`}>
      {/* Star icon */}
      <motion.svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        animate={delta ? { scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill="#FFD700"
          stroke="#DAA520"
          strokeWidth="1"
        />
      </motion.svg>

      {/* Points number */}
      <motion.span
        className="text-sm font-semibold tabular-nums"
        style={{
          fontFamily: '"Montserrat", sans-serif',
          color: '#c9a962',
        }}
        animate={delta && delta < 0 ? { x: [-2, 2, -2, 0] } : {}}
        transition={{ duration: 0.3 }}
      >
        {displayPoints}
      </motion.span>

      {/* Delta animation */}
      <AnimatePresence>
        {delta !== null && delta !== 0 && (
          <motion.span
            className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-bold whitespace-nowrap"
            style={{
              color: delta > 0 ? '#22c55e' : '#ef4444',
              fontFamily: '"Montserrat", sans-serif',
            }}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -8 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8 }}
          >
            {delta > 0 ? `+${delta}` : delta}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
