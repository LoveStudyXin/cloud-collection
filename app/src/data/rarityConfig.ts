import type { Rarity } from '@/types/cloud';

export interface RarityConfig {
  border: string;
  glow: string;
  glowStrong: string;
  label: string;
  labelCN: string;
  unlockCost: number;
  bgGradient: string;
}

export const RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  '常见': {
    border: '#CD7F32',
    glow: 'rgba(205, 127, 50, 0.3)',
    glowStrong: 'rgba(205, 127, 50, 0.6)',
    label: 'Common',
    labelCN: '常见',
    unlockCost: 10,
    bgGradient: 'linear-gradient(135deg, #8B6914 0%, #CD7F32 50%, #DDA15E 100%)',
  },
  '较常见': {
    border: '#CD7F32',
    glow: 'rgba(205, 127, 50, 0.3)',
    glowStrong: 'rgba(205, 127, 50, 0.6)',
    label: 'Common',
    labelCN: '较常见',
    unlockCost: 20,
    bgGradient: 'linear-gradient(135deg, #8B6914 0%, #CD7F32 50%, #DDA15E 100%)',
  },
  '较少见': {
    border: '#C0C0C0',
    glow: 'rgba(192, 192, 192, 0.3)',
    glowStrong: 'rgba(192, 192, 192, 0.6)',
    label: 'Uncommon',
    labelCN: '较少见',
    unlockCost: 40,
    bgGradient: 'linear-gradient(135deg, #808080 0%, #C0C0C0 50%, #E8E8E8 100%)',
  },
  '少见': {
    border: '#C0C0C0',
    glow: 'rgba(192, 192, 192, 0.4)',
    glowStrong: 'rgba(192, 192, 192, 0.7)',
    label: 'Rare',
    labelCN: '少见',
    unlockCost: 80,
    bgGradient: 'linear-gradient(135deg, #707070 0%, #B0B0B0 50%, #D8D8D8 100%)',
  },
  '罕见': {
    border: '#FFD700',
    glow: 'rgba(255, 215, 0, 0.4)',
    glowStrong: 'rgba(255, 215, 0, 0.7)',
    label: 'Legendary',
    labelCN: '罕见',
    unlockCost: 150,
    bgGradient: 'linear-gradient(135deg, #B8860B 0%, #FFD700 50%, #FFF8DC 100%)',
  },
  '极罕见': {
    border: '#FFD700',
    glow: 'rgba(255, 215, 0, 0.6)',
    glowStrong: 'rgba(255, 215, 0, 0.9)',
    label: 'Mythic',
    labelCN: '极罕见',
    unlockCost: 300,
    bgGradient: 'linear-gradient(135deg, #8B6508 0%, #FFD700 30%, #FFFACD 60%, #FFD700 100%)',
  },
};

// 星辰等级配置（点亮次数）
export const STAR_LEVELS = [
  { count: 1, label: '初见', effect: 'lit' },
  { count: 2, label: '熟悉', effect: 'star-1' },
  { count: 3, label: '了解', effect: 'star-2' },
  { count: 4, label: '精通', effect: 'star-3' },
  { count: 5, label: '专家', effect: 'crown' },
] as const;

export const MAX_STARS = 5;
