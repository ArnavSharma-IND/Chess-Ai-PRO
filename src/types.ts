export type GameMode = 'human-ai' | 'human-human' | 'ai-ai';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type BoardTheme = 'classic' | 'dark' | 'blue' | 'wooden';

export interface GameStats {
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  accuracy: number; // simulated rating/accuracy %
  totalMoves: number;
  averageGameTime: number; // in seconds
}

export interface SavedGame {
  id: string;
  date: string;
  mode: GameMode;
  difficulty: Difficulty;
  fen: string;
  pgn: string;
  result: string;
  theme: BoardTheme;
}

export interface PlayerSettings {
  difficulty: Difficulty;
  theme: BoardTheme;
  volume: number; // 0-100
  aiThinkTime: number; // 1-10 seconds
  playerName: string;
}
