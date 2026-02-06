# Dior 塔罗牌网站技术规划

## 组件清单

### shadcn/ui 组件
- `Button` - 底部操作按钮

### 自定义组件

| 组件名 | 用途 | 位置 |
|--------|------|------|
| `TarotCarousel` | 塔罗牌轮播容器 | components/TarotCarousel.tsx |
| `TarotCard` | 单张塔罗牌 | components/TarotCard.tsx |
| `GoldenDecoration` | 金色太阳装饰 | components/GoldenDecoration.tsx |
| `CloudBackground` | 云朵背景 | components/CloudBackground.tsx |
| `NavigationArrows` | 左右导航箭头 | components/NavigationArrows.tsx |
| `AnimatedTitle` | 动画标题文字 | components/AnimatedTitle.tsx |

### 页面组件

| 页面 | 路径 | 描述 |
|------|------|------|
| `HeroPage` | pages/HeroPage.tsx | 塔罗牌轮播主页面 |
| `ResultPage` | pages/ResultPage.tsx | 塔罗牌结果展示页面 |

## 动画实现方案

| 动画 | 库 | 实现方式 | 复杂度 |
|------|-----|---------|--------|
| 页面加载淡入 | Framer Motion | AnimatePresence + motion.div | 中 |
| 塔罗牌轮播切换 | Framer Motion | animate + layoutId | 高 |
| 卡片悬停上浮 | Framer Motion | whileHover + transform | 低 |
| 金色装饰旋转 | CSS Animation | @keyframes rotate | 低 |
| 标题逐字淡入 | Framer Motion | staggerChildren | 中 |
| 导航箭头悬停 | Framer Motion | whileHover + background | 低 |
| 云朵飘动 | CSS Animation | @keyframes float | 低 |
| 滚动触发显示 | Framer Motion | useInView + variants | 中 |

## 项目结构

```
app/
├── src/
│   ├── components/
│   │   ├── TarotCarousel.tsx
│   │   ├── TarotCard.tsx
│   │   ├── GoldenDecoration.tsx
│   │   ├── CloudBackground.tsx
│   │   ├── NavigationArrows.tsx
│   │   └── AnimatedTitle.tsx
│   ├── pages/
│   │   ├── HeroPage.tsx
│   │   └── ResultPage.tsx
│   ├── hooks/
│   │   └── useTarotCarousel.ts
│   ├── data/
│   │   └── tarotCards.ts
│   ├── types/
│   │   └── tarot.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── images/
│       ├── tarot/
│       │   ├── star.jpg
│       │   ├── moon.jpg
│       │   ├── sun.jpg
│       │   ├── empress.jpg
│       │   └── fool.jpg
│       ├── background/
│       │   └── sky-clouds.jpg
│       └── decoration/
│           ├── golden-sun.png
│           └── stars.png
├── index.html
└── package.json
```

## 依赖安装

```bash
# 动画库
npm install framer-motion

# 图标库
npm install lucide-react

# 字体
npm install @fontsource/cormorant-garamond @fontsource/montserrat @fontsource/playfair-display
```

## 关键实现细节

### 塔罗牌轮播逻辑
- 使用中心索引管理当前卡片
- 两侧卡片根据距离中心的偏移量计算位置和缩放
- 使用 Framer Motion 的 layoutId 实现平滑切换

### 弧形排列算法
```typescript
// 卡片位置计算
const getCardStyle = (index: number, centerIndex: number) => {
  const offset = index - centerIndex;
  const angle = offset * 15; // 每卡片间隔15度
  const radius = 300; // 弧形半径
  const x = Math.sin(angle * Math.PI / 180) * radius;
  const y = Math.abs(offset) * 20; // 越远离中心越靠下
  const scale = offset === 0 ? 1.1 : 0.85;
  const opacity = offset === 0 ? 1 : 0.6;
  return { x, y, scale, opacity };
};
```

### 金色装饰旋转
- 使用 CSS @keyframes 实现无限旋转
- 旋转周期：60s 一圈
- 使用 will-change: transform 优化性能

### 响应式断点
- Desktop: 1440px+
- Tablet: 768px - 1439px
- Mobile: < 768px

## 性能优化

1. 图片懒加载
2. 使用 transform 和 opacity 进行动画
3. 添加 will-change 提示
4. 支持 prefers-reduced-motion
5. 使用 React.memo 优化卡片组件
