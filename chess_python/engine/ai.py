"""
ChessAI Pro - Core Engine Router
Handles routing of moves based on set settings, difficulty ranges, and book lookups.
"""

import chess
import random
from typing import Optional
from .opening_book import get_book_move
from .minimax import MinimaxEngine
from ..utils.logger import get_logger

logger = get_logger("Engine")

class ChessAIEngine:
    def __init__(self):
        self.minimax = MinimaxEngine()

    def find_best_move(self, board: chess.Board, difficulty: str, think_time: float = 3.0) -> Optional[chess.Move]:
        """
        Calculates move for board based on Easy, Medium, or Hard difficulty.
        """
        if board.is_game_over():
            return None

        # Check openings book early for Medium & Hard
        if difficulty in ('medium', 'hard'):
            book_move = get_book_move(board)
            if book_move:
                logger.info(f"Book Move found and applied: {board.san(book_move)}")
                return book_move

        # 1. Easy: Random Moves
        if difficulty == 'easy':
            legal_moves = list(board.legal_moves)
            return random.choice(legal_moves) if legal_moves else None

        # 2. Medium: Minimax depth 2 with piece square positional table bonuses
        elif difficulty == 'medium':
            return self.minimax.get_best_move(board, max_depth=2, time_limit_sec=think_time)

        # 3. Hard: Advanced Minimax depth 3-4 with transposition caches and move sorting
        elif difficulty == 'hard':
            return self.minimax.get_best_move(board, max_depth=3, time_limit_sec=think_time)

        # Fallback
        legal_moves = list(board.legal_moves)
        return legal_moves[0] if legal_moves else None
