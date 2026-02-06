import { motion } from 'framer-motion';

interface GoldenDecorationProps {
  className?: string;
  size?: number;
}

export function GoldenDecoration({ className = '', size = 300 }: GoldenDecorationProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
    >
      {/* Rotating sun decoration */}
      <motion.img
        src="/images/decoration/golden-sun.png"
        alt="Golden Sun"
        className="w-full h-full object-contain"
        style={{
          filter: 'drop-shadow(0 4px 20px rgba(201, 169, 98, 0.4))'
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
      
      {/* Inner glow */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(201, 169, 98, 0.2) 0%, transparent 70%)'
        }}
      />
    </motion.div>
  );
}
