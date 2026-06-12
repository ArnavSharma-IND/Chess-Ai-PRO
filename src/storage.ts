import { GameStats, SavedGame, PlayerSettings, BoardTheme, Difficulty } from './types';

const STATS_KEY = 'chess_pro_stats';
const GAMES_KEY = 'chess_pro_saves';
const SETTINGS_KEY = 'chess_pro_settings';

const DEFAULT_STATS: GameStats = {
  wins: 0,
  losses: 0,
  draws: 0,
  gamesPlayed: 0,
  accuracy: 82.5, // Base default accuracy ELO
  totalMoves: 0,
  averageGameTime: 0,
};

const DEFAULT_SETTINGS: PlayerSettings = {
  difficulty: 'medium',
  theme: 'blue',
  volume: 75,
  aiThinkTime: 3,
  playerName: 'Grandmaster',
};

export const storage = {
  getStats(): GameStats {
    try {
      const data = localStorage.getItem(STATS_KEY);
      if (!data) return { ...DEFAULT_STATS };
      const parsed = JSON.parse(data);
      return {
        wins: typeof parsed.wins === 'number' ? parsed.wins : 0,
        losses: typeof parsed.losses === 'number' ? parsed.losses : 0,
        draws: typeof parsed.draws === 'number' ? parsed.draws : 0,
        gamesPlayed: typeof parsed.gamesPlayed === 'number' ? parsed.gamesPlayed : 0,
        accuracy: typeof parsed.accuracy === 'number' ? parsed.accuracy : 82.5,
        totalMoves: typeof parsed.totalMoves === 'number' ? parsed.totalMoves : 0,
        averageGameTime: typeof parsed.averageGameTime === 'number' ? parsed.averageGameTime : 0,
      };
    } catch {
      return { ...DEFAULT_STATS };
    }
  },

  saveStats(stats: GameStats): void {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {
      console.error('Failed to save stats:', e);
    }
  },

  updateStats(result: 'win' | 'loss' | 'draw', movesCount: number, timeSpentSec: number): GameStats {
    const stats = this.getStats();
    stats.gamesPlayed += 1;
    stats.totalMoves += movesCount;
    if (result === 'win') stats.wins += 1;
    else if (result === 'loss') stats.losses += 1;
    else stats.draws += 1;

    // Incremental average game time computation
    if (stats.averageGameTime === 0) {
      stats.averageGameTime = timeSpentSec;
    } else {
      stats.averageGameTime = Math.round(
        (stats.averageGameTime * (stats.gamesPlayed - 1) + timeSpentSec) / stats.gamesPlayed
      );
    }

    // Dynamic accuracy rating approximation
    const successRatio = (stats.wins + stats.draws * 0.5) / stats.gamesPlayed;
    stats.accuracy = Math.round((50 + successRatio * 45 + Math.min(5, stats.totalMoves / 100)) * 10) / 10;

    this.saveStats(stats);
    return stats;
  },

  getSavedGames(): SavedGame[] {
    try {
      const data = localStorage.getItem(GAMES_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.filter((g) => g && typeof g.id === 'string' && typeof g.fen === 'string');
      }
      return [];
    } catch {
      return [];
    }
  },

  saveGame(game: Omit<SavedGame, 'id' | 'date'>): SavedGame {
    const newGame: SavedGame = {
      ...game,
      id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const games = this.getSavedGames();
    games.unshift(newGame); // newest first
    try {
      localStorage.setItem(GAMES_KEY, JSON.stringify(games));
    } catch (e) {
      console.error('Failed to save game:', e);
    }
    return newGame;
  },

  deleteSavedGame(id: string): void {
    const games = this.getSavedGames().filter((g) => g.id !== id);
    try {
      localStorage.setItem(GAMES_KEY, JSON.stringify(games));
    } catch (e) {
      console.error('Failed to delete game:', e);
    }
  },

  getSettings(): PlayerSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (!data) return { ...DEFAULT_SETTINGS };
      const parsed = JSON.parse(data);
      return {
        difficulty: (['easy', 'medium', 'hard'].includes(parsed.difficulty) ? parsed.difficulty : 'medium') as Difficulty,
        theme: (['classic', 'dark', 'blue', 'wooden'].includes(parsed.theme) ? parsed.theme : 'blue') as BoardTheme,
        volume: typeof parsed.volume === 'number' ? Math.max(0, Math.min(100, parsed.volume)) : 75,
        aiThinkTime: typeof parsed.aiThinkTime === 'number' ? Math.max(1, Math.min(10, parsed.aiThinkTime)) : 3,
        playerName: typeof parsed.playerName === 'string' && parsed.playerName.trim() ? parsed.playerName.substring(0, 20) : 'Grandmaster',
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  },

  saveSettings(settings: PlayerSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }
};
