import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Cloud } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<string | null>;
  onRegister: (email: string, password: string) => Promise<string | null>;
}

export function LoginPage({ onLogin, onRegister }: LoginPageProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const onFocus = () => setKeyboardVisible(true);
    const onBlur = () => setKeyboardVisible(false);

    // 监听所有 input 的 focus/blur 来判断键盘是否弹出
    document.addEventListener('focusin', onFocus);
    document.addEventListener('focusout', onBlur);
    return () => {
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('focusout', onBlur);
    };
  }, []);

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = async () => {
    setError('');

    if (!email.trim()) { setError('请输入邮箱'); return; }
    if (!validateEmail(email)) { setError('请输入有效的邮箱地址'); return; }
    if (!password) { setError('请输入密码'); return; }
    if (password.length < 6) { setError('密码至少 6 位'); return; }

    if (isRegister) {
      if (password !== confirmPassword) { setError('两次密码不一致'); return; }
      setLoading(true);
      const err = await onRegister(email, password);
      if (err) { setError(err); setLoading(false); }
    } else {
      setLoading(true);
      const err = await onLogin(email, password);
      if (err) { setError(err); setLoading(false); }
    }
  };

  const switchMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setConfirmPassword('');
  };

  return (
    <motion.div
      className="relative w-full flex flex-col items-center justify-center px-6"
      style={{ height: '100%' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo area — 键盘弹出时缩小 */}
      <motion.div
        className="flex flex-col items-center overflow-hidden"
        initial={{ opacity: 0, y: -30 }}
        animate={{
          opacity: 1,
          y: 0,
          height: keyboardVisible ? 0 : 'auto',
          marginBottom: keyboardVisible ? 0 : 40,
        }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Cloud className="w-12 h-12 text-[#c9a962]/70 mb-3" />
        </motion.div>
        <h1
          className="text-3xl tracking-[0.2em] font-light text-gray-800"
          style={{ fontFamily: '"Cormorant Garamond", serif' }}
        >
          Cloud Collection
        </h1>
        <p
          className="text-[11px] tracking-[0.15em] text-gray-400 mt-1.5 uppercase"
          style={{ fontFamily: '"Montserrat", sans-serif' }}
        >
          你的云彩图鉴之旅
        </p>
      </motion.div>

      {/* Login card */}
      <motion.div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        }}
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3, type: 'spring', damping: 20 }}
      >
        <div className="px-7 pt-7 pb-6">
          {/* Title */}
          <motion.h2
            className="text-xl tracking-[0.12em] text-gray-700 mb-6 text-center"
            style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 500 }}
            key={isRegister ? 'reg' : 'login'}
            initial={{ opacity: 0, x: isRegister ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {isRegister ? '创建账号' : '欢迎回来'}
          </motion.h2>

          {/* Email */}
          <div className="relative mb-4">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              placeholder="邮箱地址"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(200,200,200,0.4)',
                fontFamily: '"Montserrat", sans-serif',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(201,169,98,0.5)';
                e.target.style.boxShadow = '0 0 0 3px rgba(201,169,98,0.1)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(200,200,200,0.4)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Password */}
          <div className="relative mb-4">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-11 pr-11 py-3 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(200,200,200,0.4)',
                fontFamily: '"Montserrat", sans-serif',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(201,169,98,0.5)';
                e.target.style.boxShadow = '0 0 0 3px rgba(201,169,98,0.1)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(200,200,200,0.4)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              type="button"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Confirm password (register mode) */}
          <AnimatePresence>
            {isRegister && (
              <motion.div
                className="relative mb-4"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="确认密码"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(200,200,200,0.4)',
                    fontFamily: '"Montserrat", sans-serif',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'rgba(201,169,98,0.5)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(201,169,98,0.1)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(200,200,200,0.4)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.p
                className="text-xs text-red-500 mb-3 text-center"
                style={{ fontFamily: '"Montserrat", sans-serif' }}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Submit button */}
          <motion.button
            className="w-full py-3 rounded-xl text-white text-sm tracking-wider relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #c9a962, #b8963a)',
              fontFamily: '"Montserrat", sans-serif',
              fontWeight: 500,
              boxShadow: '0 4px 15px rgba(201,169,98,0.3)',
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                {isRegister ? '注册中...' : '登录中...'}
              </motion.span>
            ) : (
              isRegister ? '注册' : '登录'
            )}
          </motion.button>
        </div>

        {/* Switch mode */}
        <div
          className="px-7 py-4 text-center"
          style={{ borderTop: '1px solid rgba(200,200,200,0.3)' }}
        >
          <button
            className="text-xs text-gray-500 hover:text-[#c9a962] transition-colors"
            style={{ fontFamily: '"Montserrat", sans-serif' }}
            onClick={switchMode}
          >
            {isRegister ? '已有账号？' : '还没有账号？'}
            <span className="text-[#c9a962] ml-1 font-medium">
              {isRegister ? '登录' : '注册'}
            </span>
          </button>
        </div>
      </motion.div>

      {/* Bottom decoration — 键盘弹出时隐藏 */}
      {!keyboardVisible && (
        <motion.p
          className="absolute text-[10px] tracking-[0.1em] text-gray-400"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', fontFamily: '"Montserrat", sans-serif' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          探索天空 · 收集云朵
        </motion.p>
      )}
    </motion.div>
  );
}
