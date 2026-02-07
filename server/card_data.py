"""
卡牌积分和稀有度数据（从 cloudCards.ts 提取）
用于服务端积分计算
"""

CARD_DATA = {
    # 基础云型 - 10种云属
    'cirrus':         {'score': 10, 'rarity': '常见'},
    'cirrostratus':   {'score': 10, 'rarity': '常见'},
    'cirrocumulus':   {'score': 15, 'rarity': '较少见'},
    'altostratus':    {'score': 10, 'rarity': '常见'},
    'altocumulus':    {'score': 10, 'rarity': '常见'},
    'stratus':        {'score': 10, 'rarity': '常见'},
    'stratocumulus':  {'score': 10, 'rarity': '常见'},
    'nimbostratus':   {'score': 10, 'rarity': '常见'},
    'cumulus':        {'score': 10, 'rarity': '常见'},
    'cumulonimbus':   {'score': 15, 'rarity': '较常见'},
    # 云种 - 6种
    'fibratus':       {'score': 10, 'rarity': '常见'},
    'castellanus':    {'score': 15, 'rarity': '较少见'},
    'lenticularis':   {'score': 20, 'rarity': '较少见'},
    'undulatus':      {'score': 15, 'rarity': '较少见'},
    'radiatus':       {'score': 15, 'rarity': '较少见'},
    'lacunosus':      {'score': 25, 'rarity': '少见'},
    # 变种 - 4种
    'duplicatus':     {'score': 15, 'rarity': '较少见'},
    'perlucidus':     {'score': 10, 'rarity': '常见'},
    'translucidus':   {'score': 10, 'rarity': '常见'},
    'opacus':         {'score': 10, 'rarity': '常见'},
    # 附属云 & 补充特征 - 8种
    'incus':          {'score': 20, 'rarity': '较少见'},
    'mamma':          {'score': 30, 'rarity': '少见'},
    'pileus':         {'score': 25, 'rarity': '少见'},
    'velum':          {'score': 20, 'rarity': '较少见'},
    'pannus':         {'score': 15, 'rarity': '常见'},
    'tuba':           {'score': 35, 'rarity': '少见'},
    'praecipitatio':  {'score': 10, 'rarity': '常见'},
    'virga':          {'score': 20, 'rarity': '较少见'},
    # 动力/边界型 - 8种
    'arcus':          {'score': 25, 'rarity': '少见'},
    'shelf_cloud':    {'score': 30, 'rarity': '少见'},
    'roll_cloud':     {'score': 30, 'rarity': '少见'},
    'cap_cloud':      {'score': 10, 'rarity': '较少见'},
    'banner_cloud':   {'score': 10, 'rarity': '较少见'},
    'cloud_streets':  {'score': 15, 'rarity': '较少见'},
    'waves_in_clouds': {'score': 15, 'rarity': '较少见'},
    'horseshoe_vortex': {'score': 50, 'rarity': '罕见'},
    # 光学现象 - 9种
    'halo':           {'score': 15, 'rarity': '较少见'},
    'halo_22':        {'score': 15, 'rarity': '较少见'},
    'sundogs':        {'score': 25, 'rarity': '少见'},
    'sun_pillars':    {'score': 25, 'rarity': '少见'},
    'subsun':         {'score': 30, 'rarity': '少见'},
    'circumzenithal_arc': {'score': 30, 'rarity': '少见'},
    'corona':         {'score': 20, 'rarity': '较少见'},
    'glory':          {'score': 25, 'rarity': '少见'},
    'iridescence':    {'score': 20, 'rarity': '较少见'},
    # 彩虹 - 3种
    'rainbow':        {'score': 15, 'rarity': '较少见'},
    'cloudbow':       {'score': 25, 'rarity': '少见'},
    'fogbow':         {'score': 25, 'rarity': '少见'},
    # 特殊光学 - 3种
    'brocken_spectre': {'score': 30, 'rarity': '少见'},
    'diamond_dust':   {'score': 30, 'rarity': '少见'},
    'glitter_paths':  {'score': 15, 'rarity': '较少见'},
    # 高空/极地 - 2种
    'noctilucent':    {'score': 45, 'rarity': '罕见'},
    'nacreous':       {'score': 45, 'rarity': '罕见'},
    # 穿孔/异常 - 4种
    'fallstreak_hole': {'score': 35, 'rarity': '少见'},
    'hole_punch':     {'score': 35, 'rarity': '少见'},
    'fallstreaks':    {'score': 20, 'rarity': '较少见'},
    'holes_in_clouds': {'score': 25, 'rarity': '少见'},
    # 极端/戏剧性 - 4种
    'morning_glory':  {'score': 40, 'rarity': '罕见'},
    'kelvin_helmholtz': {'score': 55, 'rarity': '极罕见'},
    'jellyfish_clouds': {'score': 30, 'rarity': '少见'},
    'ufo_clouds':     {'score': 25, 'rarity': '少见'},
    # 风暴系统 - 9种
    'storm':          {'score': 15, 'rarity': '常见'},
    'multicell':      {'score': 20, 'rarity': '较少见'},
    'supercell':      {'score': 35, 'rarity': '少见'},
    'gust_front':     {'score': 15, 'rarity': '较少见'},
    'landspout':      {'score': 40, 'rarity': '罕见'},
    'waterspout':     {'score': 35, 'rarity': '少见'},
    'funnel_cloud':   {'score': 30, 'rarity': '少见'},
    'pyrocumulus':    {'score': 10, 'rarity': '较少见'},
    'fumulus':        {'score': 5,  'rarity': '常见'},
    # 人造云 - 2种
    'contrail':       {'score': 10, 'rarity': '常见'},
    'distrail':       {'score': 10, 'rarity': '较少见'},
    # 雾 - 2种
    'fog':            {'score': 15, 'rarity': '常见'},
    'mist':           {'score': 10, 'rarity': '常见'},
}

# 稀有度解锁费用
RARITY_UNLOCK_COSTS = {
    '常见': 10,
    '较常见': 20,
    '较少见': 40,
    '少见': 80,
    '罕见': 150,
    '极罕见': 300,
}

# 初始配置
INITIAL_POINTS = 30
STARTER_CARD_IDS = ['cirrus', 'cumulus', 'stratus']
COOLDOWN_MS = 5 * 60 * 1000  # 5分钟冷却


def get_streak_multiplier(streak_count: int) -> float:
    """连续发现加成：同一稀有度连续收集时的积分倍率"""
    return min(1 + (streak_count - 1) * 0.2, 2.0)
