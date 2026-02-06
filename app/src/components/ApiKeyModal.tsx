import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, X } from 'lucide-react';
import { getApiKey, setApiKey } from '@/services/cloudRecognition';

interface ApiKeyModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function ApiKeyModal({ open, onClose, onSaved }: ApiKeyModalProps) {
  const [key, setKey] = useState(getApiKey);
  const [error, setError] = useState('');

  const handleSave = () => {
    const trimmed = key.trim();
    if (!trimmed) {
      setError('请输入有效的 API Key');
      return;
    }
    setApiKey(trimmed);
    setError('');
    onSaved();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            className="relative w-[340px] rounded-2xl p-6"
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            }}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Close button */}
            <button
              className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #c9a962, #e8d5a3)',
                }}
              >
                <Key className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Title */}
            <h3
              className="text-center text-lg font-light text-gray-800 mb-1"
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              配置 API Key
            </h3>
            <p className="text-center text-xs text-gray-400 mb-5">
              使用阿里云百炼 DashScope 进行 AI 云朵识别
            </p>

            {/* Input */}
            <input
              type="password"
              value={key}
              onChange={e => { setKey(e.target.value); setError(''); }}
              placeholder="请输入 DashScope API Key"
              className="w-full px-4 py-3 rounded-xl text-sm bg-white/60 border border-gray-200
                focus:border-[#c9a962] focus:outline-none focus:ring-1 focus:ring-[#c9a962]/30
                placeholder:text-gray-300 transition-colors"
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />

            {error && (
              <p className="text-xs text-red-400 mt-2 pl-1">{error}</p>
            )}

            {/* Hint */}
            <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
              前往{' '}
              <a
                href="https://dashscope.console.aliyun.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#c9a962] underline"
              >
                阿里云百炼控制台
              </a>
              {' '}获取 API Key，Key 仅保存在本地浏览器中。
            </p>

            {/* Button */}
            <button
              className="w-full mt-5 py-3 rounded-xl text-sm tracking-wider text-white transition-all
                hover:shadow-lg active:scale-[0.98]"
              style={{
                fontFamily: '"Montserrat", sans-serif',
                background: 'linear-gradient(135deg, #c9a962, #b8963a)',
              }}
              onClick={handleSave}
            >
              保存并开始识别
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
