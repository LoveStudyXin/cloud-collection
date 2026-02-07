#!/bin/bash
# ============================================
# 云朵收集 - 本地直传部署脚本
# 在本地 Mac 上执行，直接 scp 到服务器
# ============================================

set -e

# ---------- 配置区 ----------
SERVER="root@106.14.148.230"
SSH_PORT=22
FRONTEND_DEPLOY="/www/wwwroot/cloud-api/static"
BACKEND_DEPLOY="/www/wwwroot/cloud-api"
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"
# ----------------------------

echo "========================================"
echo "  云朵收集 - 本地直传部署"
echo "========================================"
echo ""

# 第一步：本地构建前端
echo "[1/4] 构建前端..."
cd "$LOCAL_DIR/app"
npm run build
echo "  ✅ 前端构建完成"
echo ""

# 第二步：上传前端文件
echo "[2/4] 上传前端文件到服务器..."
ssh -p $SSH_PORT $SERVER "rm -rf ${FRONTEND_DEPLOY}/*"
scp -P $SSH_PORT -r "$LOCAL_DIR/app/dist/"* "$SERVER:$FRONTEND_DEPLOY/"
echo "  ✅ 前端文件上传完成"
echo ""

# 第三步：上传后端文件
echo "[3/4] 上传后端文件到服务器..."
scp -P $SSH_PORT "$LOCAL_DIR/server/main.py" "$SERVER:$BACKEND_DEPLOY/main.py"
scp -P $SSH_PORT "$LOCAL_DIR/server/card_data.py" "$SERVER:$BACKEND_DEPLOY/card_data.py"
scp -P $SSH_PORT "$LOCAL_DIR/server/requirements.txt" "$SERVER:$BACKEND_DEPLOY/requirements.txt"
echo "  ✅ 后端文件上传完成"
echo ""

# 第四步：重启后端服务
echo "[4/4] 重启后端服务..."
ssh -p $SSH_PORT $SERVER "
    cd $BACKEND_DEPLOY
    if [ -d venv ]; then
        source venv/bin/activate
        pip install -r requirements.txt -q
    fi
    if command -v supervisorctl &> /dev/null; then
        supervisorctl restart cloud-api 2>/dev/null && echo '  ✅ Supervisor 重启成功' || echo '  ⚠️  Supervisor 重启失败'
    else
        pkill -f 'uvicorn.*main:app' 2>/dev/null || true
        sleep 1
        if [ -d venv ]; then source venv/bin/activate; fi
        mkdir -p logs
        nohup python -m uvicorn main:app --host 0.0.0.0 --port 8000 > logs/app.log 2>&1 &
        echo \"  ✅ 后端已重启 (PID: \$!)\"
    fi
"
echo ""

echo "========================================"
echo "  🎉 部署完成！"
echo "========================================"
echo "  访问: http://106.14.148.230"
echo "========================================"
