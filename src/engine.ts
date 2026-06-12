import { Chess, Square } from 'chess.js';
import { Difficulty } from './types';

// Piece weights
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Opening books: maps moves sequence strings (san or uci) or PGN starters to optimal responses
const OPENING_BOOK: Record<string, string[]> = {
  // Empty board starter (we play white or respond to white's first moves)
  '': ['e4', 'd4', 'Nf3', 'c4'],
  // Responses to e4
  'e4': ['c5', 'e5', 'e6', 'c6'], // c5: Sicilian, e5: Open Games, e6: French, c6: Caro-Kann
  'e4 c5': ['Nf3', 'Nc3', 'c3'], // Sicilian reactions
  'e4 e5': ['Nf3', 'Bc4', 'f4'], // Italian/King's Gambit setup
  'e4 e5 Nf3': ['Nc6', 'Nf6', 'd6'], // response
  'e4 e5 Nf3 Nc6': ['Bb5', 'Bc4', 'd4'], // Bb5: Ruy Lopez, Bc4: Italian Game
  // Responses to d4
  'd4': ['Nf6', 'd5', 'f5'], // Nf6: Indian defenses, d5: Queen's Gambit setups
  'd4 d5': ['c4', 'Nf3', 'Bf4'], // c4: Queen's Gambit
  'd4 Nf6': ['c4', 'Nf3', 'g3'],
  'd4 Nf6 c4': ['g6', 'e6', 'd6'], // g6: King's Indian Defense
};

// Piece-Square Tables (White perspective, flipped for black)
const PAWN_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_TABLE = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

const BISHOP_TABLE = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];

const ROOK_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [0,  0,  0,  5,  5,  0,  0,  0]
];

const QUEEN_TABLE = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [-5,  0,  5,  5,  5,  5,  0, -5],
  [0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  5,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20]
];

const KING_MIDGAME_TABLE = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [20, 20,  0,  0,  0,  0, 20, 20],
  [20, 30, 10,  0,  0, 10, 30, 20]
];

const KING_ENDGAME_TABLE = [
  [-50,-40,-30,-20,-20,-30,-40,-50],
  [-30,-20,-10,  0,  0,-10,-20,-30],
  [-30,-10, 20, 30, 30, 20,-10,-30],
  [-30,-10, 30, 40, 40, 30,-10,-30],
  [-30,-10, 30, 40, 40, 30,-10,-30],
  [-30,-10, 20, 30, 30, 20,-10,-30],
  [-30,-30,  0,  0,  0,  0,-30,-30],
  [-50,-30,-30,-30,-30,-30,-30,-50]
];

// Helper to get index relative to White's view
function getPositionBonus(pieceType: string, color: 'w' | 'b', row: number, col: number, isEndgame: boolean): number {
  const tableRow = color === 'w' ? 7 - row : row;
  const tableCol = color === 'w' ? col : 7 - col;

  switch (pieceType) {
    case 'p': return PAWN_TABLE[tableRow][tableCol];
    case 'n': return KNIGHT_TABLE[tableRow][tableCol];
    case 'b': return BISHOP_TABLE[tableRow][tableCol];
    case 'r': return ROOK_TABLE[tableRow][tableCol];
    case 'q': return QUEEN_TABLE[tableRow][tableCol];
    case 'k': return isEndgame ? KING_ENDGAME_TABLE[tableRow][tableCol] : KING_MIDGAME_TABLE[tableRow][tableCol];
    default: return 0;
  }
}

/**
 * Static positional assessment of the current board state
 */
export function evaluateBoard(chess: Chess): number {
  let score = 0;
  const board = chess.board();

  // Determine if we are in an endgame (queens are off or minimal material)
  let whiteMaterial = 0;
  let blackMaterial = 0;
  let whiteQueens = 0;
  let blackQueens = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        const val = PIECE_VALUES[piece.type];
        if (piece.color === 'w') {
          whiteMaterial += val;
          if (piece.type === 'q') whiteQueens++;
        } else {
          blackMaterial += val;
          if (piece.type === 'q') blackQueens++;
        }
      }
    }
  }

  const isEndgame = (whiteQueens === 0 || whiteMaterial < 1500) && (blackQueens === 0 || blackMaterial < 1500);

  // Accumulate scores
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        let pieceVal = PIECE_VALUES[piece.type];
        let bonus = getPositionBonus(piece.type, piece.color, r, c, isEndgame);
        
        // Accumulate based on turn direction
        if (piece.color === 'w') {
          score += pieceVal + bonus;
        } else {
          score -= (pieceVal + bonus);
        }
      }
    }
  }

  return score;
}

/**
 * Look up moves inside our curated opening database
 */
function checkOpeningBook(chess: Chess): string | null {
  const history = chess.history();
  // Join first few moves (up to 4 moves)
  if (history.length <= 4) {
    const sequenceStr = history.join(' ');
    const possibleMoves = OPENING_BOOK[sequenceStr];
    if (possibleMoves && possibleMoves.length > 0) {
      // Pick a random line from the book
      const selected = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      // Attempt to find the matching legal moves list to confirm safety
      const legalMoves = chess.moves({ verbose: true });
      const matched = legalMoves.find(m => m.san === selected || m.lan === selected || m.from + m.to === selected);
      if (matched) {
        return matched.san;
      }
    }
  }
  return null;
}

/**
 * Order moves to drastically maximize Alpha-Beta pruning efficiency
 */
function orderMoves(chess: Chess, moves: any[]): any[] {
  return moves.map(m => {
    let score = 0;
    // Capture heuristic (MVV-LVA: Most Valuable Victim - Least Valuable Aggressor)
    if (chess.get(m.to)) {
      const victimVal = PIECE_VALUES[chess.get(m.to)!.type];
      const killerVal = PIECE_VALUES[chess.get(m.from)!.type];
      score += 10 * victimVal - killerVal;
    }
    // Promotion moves
    if (m.promotion) {
      score += 900;
    }
    // Check-giving moves
    chess.move(m);
    if (chess.inCheck()) {
      score += 50;
    }
    chess.undo();

    return { move: m, score };
  })
  .sort((a, b) => b.score - a.score)
  .map(item => item.move);
}

/**
 * Primary Alpha-Beta Minimax Engine
 */
function alphaBeta(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): { score: number; move: any | null } {
  // Base terminal cases
  if (depth === 0) {
    return { score: evaluateBoard(chess), move: null };
  }

  if (chess.isGameOver()) {
    if (chess.isCheckmate()) {
      // If white to move is mated, black wins. So if current is maximizing (white), mate is bad (-Infinity/large negative).
      return { score: isMaximizing ? -25000 - depth : 25000 + depth, move: null };
    }
    // Stalemate, 3fold, draw
    return { score: 0, move: null };
  }

  const rawMoves = chess.moves({ verbose: true });
  const sortedMoves = orderMoves(chess, rawMoves);
  
  let bestMove = null;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of sortedMoves) {
      chess.move(move);
      const evaluation = alphaBeta(chess, depth - 1, alpha, beta, false).score;
      chess.undo();

      if (evaluation > maxEval) {
        maxEval = evaluation;
        bestMove = move;
      }
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) {
        break; // beta cutoff
      }
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    for (const move of sortedMoves) {
      chess.move(move);
      const evaluation = alphaBeta(chess, depth - 1, alpha, beta, true).score;
      chess.undo();

      if (evaluation < minEval) {
        minEval = evaluation;
        bestMove = move;
      }
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) {
        break; // alpha cutoff
      }
    }
    return { score: minEval, move: bestMove };
  }
}

/**
 * Interface to fetch the best move for a specific Game configuration
 */
export function getBestMove(
  fen: string,
  difficulty: Difficulty,
  thinkTimeLimitSec: number = 3
): Promise<{ from: string; to: string; promotion?: string; san?: string }> {
  return new Promise((resolve) => {
    // Run in a small setTimeout chunk to let main-event frame breathe, rendering loading spinners smoothly
    setTimeout(() => {
      const chess = new Chess(fen);
      
      // 1. Easy Mode: Completely Random Legal Move
      if (difficulty === 'easy') {
        const moves = chess.moves({ verbose: true });
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        resolve({
          from: randomMove.from,
          to: randomMove.to,
          promotion: randomMove.promotion,
          san: randomMove.san,
        });
        return;
      }

      // Check Opening Book for Medium or Hard depth
      const bookMove = checkOpeningBook(chess);
      if (bookMove) {
        const tempChess = new Chess(fen);
        const notationResult = tempChess.move(bookMove);
        resolve({
          from: notationResult.from,
          to: notationResult.to,
          promotion: notationResult.promotion,
          san: notationResult.san,
        });
        return;
      }

      // 2. Medium Mode: Depth 2 Pruning Engine
      // 3. Hard Mode: Depth 3-4 iterative deepening or standard Depth 3
      const searchDepth = difficulty === 'hard' ? 3 : 2;
      const turnAndColor = chess.turn() === 'w'; // white maximizing, black minimizing

      const { move } = alphaBeta(chess, searchDepth, -Infinity, Infinity, turnAndColor);
      
      if (move) {
        resolve({
          from: move.from,
          to: move.to,
          promotion: move.promotion,
          san: move.san,
        });
      } else {
        // Fallback random move just in case
        const moves = chess.moves({ verbose: true });
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        resolve({
          from: randomMove.from,
          to: randomMove.to,
          promotion: randomMove.promotion,
          san: randomMove.san,
        });
      }
    }, 50); // slight breathing time to trigger reactive animation
  });
}
