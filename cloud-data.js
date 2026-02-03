// 云朵知识数据库 - 基于《云彩收集者手册》

const CLOUD_DATABASE = {
    // 低云族 (云底 < 2000米)
    low: [
        {
            id: 'cumulus',
            name: '积云',
            latin: 'Cumulus',
            family: '低云族',
            height: '< 2000米',
            icon: '☁️',
            score: 10,
            rarity: '常见',
            description: '棉絮状的云朵，云底平坦，是好天气的象征。由上升暖气流形成，通常在日落前消散。',
            weather: '通常预示好天气，但浓积云可能发展成雷暴。',
            features: ['云底平坦', '棉絮状外观', '白色蓬松'],
            hint: '晴朗午后抬头看，像棉花糖的就是它',
            whenToFind: '晴天上午10点至下午4点',
            whereToFind: '开阔地带、草原、海边',
            subtypes: [
                { name: '淡积云', desc: '水平宽度 > 垂直厚度，好天气云' },
                { name: '中积云', desc: '垂直厚度 ≈ 水平宽度' },
                { name: '浓积云', desc: '垂直厚度 > 水平宽度，云底暗黑' },
                { name: '碎积云', desc: '破碎状，边缘参差不齐' }
            ]
        },
        {
            id: 'stratocumulus',
            name: '层积云',
            latin: 'Stratocumulus',
            family: '低云族',
            height: '< 2000米',
            icon: '🌥️',
            score: 10,
            rarity: '常见',
            description: '低低的一层或一团云，有边界明晰的团块状底部。用手指测试：三指并拢，小云块宽度大于三指宽度。',
            weather: '通常不带来降水，但可能伴有毛毛雨。',
            features: ['团块状', '边界清晰', '成片分布'],
            hint: '清晨或傍晚常见，像拼图一样连成片',
            whenToFind: '清晨或傍晚，阴天时',
            whereToFind: '任何地方，秋冬季更常见',
            subtypes: [
                { name: '成层状层积云', desc: '平铺成层' },
                { name: '荚状层积云', desc: '凸透镜状' },
                { name: '堡状层积云', desc: '有炮塔状凸起' }
            ]
        },
        {
            id: 'stratus',
            name: '层云',
            latin: 'Stratus',
            family: '低云族',
            height: '0-450米',
            icon: '🌫️',
            score: 10,
            rarity: '常见',
            description: '高度最低的云，云层灰暗无特色。由潮湿空气吹过寒冷表面或夜间雾被风搅动抬升形成。',
            weather: '可能带来毛毛雨或小雪，能见度较低。',
            features: ['均匀灰色', '无特色', '高度很低'],
            hint: '阴沉的日子里，天空灰蒙蒙一片',
            whenToFind: '潮湿天气、清晨雾散后',
            whereToFind: '沿海地区、山谷',
            subtypes: [
                { name: '薄幕层云', desc: '薄而透明的层云' },
                { name: '碎层云', desc: '破碎的层云' }
            ]
        }
    ],

    // 中云族 (云底 2000-6000米)
    middle: [
        {
            id: 'altocumulus',
            name: '高积云',
            latin: 'Altocumulus',
            family: '中云族',
            height: '2000-6000米',
            icon: '⛅',
            score: 10,
            rarity: '常见',
            description: '成团的小云块，背离太阳的一侧有阴影。手指测试：云块大小约为一指宽到三指宽。',
            weather: '晴朗时出现的高积云通常预示天气稳定，但如果早晨出现可能预示雷暴。',
            features: ['小云块成群', '有阴影', '排列规则'],
            hint: '像天上的羊群，一块块排列整齐',
            whenToFind: '晴朗天气的早晨或傍晚',
            whereToFind: '开阔视野处，秋季最常见',
            subtypes: [
                { name: '成层状高积云', desc: '平铺分布' },
                { name: '荚状高积云', desc: '飞碟状或凸透镜状' },
                { name: '堡状高积云', desc: '锯齿状凸起' },
                { name: '絮状高积云', desc: '絮状不规则' }
            ]
        },
        {
            id: 'altostratus',
            name: '高层云',
            latin: 'Altostratus',
            family: '中云族',
            height: '2000-6000米',
            icon: '🌥️',
            score: 10,
            rarity: '常见',
            description: '无特征的灰暗云层，像天空蒙上了一层磨砂玻璃。透过高层云看太阳，边缘模糊。',
            weather: '通常预示即将降水，可能带来毛毛雨或小雪。',
            features: ['均匀灰色', '像磨砂玻璃', '无晕现象'],
            hint: '太阳像隔着毛玻璃，边缘模糊不清',
            whenToFind: '锋面来临前',
            whereToFind: '降雨前的任何地方',
            subtypes: []
        }
    ],

    // 高云族 (云底 > 6000米)
    high: [
        {
            id: 'cirrus',
            name: '卷云',
            latin: 'Cirrus',
            family: '高云族',
            height: '> 6000米',
            icon: '🌤️',
            score: 10,
            rarity: '常见',
            description: '外形优雅缥缈，全部由冰晶组成，像白色的头发或羽毛丝。',
            weather: '单独出现预示好天气，但增厚可能预示降雨。',
            features: ['丝状', '冰晶组成', '白色优雅'],
            hint: '像天使的羽毛，纤细优雅飘在高空',
            whenToFind: '晴朗天气',
            whereToFind: '任何地方，需仰望高空',
            subtypes: [
                { name: '毛卷云', desc: '云丝紧密排布' },
                { name: '钩卷云', desc: '末端向上弯曲成钩状' },
                { name: '密卷云', desc: '较厚较密' },
                { name: '堡状卷云', desc: '有小凸起' },
                { name: '絮状卷云', desc: '絮团状' }
            ]
        },
        {
            id: 'cirrocumulus',
            name: '卷积云',
            latin: 'Cirrocumulus',
            family: '高云族',
            height: '> 6000米',
            icon: '🌤️',
            score: 15,
            rarity: '较少见',
            description: '很高的成块小云块，几乎全部由冰晶组成。手指测试：小云块尺寸不大于一根手指宽度。',
            weather: '罕见且短暂，通常预示天气稳定。',
            features: ['极小云块', '鱼鳞状', '高空冰晶'],
            hint: '像鱼鳞铺满天空，细小而密集',
            whenToFind: '晴朗天气，出现时间短暂',
            whereToFind: '高纬度地区更常见',
            subtypes: []
        },
        {
            id: 'cirrostratus',
            name: '卷层云',
            latin: 'Cirrostratus',
            family: '高云族',
            height: '> 6000米',
            icon: '🌤️',
            score: 10,
            rarity: '常见',
            description: '稀薄朴素的云层，像蓝天上铺了一层浅浅的乳白色面纱。能产生晕现象。',
            weather: '常预示锋面接近，可能有降水。',
            features: ['薄纱状', '产生晕', '透明度高'],
            hint: '太阳或月亮周围有光晕时抬头看',
            whenToFind: '锋面来临前24-48小时',
            whereToFind: '任何地方',
            subtypes: []
        }
    ],

    // 垂直发展云
    vertical: [
        {
            id: 'nimbostratus',
            name: '雨层云',
            latin: 'Nimbostratus',
            family: '垂直发展云',
            height: '跨越多个高度层',
            icon: '🌧️',
            score: 10,
            rarity: '常见',
            description: '延伸到不止一个高度上的暗灰色云层，带来持续性降水。',
            weather: '带来持续性降水（雨或雪），通常持续数小时。',
            features: ['暗灰色', '持续降水', '厚重'],
            hint: '连绵细雨时，抬头看到的灰暗云层',
            whenToFind: '连续降雨天气',
            whereToFind: '任何地方，雨天常见',
            subtypes: []
        },
        {
            id: 'cumulonimbus',
            name: '积雨云',
            latin: 'Cumulonimbus',
            family: '垂直发展云',
            height: '从近地面到对流层顶',
            icon: '⛈️',
            score: 15,
            rarity: '较常见',
            description: '延伸到三个高度层的强对流云，是暴风雨之王。顶部常有砧状结构。',
            weather: '带来雷暴、大雨、冰雹，甚至龙卷风。',
            features: ['巨大', '砧状顶', '雷暴'],
            hint: '暴风雨之王！远处看像巨大的铁砧',
            whenToFind: '夏季午后，雷暴来临前',
            whereToFind: '热带和温带地区的夏季',
            subtypes: [
                { name: '秃积雨云', desc: '顶部柔软丘状，非纤维状' },
                { name: '鬃积雨云', desc: '顶部扩展成砧状，有纤维结构' }
            ]
        }
    ],

    // 特殊云
    special: [
        {
            id: 'lenticular',
            name: '荚状云',
            latin: 'Lenticularis',
            family: '特殊云',
            height: '变化',
            icon: '🛸',
            score: 20,
            rarity: '较少见',
            description: '凸透镜状或飞碟状的云，由潮湿气流越过上升地形形成，位置相对固定。',
            weather: '预示高空风较强，山区可能有强风。',
            features: ['飞碟状', '凸透镜形', '位置固定'],
            hint: '山脉附近的"UFO"！静止不动的飞碟形状',
            whenToFind: '有风的日子，山脉下风处',
            whereToFind: '高山地区、丘陵山脉附近',
            subtypes: []
        },
        {
            id: 'cap_cloud',
            name: '山帽云',
            latin: 'Pileus',
            family: '地形云',
            height: '山顶高度',
            icon: '🏔️',
            score: 10,
            rarity: '较少见',
            description: '悬在山顶周围的云，像小瓜皮帽或大婚礼帽。由稳定气流上升越过山峰时遇冷凝结形成。',
            weather: '预示天气稳定，但可能有轻风。',
            features: ['帽状', '围绕山顶', '稳定'],
            hint: '山峰戴上了一顶小帽子',
            whenToFind: '湿度较高时',
            whereToFind: '高山山顶，如富士山、珠峰等',
            subtypes: []
        },
        {
            id: 'banner_cloud',
            name: '旗云',
            latin: 'Banner Cloud',
            family: '地形云',
            height: '山峰高度',
            icon: '🚩',
            score: 10,
            rarity: '较少见',
            description: '像山峰的头发随风飘起，由猛烈的风吹过山峰时气压下降导致空气冷却凝结形成。',
            weather: '预示高空强风。',
            features: ['旗帜状', '山峰附近', '随风飘动'],
            hint: '山顶飘出的"旗帜"，像头发被风吹起',
            whenToFind: '大风天气',
            whereToFind: '高耸独立的山峰，如马特洪峰',
            subtypes: []
        },
        {
            id: 'kelvin_helmholtz',
            name: '开尔文-亥姆霍兹波',
            latin: 'Kelvin-Helmholtz Wave',
            family: '特殊云',
            height: '变化',
            icon: '🌊',
            score: 55,
            rarity: '极罕见',
            description: '云彩收集界的皇冠明珠！轮廓分明，像岸边破碎的巨大海浪，持续仅1-2分钟。',
            weather: '预示高空有强烈风切变。',
            features: ['海浪状', '极短暂', '风切变'],
            hint: '传说级！像天上的冲浪巨浪，仅持续1-2分钟',
            whenToFind: '风切变强烈时，需要极大运气',
            whereToFind: '任何地方，需随时准备相机',
            subtypes: []
        },
        {
            id: 'contrail',
            name: '航迹云',
            latin: 'Contrail',
            family: '人造云',
            height: '8500-12000米',
            icon: '✈️',
            score: 10,
            rarity: '常见',
            description: '沿着飞机飞行路径的白色长斜线，由飞机热废气中的水蒸气与冷空气混合凝结成冰晶形成。',
            weather: '持续时间长预示高空湿度大。',
            features: ['直线状', '飞机后方', '冰晶'],
            hint: '跟着飞机尾迹找，笔直的白色线条',
            whenToFind: '任何时候有飞机经过',
            whereToFind: '航线下方，机场附近更常见',
            subtypes: []
        },
        {
            id: 'mammatus',
            name: '悬球状云',
            latin: 'Mammatus',
            family: '附属特征',
            height: '变化',
            icon: '🫧',
            score: 30,
            rarity: '少见',
            description: '从云层底部悬吊下来的球状，像牛羊乳房，直径1-3千米，持续约10分钟。',
            weather: '通常出现在暴风雨之后，说明暴风雨已过去。',
            features: ['球状悬挂', '云底下方', '短暂'],
            hint: '暴风雨后的礼物！云底挂满泡泡状凸起',
            whenToFind: '雷暴过后10-30分钟内',
            whereToFind: '积雨云底部，傍晚光线最美',
            subtypes: []
        },
        {
            id: 'roll_cloud',
            name: '滚轴云',
            latin: 'Volutus',
            family: '特殊云',
            height: '低空',
            icon: '🌀',
            score: 30,
            rarity: '少见',
            description: '长而低的管子形云，从地平线一端延伸至另一端，移动速度可达56千米/小时。',
            weather: '预示阵风或天气变化。',
            features: ['管状', '滚动', '水平延伸'],
            hint: '巨大的天空卷轴！横跨整个地平线滚动',
            whenToFind: '清晨，海风或冷锋前沿',
            whereToFind: '海岸线、开阔平原',
            subtypes: []
        },
        {
            id: 'horseshoe_vortex',
            name: '马蹄涡',
            latin: 'Horseshoe Vortex',
            family: '特殊云',
            height: '低空',
            icon: '🧲',
            score: 50,
            rarity: '罕见',
            description: '轻微旋转的新月状，上下颠倒的马蹄形，持续约1分钟。',
            weather: '预示局部大气不稳定。',
            features: ['马蹄形', '旋转', '极短暂'],
            hint: '转瞬即逝的倒马蹄！仅持续约1分钟',
            whenToFind: '对流活动旺盛时，极需运气',
            whereToFind: '积云附近，大气不稳定时',
            subtypes: []
        },
        {
            id: 'fallstreak_hole',
            name: '雨幡洞云',
            latin: 'Fallstreak Hole',
            family: '特殊云',
            height: '中高空',
            icon: '🕳️',
            score: 35,
            rarity: '少见',
            description: '中云族或高云族云层中的圆形裂口，下方悬吊着冰晶拖尾。由过冷液滴连锁反应冷冻形成。',
            weather: '不预示特定天气，是有趣的大气现象。',
            features: ['圆形孔洞', '冰晶拖尾', '云层中'],
            hint: '云层上被打了一个洞！有冰晶尾巴垂下',
            whenToFind: '高积云或卷积云层存在时',
            whereToFind: '机场附近更常见（飞机触发）',
            subtypes: []
        },
        {
            id: 'nacreous',
            name: '贝母云',
            latin: 'Nacreous Cloud',
            family: '高空云',
            height: '16-32千米（平流层）',
            icon: '🌈',
            score: 45,
            rarity: '罕见',
            description: '出现在平流层的极高云，温度约-85℃，呈现美丽柔和的彩虹色调。',
            weather: '不影响地面天气，但与臭氧层化学有关。',
            features: ['彩虹色', '平流层', '极寒'],
            hint: '珍珠般的彩虹色！日出日落时分的平流层宝石',
            whenToFind: '冬季日出前或日落后',
            whereToFind: '高纬度地区（北欧、南极等）',
            subtypes: []
        },
        {
            id: 'noctilucent',
            name: '夜光云',
            latin: 'Noctilucent Cloud',
            family: '高空云',
            height: '48-80千米（中间层）',
            icon: '🌙',
            score: 45,
            rarity: '罕见',
            description: '地球上最高的云，温度低至-125℃，呈怪异的蓝白色，有微妙涟漪或波浪状。',
            weather: '北半球5-8月可见，南半球11-3月可见。',
            features: ['蓝白色', '夜间可见', '极高'],
            hint: '午夜的幽灵之光！深夜仍在发光的诡异蓝色',
            whenToFind: '夏季深夜，日落后1-2小时',
            whereToFind: '纬度50-70度地区最佳',
            subtypes: []
        },
        {
            id: 'iridescent',
            name: '虹彩云',
            latin: 'Iridescent Cloud',
            family: '光学现象',
            height: '变化',
            icon: '🌈',
            score: 20,
            rarity: '较少见',
            description: '光线穿过云层时发生衍射形成的彩色光带，呈现柔和的珠母色。',
            weather: '不预示特定天气，是美丽的光学现象。',
            features: ['彩色光带', '衍射现象', '云边缘'],
            hint: '云朵边缘的彩虹！太阳附近的薄云最容易出现',
            whenToFind: '太阳高度角30-60度时',
            whereToFind: '太阳附近的薄云边缘',
            subtypes: []
        },
        {
            id: 'fog',
            name: '雾',
            latin: 'Fog',
            family: '特殊云',
            height: '地面',
            icon: '🌫️',
            score: 15,
            rarity: '常见',
            description: '接触地面的云，能见度小于1千米。可由辐射冷却、暖空气过冷面或冷空气过暖水面形成。',
            weather: '影响能见度，通常早晨消散。',
            features: ['接地', '低能见度', '湿润'],
            hint: '地面上的云！清晨山谷河边最常见',
            whenToFind: '清晨，夜间晴朗无风之后',
            whereToFind: '河谷、湖泊、沿海地区',
            subtypes: [
                { name: '辐射雾', desc: '夜间地面辐射冷却形成' },
                { name: '平流雾', desc: '暖空气吹过冷表面形成' },
                { name: '蒸汽雾', desc: '冷空气吹过暖水面形成' }
            ]
        }
    ]
};

// 云朵识别提示词模板
const CLOUD_RECOGNITION_PROMPT = `你是一位专业的云彩识别专家，精通《云彩收集者手册》中的所有云彩分类知识。

请分析这张云朵图片，识别出图中的云彩类型。

请按以下JSON格式返回结果（仅返回JSON，不要其他文字）：
{
    "cloudType": "云的中文名称",
    "latinName": "云的拉丁学名",
    "family": "云族（低云族/中云族/高云族/垂直发展云/特殊云）",
    "height": "估计云底高度",
    "confidence": 0.85,
    "score": 10,
    "rarity": "稀有度（常见/较少见/少见/罕见/极罕见）",
    "description": "对这片云的详细描述，包括其形态特征",
    "weatherHint": "这种云可能预示的天气",
    "features": ["特征1", "特征2", "特征3"],
    "subtype": "如果能识别出具体云种/变种，请注明"
}

云彩分类参考：
- 低云族（<2000米）：积云、层积云、层云
- 中云族（2000-6000米）：高积云、高层云
- 高云族（>6000米）：卷云、卷积云、卷层云
- 垂直发展云：雨层云、积雨云
- 特殊云：荚状云、山帽云、旗云、开尔文-亥姆霍兹波、航迹云、悬球状云、滚轴云、马蹄涡、雨幡洞云、贝母云、夜光云、虹彩云、雾等

评分标准：
- 常见云（积云、层积云等）：10分
- 较少见云（卷积云、荚状云等）：15-20分
- 少见云（悬球状云、滚轴云等）：30-35分
- 罕见云（贝母云、夜光云、马蹄涡等）：45-50分
- 极罕见云（开尔文-亥姆霍兹波）：55分`;

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CLOUD_DATABASE, CLOUD_RECOGNITION_PROMPT };
}
