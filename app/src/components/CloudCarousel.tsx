import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavigationArrows } from './NavigationArrows';
import { CloudCardComponent } from './CloudCard';
import type { CloudCard, UserCardState } from '@/types/cloud';

interface CloudCarouselProps {
  cards: CloudCard[];
  getCardState: (cardId: string) => UserCardState;
  onCardClick?: (card: CloudCard) => void;
}

export function CloudCarousel({ cards, getCardState, onCardClick }: CloudCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(Math.min(2, Math.max(0, cards.length - 1)));

  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => (prev === 0 ? cards.length - 1 : prev - 1));
  }, [cards.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev === cards.length - 1 ? 0 : prev + 1));
  }, [cards.length]);

  const handleCardClick = useCallback((index: number) => {
    if (index === currentIndex) {
      onCardClick?.(cards[index]);
    } else {
      setCurrentIndex(index);
    }
  }, [currentIndex, cards, onCardClick]);

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px]">
        <motion.p
          className="text-sm text-gray-400 tracking-wider"
          style={{ fontFamily: '"Montserrat", sans-serif' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          捕捉天空，开始你的云彩图鉴之旅
        </motion.p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[350px] flex items-center justify-center">
      <NavigationArrows onPrev={handlePrev} onNext={handleNext} />

      <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          {cards.map((card, index) => {
            const offset = index - currentIndex;
            const isCenter = offset === 0;
            const angle = offset * 14;
            const radius = 260;
            const x = Math.sin((angle * Math.PI) / 180) * radius;
            const y = Math.abs(offset) * 12;
            const scale = isCenter ? 1.05 : 0.8 - Math.abs(offset) * 0.05;
            const opacity = isCenter ? 1 : 0.5 - Math.abs(offset) * 0.1;
            const zIndex = 10 - Math.abs(offset);
            const rotateY = offset * -8;

            if (Math.abs(offset) > 3) return null;

            return (
              <motion.div
                key={card.id}
                className="absolute cursor-pointer"
                style={{ zIndex }}
                initial={false}
                animate={{
                  x,
                  y,
                  scale,
                  opacity: Math.max(opacity, 0.2),
                  rotateY,
                }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                whileHover={isCenter ? { y: y - 10, scale: scale * 1.02 } : {}}
                onClick={() => handleCardClick(index)}
              >
                <CloudCardComponent
                  card={card}
                  cardState={getCardState(card.id)}
                  size="sm"
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Card counter */}
      <motion.div
        className="absolute bottom-2 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p
          className="text-[10px] text-gray-400 tracking-wider"
          style={{ fontFamily: '"Montserrat", sans-serif' }}
        >
          {currentIndex + 1} / {cards.length}
        </p>
      </motion.div>
    </div>
  );
}
