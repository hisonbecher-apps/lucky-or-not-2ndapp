export type GameId = 
  | 'wheel-of-fortune' 
  | 'lucky-image' 
  | 'daisy-love' 
  | 'short-straw' 
  | 'gift-box' 
  | 'bride-bouquet' 
  | 'fortune-cookie' 
  | 'rps' 
  | 'coin-flip' 
  | 'spin-bottle';

export interface Game {
  id: GameId;
  title: string;
  icon: string;
  color: string;
}

export interface User {
  name: string;
  email: string;
}

export interface Friend {
  id: string;
  name: string;
  avatarColor: string;
  isOnline: boolean;
}

export interface LuckStats {
  wins: number;
  total: number;
}

export interface AppState {
  credits: number;
  lastCreditUpdate: number;
  lastMottoUpdate: number;
  selectedMottoIndex: number;
  skipMotto: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number;
  musicVolume: number;
  lastLuckyImageUpdate: number;
  selectedLuckyImageIndex: number | null;
  luckyImageHistory: number[];
  user: User | null;
  gamesPlayed: number;
  creditsSpent: number;
  friends: Friend[];
  selectedAvatarIndex: number;
  luckHistory: { [date: string]: LuckStats };
  seenFortuneIndices: number[];
}

export const GAMES: Game[] = [
  { id: 'wheel-of-fortune', title: 'Wheel of Fortune', icon: '🎡', color: 'bg-pink-400' },
  { id: 'lucky-image', title: 'Lucky Image', icon: '🖼️', color: 'bg-purple-400' },
  { id: 'gift-box', title: 'Gift Box', icon: '🎁', color: 'bg-blue-400' },
  { id: 'fortune-cookie', title: 'Fortune Cookie', icon: '🥠', color: 'bg-orange-400' },
  { id: 'short-straw', title: 'Short Straw', icon: '🎋', color: 'bg-green-400' },
  { id: 'rps', title: 'Rock Paper Scissors', icon: '✊', color: 'bg-indigo-400' },
  { id: 'spin-bottle', title: 'Spin the Bottle', icon: '🍾', color: 'bg-lime-400' },
  { id: 'coin-flip', title: 'Coin Flip', icon: '🪙', color: 'bg-teal-400' },
  { id: 'bride-bouquet', title: 'Bride Bouquet', icon: '💐', color: 'bg-red-400' },
  { id: 'daisy-love', title: 'Daisy Love', icon: '🌼', color: 'bg-yellow-400' },
];

export interface LuckyImage {
  url: string;
  label: string;
  type: 'lucky' | 'unlucky' | 'poor' | 'rich';
}

export const LUCKY_IMAGES: LuckyImage[] = [
  // Lucky
  { url: 'https://picsum.photos/seed/lucky1/500/500', label: 'Golden Ticket Found!', type: 'lucky' },
  { url: 'https://picsum.photos/seed/lucky2/500/500', label: 'Four-Leaf Clover!', type: 'lucky' },
  { url: 'https://picsum.photos/seed/lucky3/500/500', label: 'Rainbow at your door!', type: 'lucky' },
  { url: 'https://picsum.photos/seed/lucky4/500/500', label: 'Shooting Star!', type: 'lucky' },
  { url: 'https://picsum.photos/seed/lucky5/500/500', label: 'Lucky Penny!', type: 'lucky' },
  { url: 'https://picsum.photos/seed/lucky6/500/500', label: 'Winning Smile!', type: 'lucky' },
  // Unlucky
  { url: 'https://picsum.photos/seed/unlucky1/500/500', label: 'Spilled Salt...', type: 'unlucky' },
  { url: 'https://picsum.photos/seed/unlucky2/500/500', label: 'Broken Mirror...', type: 'unlucky' },
  { url: 'https://picsum.photos/seed/unlucky3/500/500', label: 'Rain on your parade', type: 'unlucky' },
  { url: 'https://picsum.photos/seed/unlucky4/500/500', label: 'Flat tire day', type: 'unlucky' },
  { url: 'https://picsum.photos/seed/unlucky5/500/500', label: 'Lost your keys', type: 'unlucky' },
  { url: 'https://picsum.photos/seed/unlucky6/500/500', label: 'Wrong turn taken', type: 'unlucky' },
  // Poor
  { url: 'https://picsum.photos/seed/poor1/500/500', label: 'Empty Wallet', type: 'poor' },
  { url: 'https://picsum.photos/seed/poor2/500/500', label: 'Bread and Water', type: 'poor' },
  { url: 'https://picsum.photos/seed/poor3/500/500', label: 'Old Shoes', type: 'poor' },
  { url: 'https://picsum.photos/seed/poor4/500/500', label: 'Rusty Bike', type: 'poor' },
  { url: 'https://picsum.photos/seed/poor5/500/500', label: 'Simple Life', type: 'poor' },
  { url: 'https://picsum.photos/seed/poor6/500/500', label: 'Humble Beginnings', type: 'poor' },
  // Rich
  { url: 'https://picsum.photos/seed/rich1/500/500', label: 'Private Jet Life', type: 'rich' },
  { url: 'https://picsum.photos/seed/rich2/500/500', label: 'Diamond Ring', type: 'rich' },
  { url: 'https://picsum.photos/seed/rich3/500/500', label: 'Luxury Mansion', type: 'rich' },
  { url: 'https://picsum.photos/seed/rich4/500/500', label: 'Gold Bars', type: 'rich' },
  { url: 'https://picsum.photos/seed/rich5/500/500', label: 'Yacht Party', type: 'rich' },
  { url: 'https://picsum.photos/seed/rich6/500/500', label: 'Sports Car', type: 'rich' },
  { url: 'https://picsum.photos/seed/rich7/500/500', label: 'Billionaire Status', type: 'rich' },
];

export const MOTTOS = [
  "Today is your lucky day!",
  "Believe in yourself and magic will happen.",
  "A small positive thought can change your whole day.",
  "Good things come to those who wait.",
  "Your smile is your best luck charm.",
  "Fortune favors the bold.",
  "Every moment is a fresh beginning.",
  "Happiness is not by chance, but by choice.",
  "Success is falling nine times and getting up ten.",
  "The best is yet to come."
];

import fortunesData from './assets/fortunes.json';

export const FORTUNE_NOTES = fortunesData;

export interface GiftItem {
  emoji: string;
  label: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const GIFT_ITEMS: GiftItem[] = [
  { emoji: '💎', label: 'Diamond', rarity: 'legendary' },
  { emoji: '💰', label: 'Money Bag', rarity: 'epic' },
  { emoji: '🚗', label: 'Sports Car', rarity: 'epic' },
  { emoji: '🏠', label: 'Mansion', rarity: 'legendary' },
  { emoji: '⌚', label: 'Luxury Watch', rarity: 'rare' },
  { emoji: '📱', label: 'Latest Phone', rarity: 'rare' },
  { emoji: '🍕', label: 'Pizza Party', rarity: 'common' },
  { emoji: '🧸', label: 'Teddy Bear', rarity: 'common' },
  { emoji: '🍫', label: 'Chocolate Box', rarity: 'common' },
  { emoji: '✈️', label: 'Plane Ticket', rarity: 'epic' },
  { emoji: '🎮', label: 'Game Console', rarity: 'rare' },
  { emoji: '🚲', label: 'Bicycle', rarity: 'common' },
  { emoji: '👟', label: 'Sneakers', rarity: 'common' },
  { emoji: '🎸', label: 'Guitar', rarity: 'rare' },
  { emoji: '💍', label: 'Diamond Ring', rarity: 'legendary' },
  { emoji: '🍦', label: 'Ice Cream', rarity: 'common' },
];
