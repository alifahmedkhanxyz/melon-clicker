export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  ALL_DONE = 'ALL_DONE'
}

export enum ItemType {
  MELON = 'MELON',
  BOMB = 'BOMB',
  ICE = 'ICE'
}

export interface GameObject {
  id: string;
  type: ItemType;
  x: number; // Percentage 0-100
  duration: number; // Seconds to fall
  delay: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  timestamp: number;
}

export interface UserProgress {
  totalScore: number;
  playsLeft: number;
  lastPlayedDate: string;
  lastMinedDate: string;
}

export interface PopEffect {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
}