#!/bin/bash
# ============================================
# 云朵收集 - 一键部署脚本
# 放在服务器上执行，自动拉取代码并部署
# ============================================

set -e  # 遇到错误立即停止

# ---------- 配置区（根据你的服务器修改）----------
REPO_URL="https://github.com/LoveStudyXin/cloud-collection.git"
REPO_DIR="/www/repo/cloud-collection"        # GitHub 代码存放目录
FRONTEND_DEPLOY="/www/wwwroot/cloud-api/static"  # 前端部署目录
BACKEND_DEPLOY="/www/server"                      # 后端部署目录
# -------------------------------------------------

echo "========================================"
echo "  云朵收集 - 开始部署"
echo "========================================"
echo ""

# 第一步：拉取最新代码
echo "[1/5] 拉取最新代码..."
if [ -d "$REPO_DIR/.git" ]; then
    cd "$REPO_DIR"
    git pull origin main
    echo "  ✅ 代码更新完成"
else
    echo "  首次部署，正在克隆仓库..."
    mkdir -p "$(dirname $REPO_DIR)"
    git clone "$REPO_URL" "$REPO_DIR"
    cd "$REPO_DIR"
    echo "  ✅ 仓库克隆完成"
fi
echo ""

# 第二步：安装前端依赖并打包
echo "[2/5] 安装前端依赖并打包..."
cd "$REPO_DIR/app"
npm install
npm run build
echo "  ✅ 前端打包完成"
echo ""

# 第三步：部署前端文件
echo "[3/5] 部署前端文件..."
mkdir -p "$FRONTEND_DEPLOY"
rm -rf "$FRONTEND_DEPLOY"/*
cp -r "$REPO_DIR/app/dist/"* "$FRONTEND_DEPLOY/"
echo "  ✅ 前端文件已部署到 $FRONTEND_DEPLOY"
echo ""

# 第四步：更新后端代码
echo "[4/5] 更新后端代码..."
cp "$REPO_DIR/server/main.py" "$BACKEND_DEPLOY/main.py"
cp "$REPO_DIR/server/requirements.txt" "$BACKEND_DEPLOY/requirements.txt"

# 安装后端依赖（使用虚拟环境）
if [ -d "$BACKEND_DEPLOY/venv" ]; then
    source "$BACKEND_DEPLOY/venv/bin/activate"
    pip install -r "$BACKEND_DEPLOY/requirements.txt" -q
    deactivate
fi
echo "  ✅ 后端代码已更新"
echo "  ⚠️  注意：.env 文件不会被覆盖，你的配置是安全的"
echo ""

# 第五步：重启后端服务
echo "[5/5] 重启后端服务..."
# 尝试用 supervisorctl 重启（如果你配置了 supervisor）
if command -v supervisorctl &> /dev/null; then
    supervisorctl restart cloud-api 2>/dev/null && echo "  ✅ 通过 Supervisor 重启成功" || echo "  ⚠️  Supervisor 重启失败，请手动重启"
else
    # 否则手动杀进程并重启
    pkill -f "uvicorn.*main:app" 2>/dev/null || true
    sleep 1
    cd "$BACKEND_DEPLOY"
    if [ -d "venv" ]; then
        source venv/bin/activate
    fi
    nohup python -m uvicorn main:app --host 0.0.0.0 --port 8000 > logs/app.log 2>&1 &
    echo "  ✅ 后端服务已重启 (PID: $!)"
fi
echo ""

echo "========================================"
echo "  🎉 部署完成！"
echo "========================================"
echo "  前端: $FRONTEND_DEPLOY"
echo "  后端: $BACKEND_DEPLOY"
echo "  访问: http://106.14.148.230"
echo "========================================"
