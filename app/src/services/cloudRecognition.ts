import { cloudCards, cloudCardMap } from '@/data/cloudCards';
import type { RecognitionResult, AIAnalysis } from '@/types/cloud';

// 后端 API 地址
const API_BASE_URL = import.meta.env.DEV
  ? '/api'  // 开发环境通过 Vite proxy
  : '/api';  // 生产环境：同源部署，使用相对路径

// 获取登录 token
function getToken(): string {
  try {
    const raw = localStorage.getItem('cloud-auth');
    if (raw) {
      const auth = JSON.parse(raw);
      return auth.token || '';
    }
  } catch { /* ignore */ }
  return '';
}

// 将 File 转为 base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 调用后端识别 API
async function callRecognizeAPI(imageBase64: string): Promise<ParsedResult> {
  const token = getToken();
  if (!token) {
    throw new Error('NOT_LOGGED_IN');
  }

  const response = await fetch(`${API_BASE_URL}/recognize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      image_base64: imageBase64,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new Error('NOT_LOGGED_IN');
    }
    if (response.status === 422 && errorData.detail === 'NO_CLOUD_DETECTED') {
      throw new Error('NO_CLOUD_DETECTED');
    }
    if (response.status === 409 && errorData.detail === 'DUPLICATE_IMAGE') {
      throw new Error('DUPLICATE_IMAGE');
    }
    const msg = errorData.detail || `识别失败 (${response.status})`;
    throw new Error(msg);
  }

  const data = await response.json();
  return parseRecognitionResult(data.content);
}

// AI 返回的解析结果
interface ParsedResult {
  family: string;
  genus: string;
  species: string;
  features: string;
  weather: string;
  knowledge: string;
  confidence: number; // AI 自评置信度 1-10
}

// 清理 markdown 噪音
function cleanFieldText(text: string): string {
  if (!text) return '';
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*{1,2}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// 解析 AI 返回的识别结果
function parseRecognitionResult(content: string): ParsedResult {
  // 去掉 markdown 标题
  const cleaned = content.replace(/^#{1,6}\s+.*$/gm, '').trim();

  const result: ParsedResult = {
    family: '',
    genus: '',
    species: '',
    features: '',
    weather: '',
    knowledge: '',
    confidence: 7,
  };

  const familyMatch = cleaned.match(/\*{0,2}云族\*{0,2}[：:]\s*([\s\S]*?)(?=\*{0,2}云属\*{0,2}[：:]|$)/);
  const genusMatch = cleaned.match(/\*{0,2}云属\*{0,2}[：:]\s*([\s\S]*?)(?=\*{0,2}云种[/／]变种\*{0,2}[：:]|$)/);
  const speciesMatch = cleaned.match(/\*{0,2}云种[/／]变种\*{0,2}[：:]\s*([\s\S]*?)(?=\*{0,2}识别特征\*{0,2}[：:]|$)/);
  const featuresMatch = cleaned.match(/\*{0,2}识别特征\*{0,2}[：:]\s*([\s\S]*?)(?=\*{0,2}天气预兆\*{0,2}[：:]|$)/);
  const weatherMatch = cleaned.match(/\*{0,2}天气预兆\*{0,2}[：:]\s*([\s\S]*?)(?=\*{0,2}知识延伸\*{0,2}[：:]|$)/);
  const knowledgeMatch = cleaned.match(/\*{0,2}知识延伸\*{0,2}[：:]\s*([\s\S]*?)$/);

  if (familyMatch) result.family = cleanFieldText(familyMatch[1]);
  if (genusMatch) result.genus = cleanFieldText(genusMatch[1]);
  if (speciesMatch) result.species = cleanFieldText(speciesMatch[1]);
  if (featuresMatch) result.features = cleanFieldText(featuresMatch[1]);
  if (weatherMatch) result.weather = cleanFieldText(weatherMatch[1]);
  if (knowledgeMatch) result.knowledge = cleanFieldText(knowledgeMatch[1]);

  // 提取AI自评置信度
  const confidenceMatch = cleaned.match(/\*{0,2}识别置信度\*{0,2}[：:]\s*(\d+)/);
  if (confidenceMatch) {
    const val = parseInt(confidenceMatch[1], 10);
    result.confidence = Math.max(1, Math.min(10, val));
  }

  return result;
}

// 已知云名列表（按长度排序，优先匹配长名称）
const KNOWN_CLOUD_NAMES = [
  '开尔文-亥姆霍兹波', '开尔文亥姆霍兹波', '布罗肯幽灵',
  '阵晨风云', '环天顶弧', '多单体风暴', '超级单体', '阵风锋面',
  '降水线迹云', '雨幡洞云', '悬球状云', '辐辏状云', 'UFO形状云',
  '马蹄涡', '滚轴云', '夜光云', '贝母云', '虹彩云', '航迹云',
  '水母云', '穿孔云', '漏斗云', '火积云', '弧状云', '管状云',
  '幡状云', '幞状云', '缟状云', '破片云', '砧状云', '波状云',
  '网状云', '堡状云', '毛状云', '荚状云', '山帽云', '滩云',
  '22度晕', '钻石尘', '闪光路径', '下映日', '陆龙卷', '水龙卷',
  '耗散尾迹', '云中孔洞', '云中波', '云街',
  '旗云', '积雨云', '雨层云', '复云', '漏光云', '透光云', '蔽光云',
  '层积云', '高积云', '高层云', '卷积云', '卷层云',
  '积云', '层云', '卷云', '雾虹', '云虹', '彩虹',
  '宝光', '幻日', '日柱', '烟云', '雨幡',
  '雾', '霭', '晕', '华', '风暴',
];

// 名称 → cloudCard ID 映射
const NAME_TO_ID: Record<string, string> = {
  '积云': 'cumulus', '层积云': 'stratocumulus', '层云': 'stratus',
  '高积云': 'altocumulus', '高层云': 'altostratus', '卷云': 'cirrus',
  '卷积云': 'cirrocumulus', '卷层云': 'cirrostratus', '雨层云': 'nimbostratus',
  '积雨云': 'cumulonimbus',
  '毛状云': 'fibratus', '堡状云': 'castellanus', '荚状云': 'lenticularis',
  '波状云': 'undulatus', '辐辏状云': 'radiatus', '辐状云': 'radiatus',
  '网状云': 'lacunosus',
  '复云': 'duplicatus', '漏光云': 'perlucidus', '透光云': 'translucidus', '蔽光云': 'opacus',
  '砧状云': 'incus', '悬球状云': 'mamma', '悬球云': 'mamma', '乳状云': 'mamma',
  '幞状云': 'pileus', '缟状云': 'velum', '破片云': 'pannus',
  '管状云': 'tuba', '降水线迹云': 'praecipitatio', '幡状云': 'virga',
  '弧状云': 'arcus', '滩云': 'shelf_cloud', '滚轴云': 'roll_cloud',
  '山帽云': 'cap_cloud', '旗云': 'banner_cloud', '云街': 'cloud_streets',
  '云中波': 'waves_in_clouds', '马蹄涡': 'horseshoe_vortex',
  '晕': 'halo', '22度晕': 'halo_22', '幻日': 'sundogs',
  '日柱': 'sun_pillars', '下映日': 'subsun', '环天顶弧': 'circumzenithal_arc',
  '华': 'corona', '宝光': 'glory', '虹彩云': 'iridescence', '彩云': 'iridescence',
  '彩虹': 'rainbow', '云虹': 'cloudbow', '雾虹': 'fogbow',
  '布罗肯幽灵': 'brocken_spectre', '钻石尘': 'diamond_dust', '闪光路径': 'glitter_paths',
  '夜光云': 'noctilucent', '贝母云': 'nacreous', '珠母云': 'nacreous',
  '雨幡洞云': 'fallstreak_hole', '穿洞云': 'fallstreak_hole',
  '穿孔云': 'hole_punch', '雨幡': 'fallstreaks', '云中孔洞': 'holes_in_clouds',
  '阵晨风云': 'morning_glory', '开尔文-亥姆霍兹波': 'kelvin_helmholtz',
  '开尔文亥姆霍兹波': 'kelvin_helmholtz', 'KH波': 'kelvin_helmholtz',
  '水母云': 'jellyfish_clouds', 'UFO形状云': 'ufo_clouds',
  '风暴': 'storm', '多单体风暴': 'multicell', '超级单体': 'supercell',
  '阵风锋面': 'gust_front', '陆龙卷': 'landspout', '水龙卷': 'waterspout',
  '漏斗云': 'funnel_cloud', '火积云': 'pyrocumulus', '烟云': 'fumulus',
  '航迹云': 'contrail', '耗散尾迹': 'distrail', '雾': 'fog', '霭': 'mist',
};

// 从 AI 返回文本中提取云名
function extractCloudName(text: string): string {
  if (!text) return '未知云';

  for (const name of KNOWN_CLOUD_NAMES) {
    if (text.includes(name)) {
      return name;
    }
  }

  const match = text.match(/([积层卷雨高荚状悬球滚轴马蹄涡贝母夜光虹彩航迹雾幡洞开尔文亥姆霍兹波]+云|[积层卷雨高荚状悬球滚轴]+)/);
  if (match) return match[1].endsWith('云') ? match[1] : match[1] + '云';

  return text.split(/[（(]/)[0].trim().substring(0, 6) || '云';
}

// 根据云名找到 cloudCard ID
function findCloudIdByName(name: string): string | null {
  if (!name) return null;
  const normalized = name.trim().replace(/\s+/g, '');

  // 1. 别名直接匹配
  if (NAME_TO_ID[normalized]) return NAME_TO_ID[normalized];

  // 2. cloudCards 精确匹配
  const exact = cloudCards.find(c => c.name === normalized);
  if (exact) return exact.id;

  // 3. 包含匹配
  const contains = cloudCards.find(c => normalized.includes(c.name) || c.name.includes(normalized));
  if (contains) return contains.id;

  // 4. 去"云"模糊匹配
  const simple = normalized.replace(/云$/, '');
  if (simple) {
    const fuzzy = cloudCards.find(c => {
      const cs = c.name.replace(/云$/, '');
      return simple.includes(cs) || cs.includes(simple);
    });
    if (fuzzy) return fuzzy.id;
  }

  return null;
}

// 将 AI 结果映射到 RecognitionResult
function mapToRecognitionResult(parsed: ParsedResult): RecognitionResult | null {
  // 优先从云种/变种匹配更细的分类，匹配不到再回退到云属
  const speciesName = extractCloudName(parsed.species);
  const speciesId = findCloudIdByName(speciesName);
  const genusName = extractCloudName(parsed.genus);
  const genusId = findCloudIdByName(genusName);
  const cloudId = speciesId || genusId;

  if (!cloudId) return null;

  const card = cloudCardMap.get(cloudId);
  if (!card) return null;

  const aiAnalysis: AIAnalysis = {
    family: parsed.family,
    genus: parsed.genus,
    species: parsed.species,
    features: parsed.features,
    weather: parsed.weather,
    knowledge: parsed.knowledge,
  };

  return {
    cloudId: card.id,
    cloudName: card.name,
    latinName: card.latin,
    confidence: parsed.confidence / 10,
    score: card.score,
    rarity: card.rarity,
    description: card.description,
    category: card.category,
    features: card.features,
    aiAnalysis,
  };
}

// 压缩图片为 base64 缩略图
export function compressToThumbnail(file: File, maxWidth = 200, quality = 0.6): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(reader.result as string);
        }
      };
      img.onerror = () => resolve(reader.result as string);
      img.src = reader.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

// 主入口：识别云朵
export async function recognizeCloud(file: File): Promise<RecognitionResult> {
  const imageBase64 = await fileToBase64(file);
  const parsed = await callRecognizeAPI(imageBase64);

  const result = mapToRecognitionResult(parsed);
  if (!result) {
    throw new Error('NO_CLOUD_DETECTED');
  }

  return result;
}
