"""
Cloud Collection 后端 API 服务
功能：用户注册/登录 + 云朵识别（代理 DashScope API）+ 用户收集状态管理
"""

import os
import io
import base64
import sqlite3
import hashlib
import secrets
import time
from datetime import datetime, timedelta
from contextlib import contextmanager
from typing import Optional, List

import httpx
import jwt
import imagehash
from PIL import Image
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv

from card_data import (
    CARD_DATA, RARITY_UNLOCK_COSTS, INITIAL_POINTS,
    STARTER_CARD_IDS, COOLDOWN_MS, get_streak_multiplier,
)

load_dotenv()

# ============ 配置 ============

DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "")
JWT_SECRET = os.getenv("JWT_SECRET", secrets.token_hex(32))
JWT_EXPIRE_DAYS = 30
DB_PATH = os.getenv("DB_PATH", "cloud_collection.db")
DASHSCOPE_API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
MODEL_NAME = "qwen-vl-plus"

# ============ 数据库 ============

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS image_hashes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            phash TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    # 用户总体状态
    conn.execute("""
        CREATE TABLE IF NOT EXISTS user_state (
            user_id INTEGER PRIMARY KEY REFERENCES users(id),
            points INTEGER NOT NULL DEFAULT 30,
            total_lit_count INTEGER NOT NULL DEFAULT 0,
            streak_rarity TEXT,
            streak_count INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL
        )
    """)
    # 每张卡牌状态
    conn.execute("""
        CREATE TABLE IF NOT EXISTS user_cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            card_id TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'locked',
            lit_count INTEGER NOT NULL DEFAULT 0,
            unlocked_at TEXT,
            UNIQUE(user_id, card_id)
        )
    """)
    # 点亮历史记录
    conn.execute("""
        CREATE TABLE IF NOT EXISTS lit_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            card_id TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            earned_score INTEGER NOT NULL DEFAULT 0,
            ai_family TEXT,
            ai_genus TEXT,
            ai_species TEXT,
            ai_features TEXT,
            ai_weather TEXT,
            ai_knowledge TEXT,
            created_at TEXT NOT NULL
        )
    """)
    # 索引
    conn.execute("CREATE INDEX IF NOT EXISTS idx_user_cards_user ON user_cards(user_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_lit_records_user_card ON lit_records(user_id, card_id)")
    conn.commit()
    conn.close()

init_db()

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# ============ 用户状态初始化 ============

def init_user_state(conn, user_id: int):
    """为新用户创建初始状态（30分 + 3张初始卡）"""
    now = datetime.utcnow().isoformat()
    conn.execute(
        "INSERT OR IGNORE INTO user_state (user_id, points, total_lit_count, streak_count, updated_at) VALUES (?, ?, 0, 0, ?)",
        (user_id, INITIAL_POINTS, now),
    )
    for card_id in STARTER_CARD_IDS:
        conn.execute(
            "INSERT OR IGNORE INTO user_cards (user_id, card_id, status, lit_count, unlocked_at) VALUES (?, ?, 'unlocked', 0, ?)",
            (user_id, card_id, now),
        )
    conn.commit()

def ensure_user_state(conn, user_id: int):
    """确保用户状态存在，不存在则初始化"""
    row = conn.execute("SELECT user_id FROM user_state WHERE user_id = ?", (user_id,)).fetchone()
    if not row:
        init_user_state(conn, user_id)

# ============ 密码工具 ============

def hash_password(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac(
        "sha256", password.encode(), salt.encode(), 100000
    ).hex()

def verify_password(password: str, salt: str, password_hash: str) -> bool:
    return hash_password(password, salt) == password_hash

# ============ JWT 工具 ============

def create_token(user_id: int, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=JWT_EXPIRE_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_token(authorization: str = Header(...)) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="无效的认证格式")
    token = authorization[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="登录已过期，请重新登录")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="无效的认证信息")

# ============ 请求/响应模型 ============

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    token: str
    email: str

class RecognizeRequest(BaseModel):
    image_base64: str  # 完整的 data:image/... base64 字符串

class LitCardRequest(BaseModel):
    card_id: str
    ai_family: Optional[str] = None
    ai_genus: Optional[str] = None
    ai_species: Optional[str] = None
    ai_features: Optional[str] = None
    ai_weather: Optional[str] = None
    ai_knowledge: Optional[str] = None

class UnlockCardRequest(BaseModel):
    card_id: str

class MigrateStateRequest(BaseModel):
    points: int
    total_lit_count: int
    streak_rarity: Optional[str] = None
    streak_count: int = 0
    cards: dict  # Record<cardId, {status, litCount, unlockedAt?, litRecords[]}>

# ============ 图片去重工具 ============

PHASH_THRESHOLD = 5  # 汉明距离阈值，<=5 视为同一张图

def compute_phash(image_base64: str) -> str:
    """从 base64 图片计算感知哈希"""
    # 去掉 data:image/xxx;base64, 前缀
    if "," in image_base64:
        image_base64 = image_base64.split(",", 1)[1]
    raw = base64.b64decode(image_base64)
    img = Image.open(io.BytesIO(raw))
    return str(imagehash.phash(img))

def is_duplicate_image(conn, user_id: int, new_hash: str) -> bool:
    """检查该用户是否上传过相似图片"""
    rows = conn.execute(
        "SELECT phash FROM image_hashes WHERE user_id = ?", (user_id,)
    ).fetchall()
    new_h = imagehash.hex_to_hash(new_hash)
    for row in rows:
        old_h = imagehash.hex_to_hash(row["phash"])
        if new_h - old_h <= PHASH_THRESHOLD:
            return True
    return False

def save_image_hash(conn, user_id: int, phash: str):
    """保存图片哈希到数据库"""
    conn.execute(
        "INSERT INTO image_hashes (user_id, phash, created_at) VALUES (?, ?, ?)",
        (user_id, phash, datetime.utcnow().isoformat()),
    )
    conn.commit()

# ============ 云朵识别提示词 ============

CLOUD_RECOGNITION_PROMPT = """你是一位专业的云彩识别专家，精通《云彩收集者手册》中的所有云彩分类知识。

**重要**：请先判断图片中是否包含云彩或天空气象现象。
- 如果图片中**没有**云彩、天空或气象现象（例如室内照片、食物、人物、动物、建筑物特写等），请只回复：**无云**
- 如果图片中**有**云彩或天空气象现象，请按照以下格式输出识别结果。注意：每个部分内容不要重复，各部分应聚焦自己的主题。

**云族**：[云族名称]（仅说明所属高度层，如高云族/中云族/低云族，一句话即可）

**云属**：[云属名称]（仅说明云属分类名称和最核心的一句话定义）

**云种/变种**：[具体云种名称]（仅说明该云种与同属其他云种的区分要点，不要重复云属信息）

**识别特征**：[仅描述这张图片中云彩的实际视觉表现：形态、颜色、纹理、边界、光影等，不要重复分类信息]

**天气预兆**：[仅说明这种云预示的天气变化，不要描述云的外观特征]

**知识延伸**：[分享一个有趣的冷知识或文化典故，如命名由来、历史轶事、民间谚语等，不要重复以上任何内容]

**识别置信度**：[1-10的整数，表示你对本次识别结果的确信程度。10=非常确定，图片清晰且特征明显；7-9=较确定，主要特征可辨；4-6=不太确定，图片模糊或特征不典型；1-3=很不确定，仅为猜测]

【完整云彩分类参考】

一、核心收集层 - 云本体
1. 十种云属（WMO官方）：
   - 高云族（>6000米）：卷云(Ci)、卷层云(Cs)、卷积云(Cc)
   - 中云族（2000-6000米）：高层云(As)、高积云(Ac)
   - 低云族（<2000米）：层云(St)、层积云(Sc)、积云(Cu)
   - 垂直发展云：雨层云(Ns)、积雨云(Cb)

2. 云种（形态特征）：毛状云、堡状云、荚状云、波状云、辐辏状云、网状云
3. 云变种（排列结构）：复云、漏光云、透光云、蔽光云

二、附属特征层
4. 附属云/特征：砧状云、悬球状云、幞状云、缟状云、破片云、管状云、降水线迹云、幡状云
5. 动力云：弧状云、滩云、滚轴云、山帽云、旗云、云街、云中波、马蹄涡

三、奇观收集层 - 光学现象
6. 晕/折射/衍射：晕、22度晕、幻日、日柱、下映日、环天顶弧、华、宝光、虹彩云
7. 彩虹类：彩虹、云虹、雾虹
8. 特殊现象：布罗肯幽灵、钻石尘、闪光路径

四、稀有/特殊云
9. 高空云：夜光云、贝母云
10. 穿孔/异常：雨幡洞云、穿孔云、雨幡、云中孔洞
11. 戏剧性云：阵晨风云、开尔文-亥姆霍兹波、水母云、UFO形状云

五、风暴系统：风暴、多单体风暴、超级单体、阵风锋面、陆龙卷、水龙卷、漏斗云、火积云、烟云

六、人造云与雾：航迹云、耗散尾迹、雾（辐射雾/平流雾/蒸汽雾）、霭

请基于图片中云彩的实际特征进行专业分析，给出准确的识别结果。
请只识别图片中最主要、最显著的一种云彩或气象现象，给出一个完整的识别结果即可。"""

# ============ FastAPI 应用 ============

app = FastAPI(title="Cloud Collection API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境可限制为你的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- 健康检查 ----------

@app.get("/api/health")
def health_check():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}

# ---------- 用户注册 ----------

@app.post("/api/register", response_model=AuthResponse)
def register(req: RegisterRequest):
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="密码至少需要6个字符")

    salt = secrets.token_hex(16)
    password_hash = hash_password(req.password, salt)
    created_at = datetime.utcnow().isoformat()

    with get_db() as conn:
        try:
            cursor = conn.execute(
                "INSERT INTO users (email, password_hash, salt, created_at) VALUES (?, ?, ?, ?)",
                (req.email, password_hash, salt, created_at),
            )
            conn.commit()
            user_id = cursor.lastrowid
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=400, detail="该邮箱已注册")

        # 注册后自动初始化收集状态
        init_user_state(conn, user_id)

    token = create_token(user_id, req.email)
    return AuthResponse(token=token, email=req.email)

# ---------- 用户登录 ----------

@app.post("/api/login", response_model=AuthResponse)
def login(req: LoginRequest):
    with get_db() as conn:
        row = conn.execute(
            "SELECT id, email, password_hash, salt FROM users WHERE email = ?",
            (req.email,),
        ).fetchone()

    if not row:
        raise HTTPException(status_code=400, detail="该邮箱尚未注册")

    if not verify_password(req.password, row["salt"], row["password_hash"]):
        raise HTTPException(status_code=400, detail="密码错误")

    token = create_token(row["id"], row["email"])
    return AuthResponse(token=token, email=row["email"])

# ---------- 获取用户收集状态 ----------

@app.get("/api/user/state")
def get_user_state(user: dict = Depends(verify_token)):
    user_id = user["user_id"]

    with get_db() as conn:
        ensure_user_state(conn, user_id)

        # 读取用户总体状态
        state_row = conn.execute(
            "SELECT points, total_lit_count, streak_rarity, streak_count FROM user_state WHERE user_id = ?",
            (user_id,),
        ).fetchone()

        # 读取所有卡牌状态
        card_rows = conn.execute(
            "SELECT card_id, status, lit_count, unlocked_at FROM user_cards WHERE user_id = ?",
            (user_id,),
        ).fetchall()

        # 读取所有点亮记录
        record_rows = conn.execute(
            "SELECT card_id, timestamp, earned_score, ai_family, ai_genus, ai_species, ai_features, ai_weather, ai_knowledge FROM lit_records WHERE user_id = ? ORDER BY timestamp ASC",
            (user_id,),
        ).fetchall()

    # 组装卡牌记录
    records_by_card = {}
    for r in record_rows:
        cid = r["card_id"]
        if cid not in records_by_card:
            records_by_card[cid] = []
        records_by_card[cid].append({
            "timestamp": r["timestamp"],
            "earnedScore": r["earned_score"],
            "aiAnalysis": {
                "family": r["ai_family"] or "",
                "genus": r["ai_genus"] or "",
                "species": r["ai_species"] or "",
                "features": r["ai_features"] or "",
                "weather": r["ai_weather"] or "",
                "knowledge": r["ai_knowledge"] or "",
            },
        })

    # 组装卡牌状态
    cards = {}
    for c in card_rows:
        cid = c["card_id"]
        unlocked_at = None
        if c["unlocked_at"]:
            try:
                unlocked_at = int(datetime.fromisoformat(c["unlocked_at"]).timestamp() * 1000)
            except Exception:
                unlocked_at = None
        cards[cid] = {
            "cardId": cid,
            "status": c["status"],
            "litCount": c["lit_count"],
            "litRecords": records_by_card.get(cid, []),
            "unlockedAt": unlocked_at,
        }

    return {
        "points": state_row["points"],
        "totalLitCount": state_row["total_lit_count"],
        "streakRarity": state_row["streak_rarity"],
        "streakCount": state_row["streak_count"],
        "cards": cards,
    }

# ---------- 点亮卡牌 ----------

@app.post("/api/user/lit")
def lit_card(req: LitCardRequest, user: dict = Depends(verify_token)):
    user_id = user["user_id"]
    card_id = req.card_id

    # 验证卡牌存在
    card_info = CARD_DATA.get(card_id)
    if not card_info:
        raise HTTPException(status_code=400, detail="无效的卡牌ID")

    now_ms = int(time.time() * 1000)
    now_iso = datetime.utcnow().isoformat()

    with get_db() as conn:
        ensure_user_state(conn, user_id)

        # 读取用户当前状态
        state_row = conn.execute(
            "SELECT points, total_lit_count, streak_rarity, streak_count FROM user_state WHERE user_id = ?",
            (user_id,),
        ).fetchone()

        # 检查冷却
        last_record = conn.execute(
            "SELECT timestamp FROM lit_records WHERE user_id = ? AND card_id = ? ORDER BY timestamp DESC LIMIT 1",
            (user_id, card_id),
        ).fetchone()
        in_cooldown = last_record and (now_ms - last_record["timestamp"]) < COOLDOWN_MS

        # 计算连击和积分
        base_score = card_info["score"]
        card_rarity = card_info["rarity"]

        if in_cooldown:
            earned_score = 0
            new_streak_count = state_row["streak_count"]
            new_streak_rarity = state_row["streak_rarity"]
        else:
            is_same_rarity = state_row["streak_rarity"] == card_rarity
            new_streak_count = (state_row["streak_count"] + 1) if is_same_rarity else 1
            multiplier = get_streak_multiplier(new_streak_count)
            earned_score = round(base_score * multiplier)
            new_streak_rarity = card_rarity

        # 插入点亮记录
        conn.execute(
            """INSERT INTO lit_records
               (user_id, card_id, timestamp, earned_score, ai_family, ai_genus, ai_species, ai_features, ai_weather, ai_knowledge, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (user_id, card_id, now_ms, earned_score,
             req.ai_family, req.ai_genus, req.ai_species,
             req.ai_features, req.ai_weather, req.ai_knowledge, now_iso),
        )

        # 更新卡牌状态
        existing_card = conn.execute(
            "SELECT id, lit_count FROM user_cards WHERE user_id = ? AND card_id = ?",
            (user_id, card_id),
        ).fetchone()

        if existing_card:
            conn.execute(
                "UPDATE user_cards SET status = 'lit', lit_count = ? WHERE id = ?",
                (existing_card["lit_count"] + 1, existing_card["id"]),
            )
        else:
            conn.execute(
                "INSERT INTO user_cards (user_id, card_id, status, lit_count) VALUES (?, ?, 'lit', 1)",
                (user_id, card_id),
            )

        # 更新用户总体状态
        new_points = state_row["points"] + earned_score
        new_total_lit = state_row["total_lit_count"] + (0 if in_cooldown else 1)
        conn.execute(
            "UPDATE user_state SET points = ?, total_lit_count = ?, streak_rarity = ?, streak_count = ?, updated_at = ? WHERE user_id = ?",
            (new_points, new_total_lit, new_streak_rarity, new_streak_count, now_iso, user_id),
        )

        conn.commit()

    return {
        "earnedScore": earned_score,
        "newPoints": new_points,
        "streakCount": new_streak_count,
        "streakRarity": new_streak_rarity,
        "inCooldown": bool(in_cooldown),
    }

# ---------- 解锁卡牌 ----------

@app.post("/api/user/unlock")
def unlock_card(req: UnlockCardRequest, user: dict = Depends(verify_token)):
    user_id = user["user_id"]
    card_id = req.card_id

    card_info = CARD_DATA.get(card_id)
    if not card_info:
        raise HTTPException(status_code=400, detail="无效的卡牌ID")

    cost = RARITY_UNLOCK_COSTS.get(card_info["rarity"], 999999)
    now_iso = datetime.utcnow().isoformat()

    with get_db() as conn:
        ensure_user_state(conn, user_id)

        state_row = conn.execute(
            "SELECT points FROM user_state WHERE user_id = ?",
            (user_id,),
        ).fetchone()

        if state_row["points"] < cost:
            raise HTTPException(status_code=400, detail="积分不足")

        # 检查卡牌是否已经是 lit（不降级）
        existing_card = conn.execute(
            "SELECT status FROM user_cards WHERE user_id = ? AND card_id = ?",
            (user_id, card_id),
        ).fetchone()

        if existing_card and existing_card["status"] == "lit":
            return {"success": True, "newPoints": state_row["points"]}

        # 扣分并更新卡牌状态
        new_points = state_row["points"] - cost

        if existing_card:
            conn.execute(
                "UPDATE user_cards SET status = 'unlocked', unlocked_at = ? WHERE user_id = ? AND card_id = ?",
                (now_iso, user_id, card_id),
            )
        else:
            conn.execute(
                "INSERT INTO user_cards (user_id, card_id, status, lit_count, unlocked_at) VALUES (?, ?, 'unlocked', 0, ?)",
                (user_id, card_id, now_iso),
            )

        conn.execute(
            "UPDATE user_state SET points = ?, updated_at = ? WHERE user_id = ?",
            (new_points, now_iso, user_id),
        )

        conn.commit()

    return {"success": True, "newPoints": new_points}

# ---------- 迁移本地数据 ----------

@app.post("/api/user/migrate")
def migrate_state(req: MigrateStateRequest, user: dict = Depends(verify_token)):
    user_id = user["user_id"]
    now_iso = datetime.utcnow().isoformat()

    with get_db() as conn:
        ensure_user_state(conn, user_id)

        # 检查服务端是否已有有意义的数据
        state_row = conn.execute(
            "SELECT total_lit_count FROM user_state WHERE user_id = ?",
            (user_id,),
        ).fetchone()

        if state_row["total_lit_count"] > 0:
            # 服务端已有数据，不覆盖，直接返回当前状态
            return {"migrated": False, "message": "服务端已有数据，跳过迁移"}

        # 写入总体状态
        conn.execute(
            "UPDATE user_state SET points = ?, total_lit_count = ?, streak_rarity = ?, streak_count = ?, updated_at = ? WHERE user_id = ?",
            (req.points, req.total_lit_count, req.streak_rarity, req.streak_count, now_iso, user_id),
        )

        # 写入卡牌状态和点亮记录
        for card_id, card_data in req.cards.items():
            status = card_data.get("status", "locked")
            lit_count = card_data.get("litCount", 0)
            unlocked_at = None
            if card_data.get("unlockedAt"):
                try:
                    unlocked_at = datetime.fromtimestamp(card_data["unlockedAt"] / 1000).isoformat()
                except Exception:
                    unlocked_at = now_iso

            # 插入或更新卡牌
            conn.execute(
                "INSERT OR REPLACE INTO user_cards (user_id, card_id, status, lit_count, unlocked_at) VALUES (?, ?, ?, ?, ?)",
                (user_id, card_id, status, lit_count, unlocked_at),
            )

            # 插入点亮记录
            for record in card_data.get("litRecords", []):
                ai = record.get("aiAnalysis", {}) or {}
                conn.execute(
                    """INSERT INTO lit_records
                       (user_id, card_id, timestamp, earned_score, ai_family, ai_genus, ai_species, ai_features, ai_weather, ai_knowledge, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (user_id, card_id,
                     record.get("timestamp", int(time.time() * 1000)),
                     record.get("earnedScore", 0),
                     ai.get("family", ""), ai.get("genus", ""),
                     ai.get("species", ""), ai.get("features", ""),
                     ai.get("weather", ""), ai.get("knowledge", ""),
                     now_iso),
                )

        conn.commit()

    return {"migrated": True, "message": "迁移成功"}

# ---------- 云朵识别 ----------

@app.post("/api/recognize")
async def recognize(req: RecognizeRequest, user: dict = Depends(verify_token)):
    if not DASHSCOPE_API_KEY:
        raise HTTPException(status_code=500, detail="服务器未配置 AI 识别密钥")

    # 计算图片 pHash 并检查是否重复
    user_id = user["user_id"]
    try:
        img_phash = compute_phash(req.image_base64)
    except Exception:
        img_phash = None  # 哈希计算失败不阻断识别

    if img_phash:
        with get_db() as conn:
            if is_duplicate_image(conn, user_id, img_phash):
                raise HTTPException(status_code=409, detail="DUPLICATE_IMAGE")

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": req.image_base64}},
                    {"type": "text", "text": CLOUD_RECOGNITION_PROMPT},
                ],
            }
        ],
        "max_tokens": 4000,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            resp = await client.post(
                DASHSCOPE_API_URL,
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {DASHSCOPE_API_KEY}",
                },
            )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="AI 识别超时，请稍后重试")

    if resp.status_code != 200:
        detail = "AI 识别服务暂时不可用"
        try:
            err = resp.json()
            detail = err.get("error", {}).get("message", detail)
        except Exception:
            pass
        raise HTTPException(status_code=502, detail=detail)

    data = resp.json()
    content = data["choices"][0]["message"]["content"]

    # 检查 AI 是否判定图片中没有云
    content_stripped = content.strip().replace("*", "")
    if content_stripped == "无云" or content_stripped.startswith("无云"):
        raise HTTPException(status_code=422, detail="NO_CLOUD_DETECTED")

    # 识别成功，保存图片哈希防止重复提交
    if img_phash:
        with get_db() as conn:
            save_image_hash(conn, user_id, img_phash)

    return {"content": content}

# ============ 前端静态文件托管 ============

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

if os.path.isdir(STATIC_DIR):
    # 托管静态资源（JS/CSS/图片等）
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="static-assets")

    # 所有非 /api 路径返回 index.html（SPA 路由）
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # 先检查是否是静态文件
        file_path = os.path.join(STATIC_DIR, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        # 否则返回 index.html
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))

# ============ 启动入口 ============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
