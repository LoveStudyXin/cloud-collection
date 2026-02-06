import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TarotCardComponent } from './TarotCard';
import { NavigationArrows } from './NavigationArrows';
import { GoldenDecoration } from './GoldenDecoration';
import { tarotCards } from '@/data/tarotCards';
import { ArrowRight } from 'lucide-react';

interface TarotCarouselProps {
  onDiscover?: () => void;
}

export function TarotCarousel({ onDiscover }: TarotCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(2); // Start with The Sun in center

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? tarotCards.length - 1 : prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === tarotCards.length - 1 ? 0 : prev + 1));
  }, []);

  const handleCardClick = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* DIOR Logo */}
      <motion.div
        className="absolute top-8 left-1/2 -translate-x-1/2 z-20"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
      >
        <h1 
          className="text-3xl tracking-[0.3em] font-normal"
          style={{ fontFamily: '"Cormorant Garamond", serif' }}
        >
          DIOR
        </h1>
      </motion.div>

      {/* Navigation Arrows */}
      <NavigationArrows onPrev={handlePrev} onNext={handleNext} />

      {/* Cards Container */}
      <div className="relative w-full max-w-4xl h-[400px] flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          {tarotCards.map((card, index) => (
            <TarotCardComponent
              key={card.id}
              card={card}
              index={index}
              centerIndex={currentIndex}
              onClick={() => handleCardClick(index)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Golden Sun Decoration */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
        <GoldenDecoration size={400} />
      </div>

      {/* Discover Button */}
      <motion.div
        className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        <motion.button
          className="group flex items-center gap-2 text-sm font-semibold tracking-[0.2em] uppercase text-gray-800"
          onClick={onDiscover}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="relative">
            Discover This Card
            <span className="absolute bottom-0 left-0 w-full h-px bg-gray-800 transform origin-left scale-x-100 group-hover:scale-x-0 transition-transform duration-300" />
            <span className="absolute bottom-0 left-0 w-full h-px bg-[#c9a962] transform origin-right scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
          </span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </motion.div>

      {/* Bottom Links */}
      <motion.div
        className="absolute bottom-6 right-8 z-20 flex items-center gap-4 text-xs tracking-wider"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        <button className="text-gray-600 hover:text-gray-900 transition-colors">
          Terms & Conditions
        </button>
        <span className="text-gray-400">|</span>
        <button 
          className="w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center text-gray-600 hover:border-gray-800 hover:text-gray-900 transition-colors"
          onClick={onDiscover}
        >
          D
        </button>
      </motion.div>
    </div>
  );
}
