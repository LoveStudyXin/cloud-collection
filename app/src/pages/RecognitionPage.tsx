import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RecognitionLoader } from '@/components/RecognitionLoader';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import type { RecognitionResult } from '@/types/cloud';
import { recognizeCloud, hasApiKey } from '@/services/cloudRecognition';

interface RecognitionPageProps {
  imageUrl?: string;
  imageFile?: File;
  onRecognitionComplete: (result: RecognitionResult) => void;
  onError: (error: string) => void;
}

export function RecognitionPage({ imageUrl, imageFile, onRecognitionComplete, onError }: RecognitionPageProps) {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [statusText, setStatusText] = useState('正在分析云彩特征...');
  const [started, setStarted] = useState(false);

  const startRecognition = () => {
    if (started) return;
    setStarted(true);

    if (!imageFile) {
      onError('没有选择图片');
      return;
    }

    if (!hasApiKey()) {
      setShowApiKeyModal(true);
      setStarted(false);
      return;
    }

    setStatusText('正在调用 AI 识别...');

    recognizeCloud(imageFile)
      .then(result => {
        onRecognitionComplete(result);
      })
      .catch(err => {
        const msg = err.message;
        if (msg === 'NO_API_KEY' || msg === 'API_KEY_INVALID') {
          setShowApiKeyModal(true);
          setStarted(false);
          setStatusText('请先配置 API Key');
        } else if (msg === 'NO_CLOUD_DETECTED') {
          onError('未能识别到云彩，试试上传其他天空照片吧');
        } else {
          onError('识别失败: ' + msg);
        }
      });
  };

  useEffect(() => {
    startRecognition();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApiKeySaved = () => {
    setShowApiKeyModal(false);
    setStarted(false);
    // 重新触发识别
    setTimeout(() => startRecognition(), 100);
  };

  return (
    <motion.div
      className="relative w-full h-screen flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo */}
      <motion.div
        className="absolute top-8 left-0 right-0 z-20 text-center"
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

      {/* API Key Modal */}
      <ApiKeyModal
        open={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSaved={handleApiKeySaved}
      />
    </motion.div>
  );
}
