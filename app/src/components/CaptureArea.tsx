import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ImageIcon } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';

interface CaptureAreaProps {
  onCapture: (file: File) => void;
}

/** Convert raw base64 string to a File object */
function base64ToFile(raw: string, filename: string, mime: string): File {
  const bstr = atob(raw);
  const u8arr = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  return new File([u8arr], filename, { type: mime });
}

async function captureWithNative(source: CameraSource): Promise<File> {
  // Request permissions first
  const perms = await CapCamera.requestPermissions({ permissions: ['camera', 'photos'] });
  if (perms.camera === 'denied' || perms.photos === 'denied') {
    throw new Error('PERMISSION_DENIED');
  }

  const photo = await CapCamera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source,
  });

  if (!photo.base64String) {
    throw new Error('NO_IMAGE_DATA');
  }

  const mime = `image/${photo.format || 'jpeg'}`;
  return base64ToFile(photo.base64String, `cloud_${Date.now()}.${photo.format || 'jpeg'}`, mime);
}

export function CaptureArea({ onCapture }: CaptureAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showMenu, setShowMenu] = useState(false);

  const handleClick = () => {
    if (Capacitor.isNativePlatform()) {
      setShowMenu(true);
    } else {
      // Web fallback: use file input
      inputRef.current?.click();
    }
  };

  const handleNativeCapture = async (source: CameraSource) => {
    setShowMenu(false);
    try {
      const file = await captureWithNative(source);
      onCapture(file);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Ignore user cancellation
      if (msg.includes('cancel') || msg.includes('Cancel') || msg.includes('USER_CANCELLED')) {
        return;
      }
      if (msg === 'PERMISSION_DENIED') {
        alert('请在系统设置中允许访问相机和相册');
        return;
      }
      console.error('Camera capture error:', err);
      if (msg.includes('Simulator') || msg.includes('not available')) {
        alert('模拟器不支持相机，请选择"从相册选择"');
        return;
      }
      alert('获取图片失败: ' + msg);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
      e.target.value = '';
    }
  };

  return (
    <>
      <motion.div
        className="relative cursor-pointer group"
        onClick={handleClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {/* Hidden file input (web fallback) */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />

        {/* Frosted glass container */}
        <div
          className="relative w-72 h-44 rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-3"
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255,255,255,0.4)',
          }}
        >
          {/* Subtle animated border */}
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(201,169,98,0.2) 0%, transparent 50%, rgba(201,169,98,0.2) 100%)',
            }}
            animate={{
              background: [
                'linear-gradient(135deg, rgba(201,169,98,0.2) 0%, transparent 50%, rgba(201,169,98,0.2) 100%)',
                'linear-gradient(225deg, rgba(201,169,98,0.2) 0%, transparent 50%, rgba(201,169,98,0.2) 100%)',
                'linear-gradient(315deg, rgba(201,169,98,0.2) 0%, transparent 50%, rgba(201,169,98,0.2) 100%)',
                'linear-gradient(135deg, rgba(201,169,98,0.2) 0%, transparent 50%, rgba(201,169,98,0.2) 100%)',
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />

          {/* Camera icon */}
          <motion.div
            className="relative"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Camera className="w-10 h-10 text-gray-600/70 group-hover:text-[#c9a962] transition-colors duration-300" />
          </motion.div>

          {/* Main text */}
          <p
            className="text-lg tracking-[0.25em] text-gray-700/80 group-hover:text-gray-800 transition-colors"
            style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 500 }}
          >
            捕捉天空
          </p>

          {/* Sub text */}
          <p
            className="text-[10px] tracking-[0.15em] text-gray-500/60 uppercase"
            style={{ fontFamily: '"Montserrat", sans-serif' }}
          >
            拍照或从相册选择云朵图片
          </p>

          {/* Corner accents */}
          <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-gray-400/20 group-hover:border-[#c9a962]/40 transition-colors" />
          <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-gray-400/20 group-hover:border-[#c9a962]/40 transition-colors" />
          <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-gray-400/20 group-hover:border-[#c9a962]/40 transition-colors" />
          <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-gray-400/20 group-hover:border-[#c9a962]/40 transition-colors" />
        </div>
      </motion.div>

      {/* Native source selection menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowMenu(false)}
            />

            {/* Action sheet */}
            <motion.div
              className="relative w-full max-w-sm mx-4 mb-8"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {/* Options */}
              <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)' }}>
                <button
                  className="w-full flex items-center gap-4 px-6 py-4 text-left active:bg-gray-100 transition-colors"
                  onClick={() => handleNativeCapture(CameraSource.Camera)}
                >
                  <Camera className="w-5 h-5 text-[#c9a962]" />
                  <span className="text-base text-gray-800" style={{ fontFamily: '"Cormorant Garamond", serif' }}>拍照</span>
                </button>
                <div className="h-px bg-gray-200/60 mx-4" />
                <button
                  className="w-full flex items-center gap-4 px-6 py-4 text-left active:bg-gray-100 transition-colors"
                  onClick={() => handleNativeCapture(CameraSource.Photos)}
                >
                  <ImageIcon className="w-5 h-5 text-[#c9a962]" />
                  <span className="text-base text-gray-800" style={{ fontFamily: '"Cormorant Garamond", serif' }}>从相册选择</span>
                </button>
              </div>

              {/* Cancel */}
              <button
                className="w-full mt-2 rounded-2xl py-4 text-center active:bg-gray-100 transition-colors"
                style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)' }}
                onClick={() => setShowMenu(false)}
              >
                <span className="text-base font-medium text-gray-500">取消</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
