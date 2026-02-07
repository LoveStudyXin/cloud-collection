import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CaptureArea } from '@/components/CaptureArea';
import { CloudCarousel } from '@/components/CloudCarousel';
import { PointsDisplay } from '@/components/PointsDisplay';
import { GoldenDecoration } from '@/components/GoldenDecoration';
import { cloudCards } from '@/data/cloudCards';
import type { UserCardState } from '@/types/cloud';
import { BookOpen, MoreVertical, LogOut } from 'lucide-react';

const WELCOME_SHOWN_KEY = 'cloud-collection-welcome-shown';

// Firework particle data - memoized to avoid re-randomizing on re-render
const FIREWORK_PARTICLES = Array.from({ length: 20 }, (_, i) => {
  const angle = (i / 20) * 360;
  const distance = 35 + Math.random() * 25;
  const size = 3 + Math.random() * 2;
  const colors = ['#FFD700', '#c9a962', '#FF6B6B', '#4ECDC4', '#45B7D1', '#f0c27f'];
  return { angle, distance, size, color: colors[i % colors.length], delay: Math.random() * 0.2 };
});

interface HomePageProps {
  points: number;
  getCardState: (cardId: string) => UserCardState;
  onCapture: (file: File) => void;
  onCardClick: (cardId: string) => void;
  onCollectionClick: () => void;
  onLogout: () => void;
}

export function HomePage({ points, getCardState, onCapture, onCardClick, onCollectionClick, onLogout }: HomePageProps) {
  const isNewUser = useRef(!localStorage.getItem(WELCOME_SHOWN_KEY));
  const [showWelcome, setShowWelcome] = useState(isNewUser.current);
  const [cardsRevealed, setCardsRevealed] = useState(!isNewUser.current);
  const [animatedPoints, setAnimatedPoints] = useState(isNewUser.current ? 0 : points);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!isNewUser.current) return;
    localStorage.setItem(WELCOME_SHOWN_KEY, '1');

    // Timeline:
    // 0.0s  - Toast slides in with fireworks
    // 1.5s  - Points count up 0→30 (PointsDisplay handles animation)
    // 2.5s  - Toast slides out
    // 3.0s  - Cards revealed with spring animation in carousel area
    // 4.0s  - Welcome fully done

    const t1 = setTimeout(() => setAnimatedPoints(points), 1500);
    const t2 = setTimeout(() => setShowWelcome(false), 2500);
    const t3 = setTimeout(() => setCardsRevealed(true), 3000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Get cards that user has lit or unlocked (for carousel display)
  const displayCards = useMemo(() => cloudCards.filter(c => {
    const status = getCardState(c.id).status;
    return status === 'lit' || status === 'unlocked';
  }), [getCardState]);

  // Check if user has any lit cards yet
  const hasLitCards = displayCards.some(c => getCardState(c.id).status === 'lit');

  return (
    <motion.div
      className="relative w-full flex flex-col items-center overflow-hidden"
      style={{ height: '100%' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div
        className="w-full flex items-center justify-between px-6 pb-2 z-20"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h1
          className="text-2xl tracking-[0.15em] font-light"
          style={{ fontFamily: '"Cormorant Garamond", serif' }}
        >
          Cloud Collection
        </h1>
        <div className="flex items-center gap-2">
          <PointsDisplay points={animatedPoints} />
          <div className="relative">
            <button
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setShowMenu(prev => !prev)}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                  <motion.div
                    className="absolute right-0 top-full mt-1 z-40 rounded-lg py-1 min-w-[120px]"
                    style={{
                      background: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(0,0,0,0.08)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    }}
                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                      style={{ fontFamily: '"Montserrat", sans-serif' }}
                      onClick={() => {
                        setShowMenu(false);
                        onLogout();
                      }}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      退出登录
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full px-4 py-8">
        <CaptureArea onCapture={onCapture} />

        {/* Cloud card carousel area */}
        <div className="w-full max-w-3xl">
          {cardsRevealed ? (
            <motion.div
              initial={isNewUser.current ? { opacity: 0, scale: 0.8, y: 20 } : false}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 15, stiffness: 150 }}
            >
              {/* Guidance for new users */}
              {!hasLitCards && displayCards.length > 0 && (
                <motion.p
                  className="text-center text-xs text-gray-400 tracking-wider mb-3"
                  style={{ fontFamily: '"Montserrat", sans-serif' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  拍摄天空中的云朵，点亮你的第一张卡牌
                </motion.p>
              )}
              <CloudCarousel
                cards={displayCards}
                getCardState={getCardState}
                onCardClick={(card) => onCardClick(card.id)}
              />
            </motion.div>
          ) : (
            /* Placeholder while cards are hidden during welcome */
            <div className="h-[350px]" />
          )}
        </div>
      </div>

      {/* Golden decoration at bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[60%] opacity-30">
        <GoldenDecoration size={300} />
      </div>

      {/* Collection button */}
      <motion.div
        className="absolute right-8 z-20 flex items-center gap-4"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        <motion.button
          className="flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-gray-500 hover:text-[#c9a962] transition-colors"
          style={{ fontFamily: '"Montserrat", sans-serif' }}
          onClick={onCollectionClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <BookOpen className="w-4 h-4" />
          图鉴
        </motion.button>
      </motion.div>

      {/* Welcome toast */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            className="fixed top-6 left-1/2 z-50 w-[calc(100%-3rem)] max-w-xs"
            style={{ x: '-50%' }}
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 250 }}
          >
            <div
              className="relative rounded-2xl px-5 py-4 text-center overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(201,169,98,0.25)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
              }}
            >
              {/* Firework particles */}
              <div className="absolute inset-0 pointer-events-none">
                {FIREWORK_PARTICLES.map((p, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: p.size,
                      height: p.size,
                      background: p.color,
                      left: '50%',
                      top: '45%',
                    }}
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                    animate={{
                      x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
                      y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
                      opacity: [0, 1, 1, 0],
                      scale: [0, 1.2, 1, 0],
                    }}
                    transition={{ duration: 0.8, delay: 0.3 + p.delay, ease: 'easeOut' }}
                  />
                ))}
              </div>

              <motion.p
                className="text-sm text-gray-700 mb-1 relative z-10"
                style={{ fontFamily: '"Cormorant Garamond", serif' }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                欢迎来到 Cloud Collection
              </motion.p>
              <motion.p
                className="text-[11px] text-gray-500 relative z-10"
                style={{ fontFamily: '"Montserrat", sans-serif' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                赠送 <span className="font-medium text-[#c9a962]">30 积分</span> 和 <span className="font-medium text-[#c9a962]">3 张卡牌</span>
              </motion.p>
              <motion.p
                className="text-[10px] text-gray-400 mt-1 relative z-10"
                style={{ fontFamily: '"Montserrat", sans-serif' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                探索天空，收集云朵，祝你开心
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
