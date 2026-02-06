import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CloudCard, UserCardState, AIAnalysis } from '@/types/cloud';
import { RARITY_CONFIG } from '@/data/rarityConfig';
import { StarProgress } from '@/components/StarProgress';
import {
  ArrowLeft, MapPin, Clock, Cloud, Droplets,
  Layers, Eye, CloudRain, BookOpen, Camera, X,
} from 'lucide-react';

interface DetailPageProps {
  card: CloudCard;
  cardState: UserCardState;
  aiAnalysis?: AIAnalysis;
  onBack: () => void;
}

// 毛玻璃卡片样式
const glassCard = {
  background: 'rgba(255,255,255,0.4)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.5)',
};

// 段落标题组件
function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-gray-500">{icon}</span>
      <h3
        className="text-sm tracking-wider uppercase text-gray-500"
        style={{ fontFamily: '"Montserrat", sans-serif' }}
      >
        {title}
      </h3>
    </div>
  );
}

// 获取最新的 AI 分析（从 props 或 litRecords 中取）
function getLatestAIAnalysis(
  propAnalysis?: AIAnalysis,
  cardState?: UserCardState,
): AIAnalysis | undefined {
  if (propAnalysis) return propAnalysis;
  // 从最新的 litRecord 中取
  if (cardState?.litRecords) {
    for (let i = cardState.litRecords.length - 1; i >= 0; i--) {
      if (cardState.litRecords[i].aiAnalysis) {
        return cardState.litRecords[i].aiAnalysis;
      }
    }
  }
  return undefined;
}

export function DetailPage({ card, cardState, aiAnalysis: propAiAnalysis, onBack }: DetailPageProps) {
  const rarity = RARITY_CONFIG[card.rarity];
  const isLit = cardState.status === 'lit';
  const aiAnalysis = getLatestAIAnalysis(propAiAnalysis, cardState);
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  let delayIdx = 0;
  const nextDelay = () => 0.3 + (delayIdx++) * 0.08;

  return (
    <motion.div
      className="relative w-full min-h-screen overflow-y-auto pb-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div
        className="sticky top-0 z-30 flex items-center justify-between px-6 py-4"
        style={{
          background: 'rgba(232, 244, 252, 0.9)',
          backdropFilter: 'blur(12px)',
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.button
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          style={{ fontFamily: '"Montserrat", sans-serif' }}
          onClick={onBack}
          whileHover={{ x: -2 }}
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </motion.button>

        <h1
          className="text-lg tracking-[0.15em] font-light"
          style={{ fontFamily: '"Cormorant Garamond", serif' }}
        >
          Cloud Collection
        </h1>

        <div className="w-16" />
      </motion.div>

      {/* Card hero section */}
      <div className="flex flex-col items-center px-6 pt-8">
        {/* Icon */}
        <motion.div
          className="text-6xl mb-4"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        >
          {card.icon}
        </motion.div>

        {/* Name */}
        <motion.h2
          className="text-3xl font-medium tracking-wide text-gray-800"
          style={{ fontFamily: '"Cormorant Garamond", serif' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {card.name}
        </motion.h2>

        {/* Latin name */}
        <motion.p
          className="text-sm text-gray-500 italic tracking-wider mt-1"
          style={{ fontFamily: '"Montserrat", sans-serif' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {card.latin}
        </motion.p>

        {/* Rarity badge */}
        <motion.div
          className="mt-3"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span
            className="px-4 py-1.5 rounded-full text-xs tracking-wider uppercase font-medium"
            style={{
              fontFamily: '"Montserrat", sans-serif',
              background: rarity.glow,
              color: rarity.border,
              border: `1px solid ${rarity.border}`,
            }}
          >
            {rarity.label} · +{card.score}分
          </span>
        </motion.div>

        {/* Star progress */}
        {isLit && (
          <motion.div
            className="mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <StarProgress litCount={cardState.litCount} size="md" />
          </motion.div>
        )}
      </div>

      {/* Content sections */}
      <div className="px-6 mt-8 max-w-lg mx-auto space-y-5">

        {/* ─── AI 分析区域（仅当有 AI 分析时展示） ─── */}
        {aiAnalysis && (
          <>
            {/* 云族 */}
            {aiAnalysis.family && (
              <motion.div
                className="rounded-xl p-5"
                style={glassCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: nextDelay() }}
              >
                <SectionTitle icon={<Layers className="w-4 h-4" />} title="云族" />
                <p className="text-sm text-gray-700 leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '15px' }}>
                  {aiAnalysis.family}
                </p>
              </motion.div>
            )}

            {/* 云属 */}
            {aiAnalysis.genus && (
              <motion.div
                className="rounded-xl p-5"
                style={glassCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: nextDelay() }}
              >
                <SectionTitle icon={<Cloud className="w-4 h-4" />} title="云属" />
                <p className="text-sm text-gray-700 leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '15px' }}>
                  {aiAnalysis.genus}
                </p>
              </motion.div>
            )}

            {/* 云种/变种 */}
            {aiAnalysis.species && (
              <motion.div
                className="rounded-xl p-5"
                style={glassCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: nextDelay() }}
              >
                <SectionTitle icon={<Eye className="w-4 h-4" />} title="云种 / 变种" />
                <p className="text-sm text-gray-700 leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '15px' }}>
                  {aiAnalysis.species}
                </p>
              </motion.div>
            )}

            {/* AI 识别特征 */}
            {aiAnalysis.features && (
              <motion.div
                className="rounded-xl p-5"
                style={glassCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: nextDelay() }}
              >
                <SectionTitle icon={<Eye className="w-4 h-4" />} title="识别特征" />
                <p className="text-sm text-gray-700 leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '15px' }}>
                  {aiAnalysis.features}
                </p>
              </motion.div>
            )}

            {/* AI 天气预兆 */}
            {aiAnalysis.weather && (
              <motion.div
                className="rounded-xl p-5"
                style={glassCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: nextDelay() }}
              >
                <SectionTitle icon={<CloudRain className="w-4 h-4" />} title="天气预兆" />
                <p className="text-sm text-gray-700 leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '15px' }}>
                  {aiAnalysis.weather}
                </p>
              </motion.div>
            )}

            {/* AI 知识延伸 */}
            {aiAnalysis.knowledge && (
              <motion.div
                className="rounded-xl p-5"
                style={glassCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: nextDelay() }}
              >
                <SectionTitle icon={<BookOpen className="w-4 h-4" />} title="知识延伸" />
                <p className="text-sm text-gray-700 leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '15px' }}>
                  {aiAnalysis.knowledge}
                </p>
              </motion.div>
            )}
          </>
        )}

        {/* ─── 基础信息区域（来自本地数据库） ─── */}

        {/* Description */}
        <motion.div
          className="rounded-xl p-5"
          style={glassCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: nextDelay() }}
        >
          <SectionTitle icon={<Cloud className="w-4 h-4" />} title="描述" />
          <p
            className="text-sm text-gray-700 leading-relaxed"
            style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '15px' }}
          >
            {card.description}
          </p>
        </motion.div>

        {/* Features tags (from card data) */}
        <motion.div
          className="rounded-xl p-5"
          style={glassCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: nextDelay() }}
        >
          <h3
            className="text-sm tracking-wider uppercase text-gray-500 mb-3"
            style={{ fontFamily: '"Montserrat", sans-serif' }}
          >
            快速识别
          </h3>
          <div className="flex flex-wrap gap-2">
            {card.features.map((feature, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full text-xs text-gray-600"
                style={{
                  background: 'rgba(201,169,98,0.1)',
                  border: '1px solid rgba(201,169,98,0.2)',
                  fontFamily: '"Montserrat", sans-serif',
                }}
              >
                {feature}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Weather (from card data, only if no AI weather) */}
        {card.weather && !aiAnalysis?.weather && (
          <motion.div
            className="rounded-xl p-5"
            style={glassCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: nextDelay() }}
          >
            <SectionTitle icon={<Droplets className="w-4 h-4" />} title="天气预示" />
            <p className="text-sm text-gray-700 leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '15px' }}>
              {card.weather}
            </p>
          </motion.div>
        )}

        {/* When & Where to find */}
        {(card.whenToFind || card.whereToFind) && (
          <motion.div
            className="rounded-xl p-5"
            style={glassCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: nextDelay() }}
          >
            <SectionTitle icon={<MapPin className="w-4 h-4" />} title="寻找指南" />
            {card.whenToFind && (
              <div className="flex items-start gap-2 mb-2">
                <Clock className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">{card.whenToFind}</p>
              </div>
            )}
            {card.whereToFind && (
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">{card.whereToFind}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── 发现记录（带缩略图） ─── */}
        {isLit && cardState.litRecords.length > 0 && (
          <motion.div
            className="rounded-xl p-5"
            style={glassCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: nextDelay() }}
          >
            <SectionTitle icon={<Camera className="w-4 h-4" />} title={`发现记录 (${cardState.litRecords.length})`} />

            {/* Thumbnail grid */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {cardState.litRecords.map((record, i) => {
                const imgSrc = record.thumbnail || record.imageUrl;
                return (
                  <motion.div
                    key={i}
                    className="aspect-square rounded-lg overflow-hidden cursor-pointer relative group"
                    style={{
                      background: 'rgba(200,200,200,0.15)',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => imgSrc && setPreviewImg(imgSrc)}
                  >
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={`第 ${i + 1} 次发现`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">
                        {card.icon}
                      </div>
                    )}
                    {/* Overlay with number */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm py-0.5 text-center">
                      <span className="text-[10px] text-white/90 font-medium">#{i + 1}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Record list */}
            <div className="space-y-1.5">
              {cardState.litRecords.map((record, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-1.5 border-b border-gray-200/30 last:border-0"
                >
                  <span className="text-[10px] text-gray-400 w-6 text-right">#{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-[11px] text-gray-500">
                      {new Date(record.timestamp).toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-400">+{record.earnedScore ?? card.score}分</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ─── 图片预览弹窗 ─── */}
      <AnimatePresence>
        {previewImg && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPreviewImg(null)} />
            <motion.div
              className="relative max-w-[90vw] max-h-[80vh]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <img
                src={previewImg}
                alt="预览"
                className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl"
              />
              <button
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                onClick={() => setPreviewImg(null)}
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
