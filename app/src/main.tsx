import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// iOS: 多重防御 — 防止键盘弹出时 WebView 自动滚动
const resetScroll = () => {
  window.scrollTo(0, 0);
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
};

document.addEventListener('focusin', () => {
  resetScroll();
  setTimeout(resetScroll, 50);
  setTimeout(resetScroll, 150);
  setTimeout(resetScroll, 300);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
