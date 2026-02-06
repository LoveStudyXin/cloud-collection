// 稀有度等级
export type Rarity = '常见' | '较少见' | '较常见' | '少见' | '罕见' | '极罕见';

// 卡牌状态
export type CardStatus = 'locked' | 'unlocked' | 'lit';

// 云彩卡牌数据
export interface CloudCard {
  id: string;
  name: string;
  latin: string;
  category: string;
  icon: string;
  score: number;
  rarity: Rarity;
  description: string;
  features: string[];
  hint: string;
  weather?: string;
  whenToFind?: string;
  whereToFind?: string;
}

// AI 分析详情（来自 DashScope API）
export interface AIAnalysis {
  family: string;      // 云族
  genus: string;       // 云属
  species: string;     // 云种/变种
  features: string;    // 识别特征
  weather: string;     // 天气预兆
  knowledge: string;   // 知识延伸
}

// 用户的卡牌收集状态
export interface UserCardState {
  cardId: string;
  status: CardStatus;
  litCount: number;
  litRecords: LitRecord[];
  unlockedAt?: number;
}

// 点亮记录
export interface LitRecord {
  timestamp: number;
  imageUrl?: string;       // 临时 URL（会话内有效）
  thumbnail?: string;      // base64 缩略图（持久化存储）
  aiAnalysis?: AIAnalysis; // AI 分析详情
  earnedScore?: number;    // 实际获得的积分（含连击加成）
}

// 用户状态
export interface UserState {
  points: number;
  cards: Record<string, UserCardState>;
  totalLitCount: number;
  // 连续发现加成
  streakRarity?: Rarity;  // 上一次发现的稀有度
  streakCount?: number;   // 连续同稀有度发现次数
}

// AI识别结果
export interface RecognitionResult {
  cloudId: string;
  cloudName: string;
  latinName: string;
  confidence: number;
  score: number;
  rarity: Rarity;
  description: string;
  category: string;
  features: string[];
  aiAnalysis?: AIAnalysis; // AI 返回的详细分析
}
