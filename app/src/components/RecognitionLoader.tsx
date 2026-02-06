import { motion } from 'framer-motion';

interface RecognitionLoaderProps {
  imageUrl?: string;
}

export function RecognitionLoader({ imageUrl }: RecognitionLoaderProps) {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Outer rotating ring */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(201, 169, 98, 0.8)" />
              <stop offset="50%" stopColor="rgba(201, 169, 98, 0.2)" />
              <stop offset="100%" stopColor="rgba(201, 169, 98, 0.8)" />
            </linearGradient>
          </defs>
          <circle
            cx="100" cy="100" r="95"
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth="1.5"
            strokeDasharray="8 4"
          />
        </svg>
      </motion.div>

      {/* Inner rotating ring (opposite direction) */}
      <motion.div
        className="absolute inset-4"
        animate={{ rotate: -360 }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle
            cx="100" cy="100" r="95"
            fill="none"
            stroke="rgba(201, 169, 98, 0.3)"
            strokeWidth="1"
            strokeDasharray="4 8"
          />
        </svg>
      </motion.div>

      {/* Constellation dots */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const r = 80;
        const cx = 128 + Math.cos(angle) * r;
        const cy = 128 + Math.sin(angle) * r;
        return (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-[#c9a962]"
            style={{ left: cx, top: cy }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2,
              delay: i * 0.25,
              repeat: Infinity,
            }}
          />
        );
      })}

      {/* Connecting lines animation */}
      <motion.svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 256 256"
      >
        {Array.from({ length: 4 }).map((_, i) => {
          const a1 = (i / 8) * Math.PI * 2;
          const a2 = ((i + 3) / 8) * Math.PI * 2;
          const r = 80;
          const x1 = 128 + Math.cos(a1) * r;
          const y1 = 128 + Math.sin(a1) * r;
          const x2 = 128 + Math.cos(a2) * r;
          const y2 = 128 + Math.sin(a2) * r;
          return (
            <motion.line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="rgba(201, 169, 98, 0.3)"
              strokeWidth="0.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0, 0.6, 0] }}
              transition={{
                duration: 2,
                delay: i * 0.5,
                repeat: Infinity,
                repeatDelay: 1,
              }}
            />
          );
        })}
      </motion.svg>

      {/* Center image or cloud icon */}
      <div className="relative z-10 w-20 h-20 rounded-full overflow-hidden border-2 border-[rgba(201,169,98,0.4)]">
        {imageUrl ? (
          <img src={imageUrl} alt="Captured" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#1a1a3e]/80">
            <span className="text-3xl">☁️</span>
          </div>
        )}
      </div>

      {/* Pulsing glow */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        animate={{
          boxShadow: [
            '0 0 20px rgba(201, 169, 98, 0.1)',
            '0 0 40px rgba(201, 169, 98, 0.3)',
            '0 0 20px rgba(201, 169, 98, 0.1)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Loading text */}
      <motion.p
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs tracking-[0.2em] uppercase whitespace-nowrap"
        style={{
          fontFamily: '"Montserrat", sans-serif',
          color: 'rgba(201, 169, 98, 0.7)',
        }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        识别云彩中...
      </motion.p>
    </div>
  );
}
