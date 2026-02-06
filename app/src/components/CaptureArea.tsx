import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';

interface CaptureAreaProps {
  onCapture: (file: File) => void;
}

export function CaptureArea({ onCapture }: CaptureAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  return (
    <motion.div
      className="relative cursor-pointer group"
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
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
          轻触以捕捉你看到的云朵
        </p>

        {/* Corner accents */}
        <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-gray-400/20 group-hover:border-[#c9a962]/40 transition-colors" />
        <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-gray-400/20 group-hover:border-[#c9a962]/40 transition-colors" />
        <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-gray-400/20 group-hover:border-[#c9a962]/40 transition-colors" />
        <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-gray-400/20 group-hover:border-[#c9a962]/40 transition-colors" />
      </div>
    </motion.div>
  );
}
