import { motion } from 'framer-motion';

interface CardBackProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { w: 120, h: 180 },
  md: { w: 180, h: 270 },
  lg: { w: 240, h: 360 },
};

export function CardBack({ className = '', size = 'md' }: CardBackProps) {
  const { w, h } = SIZES[size];

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={{
        width: w,
        height: h,
        background: 'linear-gradient(135deg, #1a1a3e 0%, #2d2d6b 40%, #1e1e4a 100%)',
        border: '2px solid rgba(201, 169, 98, 0.4)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 0 60px rgba(26, 26, 62, 0.5)',
      }}
    >
      {/* Star field background */}
      <div className="absolute inset-0 opacity-30">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Cloud silhouette pattern */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="18 23 74 44"
          className="w-3/5 opacity-10"
          fill="white"
        >
          <path d="M25 65 C25 65 20 55 30 50 C28 40 38 35 45 38 C48 28 62 25 68 35 C75 30 85 35 82 48 C90 50 88 62 80 62 Z" />
        </svg>
      </div>

      {/* Central question mark */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className="text-4xl font-light opacity-30"
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            color: 'rgba(201, 169, 98, 0.6)',
          }}
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          ?
        </motion.span>
      </div>

      {/* Bottom logo */}
      <div className="absolute bottom-3 left-0 right-0 text-center">
        <p
          className="text-[8px] tracking-[0.3em] uppercase opacity-30"
          style={{
            fontFamily: '"Montserrat", sans-serif',
            color: 'rgba(201, 169, 98, 0.5)',
          }}
        >
          Cloud Collection
        </p>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-[rgba(201,169,98,0.3)]" />
      <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-[rgba(201,169,98,0.3)]" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-[rgba(201,169,98,0.3)]" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-[rgba(201,169,98,0.3)]" />
    </div>
  );
}
