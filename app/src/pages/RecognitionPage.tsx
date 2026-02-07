import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RecognitionLoader } from '@/components/RecognitionLoader';
import type { RecognitionResult } from '@/types/cloud';
import { recognizeCloud } from '@/services/cloudRecognition';

interface RecognitionPageProps {
  imageUrl?: string;
  imageFile?: File;
  onRecognitionComplete: (result: RecognitionResult) => void;
  onError: (error: string) => void;
}

export function RecognitionPage({ imageUrl, imageFile, onRecognitionComplete, onError }: RecognitionPageProps) {
  const [statusText, setStatusText] = useState('正在分析云彩特征...');
  const [started, setStarted] = useState(false);

  const startRecognition = () => {
    if (started) return;
    setStarted(true);

    if (!imageFile) {
      onError('没有选择图片');
      return;
    }

    setStatusText('正在调用 AI 识别...');

    recognizeCloud(imageFile)
      .then(result => {
        onRecognitionComplete(result);
      })
      .catch(err => {
        const msg = err.message;
        if (msg === 'NOT_LOGGED_IN') {
          onError('登录已过期，请重新登录');
        } else if (msg === 'NO_CLOUD_DETECTED') {
          onError('未能识别到云彩，试试上传其他天空照片吧');
        } else if (msg === 'DUPLICATE_IMAGE') {
          onError('这张照片已经识别过了，换一张新的试试吧');
        } else {
          onError('识别失败: ' + msg);
        }
      });
  };

  useEffect(() => {
    startRecognition();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      className="relative w-full flex flex-col items-center justify-center"
      style={{ height: '100%' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo */}
      <motion.div
        className="absolute left-0 right-0 z-20 text-center"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
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
      </motion.div>

      {/* Recognition loader */}
      <RecognitionLoader imageUrl={imageUrl} />

      {/* Bottom hint */}
      <motion.p
        className="absolute bottom-12 text-xs text-gray-400 tracking-wider"
        style={{ fontFamily: '"Montserrat", sans-serif' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {statusText}
      </motion.p>
    </motion.div>
  );
}
