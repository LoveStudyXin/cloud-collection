import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NavigationArrowsProps {
  onPrev: () => void;
  onNext: () => void;
}

export function NavigationArrows({ onPrev, onNext }: NavigationArrowsProps) {
  return (
    <>
      {/* Left Arrow */}
      <motion.button
        className="absolute left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/90 flex items-center justify-center"
        style={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
        }}
        onClick={onPrev}
        whileHover={{ 
          scale: 1.1,
          backgroundColor: '#c9a962'
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.3 }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <ChevronLeft className="w-6 h-6 text-gray-800" />
      </motion.button>

      {/* Right Arrow */}
      <motion.button
        className="absolute right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/90 flex items-center justify-center"
        style={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
        }}
        onClick={onNext}
        whileHover={{ 
          scale: 1.1,
          backgroundColor: '#c9a962'
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.3 }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <ChevronRight className="w-6 h-6 text-gray-800" />
      </motion.button>
    </>
  );
}
