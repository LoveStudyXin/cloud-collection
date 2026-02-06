export interface TarotCard {
  id: number;
  name: string;
  nameCN: string;
  image: string;
  description: string;
  meaning: string;
}

export interface CarouselState {
  currentIndex: number;
  direction: 'left' | 'right';
}
