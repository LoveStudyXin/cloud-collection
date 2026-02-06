import { motion } from 'framer-motion';
import { TarotCarousel } from '@/components/TarotCarousel';

interface HeroPageProps {
  onDiscover: () => void;
}

export function HeroPage({ onDiscover }: HeroPageProps) {
  return (
    <motion.div
      className="relative w-full h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <TarotCarousel onDiscover={onDiscover} />
    </motion.div>
  );
}
