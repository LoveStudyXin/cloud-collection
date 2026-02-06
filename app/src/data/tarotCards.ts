import type { TarotCard } from '@/types/tarot';

export const tarotCards: TarotCard[] = [
  {
    id: 1,
    name: 'The Star',
    nameCN: '星星',
    image: '/images/tarot/star.jpg',
    description: 'Hope and Inspiration',
    meaning: 'A symbol of hope, inspiration, and spiritual guidance. The Star brings renewal and a sense of purpose.'
  },
  {
    id: 2,
    name: 'The Moon',
    nameCN: '月亮',
    image: '/images/tarot/moon.jpg',
    description: 'Intuition and Dreams',
    meaning: 'Trust your intuition and embrace the mysteries of the subconscious. The Moon reveals hidden truths.'
  },
  {
    id: 3,
    name: 'The Sun',
    nameCN: '太阳',
    image: '/images/tarot/sun.jpg',
    description: 'Success and Joy',
    meaning: 'Radiant energy brings success, joy, and vitality. The Sun illuminates your path with positivity.'
  },
  {
    id: 4,
    name: 'The Empress',
    nameCN: '女皇',
    image: '/images/tarot/empress.jpg',
    description: 'Abundance and Creation',
    meaning: 'A symbol of fertility, creativity, and maternal energy. The Empress nurtures growth and prosperity.'
  },
  {
    id: 5,
    name: 'The Fool',
    nameCN: '愚人',
    image: '/images/tarot/fool.jpg',
    description: 'New Beginnings',
    meaning: 'Embrace the unknown with innocence and curiosity. The Fool represents fresh starts and adventure.'
  }
];
