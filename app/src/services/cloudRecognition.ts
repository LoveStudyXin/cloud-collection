import { cloudCards, cloudCardMap } from '@/data/cloudCards';
import type { RecognitionResult, AIAnalysis } from '@/types/cloud';

const API_BASE_URL = '/api/dashscope/compatible-mode/v1';
const MODEL_NAME = 'qwen-vl-plus';

const API_KEY_STORAGE = 'dashscope_api_key';

// API Key 管理
export function getApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE) || '';
}

export function setApiKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE, key);
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}

// 云彩识别提示词
const CLOUD_RECOGNITION_PROMPT = `你是一位专业的云彩识别专家，精通《云彩收集者手册》中的所有云彩分类知识。

请仔细分析这张云彩图片，按照以下格式输出识别结果。注意：每个部分内容不要重复，各部分应聚焦自己的主题。

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
请只识别图片中最主要、最显著的一种云彩或气象现象，给出一个完整的识别结果即可。`;

// 将 File 转为 base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 调用通义千问视觉 API
async function callQwenVLAPI(imageBase64: string): Promise<ParsedResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  const response = await fetch(`${API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageBase64 },
            },
            {
              type: 'text',
              text: CLOUD_RECOGNITION_PROMPT,
            },
          ],
        },
      ],
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = errorData.error?.message || `API 请求失败 (${response.status})`;
    if (response.status === 401) {
      throw new Error('API_KEY_INVALID');
    }
    throw new Error(msg);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  return parseRecognitionResult(content);
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
  const parsed = await callQwenVLAPI(imageBase64);

  const result = mapToRecognitionResult(parsed);
  if (!result) {
    throw new Error('NO_CLOUD_DETECTED');
  }

  return result;
}
