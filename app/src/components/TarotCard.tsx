import { motion } from 'framer-motion';
import type { TarotCard } from '@/types/tarot';

interface TarotCardProps {
  card: TarotCard;
  index: number;
  centerIndex: number;
  onClick?: () => void;
}

export function TarotCardComponent({ card, index, centerIndex, onClick }: TarotCardProps) {
  const offset = index - centerIndex;
  const isCenter = offset === 0;
  
  // Calculate position based on offset from center
  const angle = offset * 12; // 12 degrees between cards
  const radius = 280; // Arc radius
  const x = Math.sin(angle * Math.PI / 180) * radius;
  const y = Math.abs(offset) * 15; // Cards further from center are slightly lower
  const scale = isCenter ? 1.1 : 0.85 - Math.abs(offset) * 0.05;
  const opacity = isCenter ? 1 : 0.5 - Math.abs(offset) * 0.1;
  const zIndex = 10 - Math.abs(offset);
  const rotateY = offset * -8; // Slight rotation for 3D effect

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        width: 180,
        height: 315,
        zIndex,
        perspective: 1000
      }}
      initial={false}
      animate={{
        x,
        y,
        scale,
        opacity: Math.max(opacity, 0.2),
        rotateY
      }}
      transition={{
        duration: 0.5,
        ease: 'easeInOut'
      }}
      whileHover={isCenter ? {
        y: y - 15,
        scale: scale * 1.02,
        transition: { duration: 0.3 }
      } : {}}
      onClick={onClick}
    >
      <div 
        className="w-full h-full rounded-lg overflow-hidden"
        style={{
          boxShadow: isCenter 
            ? '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(201, 169, 98, 0.2)'
            : '0 10px 30px rgba(0, 0, 0, 0.2)',
          border: '2px solid #d4af37',
          background: 'linear-gradient(135deg, #fff 0%, #f8f4e8 100%)'
        }}
      >
        <img
          src={card.image}
          alt={card.name}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Card name label (only for center card) */}
      {isCenter && (
        <motion.div
          className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-sm font-medium tracking-widest text-gray-700 uppercase">
            {card.name}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
