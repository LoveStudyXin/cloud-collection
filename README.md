# Cloud Collection - 云朵收集

一款云朵识别与收集的移动应用。用户拍摄天空中的云朵，通过 AI（阿里云 DashScope qwen-vl-plus）自动识别云的种类，以卡牌形式收集不同类型的云，附带积分和稀有度系统。

## 技术栈

**前端（`app/`）**
- React 19 + TypeScript + Vite 7
- Tailwind CSS 3 + shadcn/ui（Radix UI）
- Framer Motion 动画
- Capacitor 7（打包 iOS / Android 原生应用）

**后端（`server/`）**
- Python FastAPI + Uvicorn
- SQLite 数据库
- 阿里云 DashScope API（qwen-vl-plus 视觉模型）
- JWT 认证 + imagehash 防刷

## 项目结构

```
.
├── app/                        # 前端应用
│   ├── src/
│   │   ├── components/         # UI 组件（CloudCarousel, TarotCard, PointsDisplay 等）
│   │   ├── pages/              # 页面（Login, Home, Recognition, Result, Detail, Collection）
│   │   ├── hooks/              # 自定义 hooks（useAuth, useUserState）
│   │   ├── data/               # 云朵卡牌数据
│   │   ├── services/           # API 调用 & 云朵识别服务
│   │   ├── types/              # TypeScript 类型定义
│   │   └── App.tsx             # 主路由（基于 ViewState 状态切换页面）
│   ├── ios/                    # Capacitor iOS 工程
│   ├── android/                # Capacitor Android 工程
│   ├── capacitor.config.ts     # Capacitor 配置
│   └── package.json
├── server/                     # 后端 API
│   ├── main.py                 # FastAPI 应用（用户注册/登录、云朵识别代理、收集状态管理）
│   ├── card_data.py            # 卡牌积分 & 稀有度数据
│   ├── requirements.txt
│   └── .env.example            # 环境变量模板
├── images/                     # 静态图片资源（塔罗牌背景、装饰素材）
├── deploy.sh                   # 服务器端一键部署脚本
├── deploy-local.sh             # 本地 scp 直传部署脚本
├── capacitor.config.json       # 根级 Capacitor 配置
└── tech-spec.md                # 技术规划文档
```

## 核心功能

1. **用户系统** - 邮箱注册/登录，JWT 认证，多设备同步
2. **云朵识别** - 拍照上传，AI 识别云的类型（10 属 + 6 种 + 4 变种 + 附属/特殊云，共 40+ 类）
3. **卡牌收集** - 每种云对应一张卡牌，分常见/较少见/少见/罕见/极罕见 5 个稀有度
4. **积分系统** - 识别获得积分，连续识别有连击加成，积分可解锁未点亮的卡牌
5. **防刷机制** - imagehash 防重复提交 + 冷却时间

## 本地开发

### 前端

```bash
cd app
npm install
npm run dev          # 启动 Vite 开发服务器（默认 http://localhost:5173）
```

开发模式下 `/api` 请求会代理到 `http://106.14.148.230:8000`（见 `vite.config.ts`）。

### 后端

```bash
cd server
pip install -r requirements.txt
cp .env.example .env  # 填入你的 DASHSCOPE_API_KEY 和 JWT_SECRET
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

环境变量说明：
- `DASHSCOPE_API_KEY` - 阿里云 DashScope API Key（必填）
- `JWT_SECRET` - JWT 签名密钥（必填）
- `DB_PATH` - SQLite 数据库路径（可选，默认 `cloud_collection.db`）

### 原生应用构建

```bash
cd app
npm run build                    # 构建前端
npx cap sync                     # 同步到原生工程
npx cap open ios                 # 打开 Xcode
npx cap open android             # 打开 Android Studio
```

Capacitor 配置（`app/capacitor.config.ts`）：
- App ID: `com.cloud.collection.app`
- 启用原生 HTTP（绕过 WebView CORS）
- iOS 禁用滚动弹性

## 部署

两种方式：

1. **服务器端部署** - 在服务器上执行 `deploy.sh`，自动 git pull + 构建 + 部署
2. **本地直传** - 在本地执行 `deploy-local.sh`，本地构建后 scp 上传到服务器

后端通过 Supervisor 或 nohup 运行 Uvicorn。
