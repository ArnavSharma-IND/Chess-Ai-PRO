"""
ChessAI Pro - Alpha-Beta Minimax Engine
Contains move sorting heuristics, alpha-beta cutoffs, and transposition table structures.
"""

import chess
import time
from typing import Tuple, Optional, Dict
from .evaluation import evaluate_board, PIECE_VALUES

class MinimaxEngine:
    def __init__(self):
        # Transposition Table: caching computed positions using board Zobrist hashing keys
        self.transposition_table: Dict[int, Tuple[int, int, chess.Move]] = {} # zobrist_key -> (depth, score, best_move)

    def order_moves(self, board: chess.Board, moves: list) -> list:
        """
        Orders moves using heuristics (MVV-LVA, promotions, checks) to optimize pruning ratios.
        """
        scored_moves = []
        for move in moves:
            score = 0
            # Target check
            target_piece = board.piece_at(move.to_square)
            if target_piece:
                attacker_piece = board.piece_at(move.from_square)
                # MVV-LVA heuristic: capture highly valuable victims with less valuable pieces
                victim_val = abs(PIECE_VALUES.get(target_piece.symbol(), 0))
                attacker_val = abs(PIECE_VALUES.get(attacker_piece.symbol() if attacker_piece else 'P', 0))
                score += 10 * victim_val - attacker_val
                
            if move.promotion:
                score += 900
                
            # If giving check
            board.push(move)
            if board.is_check():
                score += 50
            board.pop()
            
            scored_moves.append((score, move))
            
        scored_moves.sort(key=lambda x: x[0], reverse=True)
        return [m[1] for m in scored_moves]

    def search_alpha_beta(
        self, board: chess.Board, depth: int, alpha: int, beta: int, maximizing: bool
    ) -> Tuple[int, Optional[chess.Move]]:
        """
        Primary alpha-beta recursive computation.
        """
        board_hash = hash(board.fen()) # standard fallback hash or direct zobrist-equivalent state
        
        # Check transposition table caching
        if board_hash in self.transposition_table:
            cached_depth, cached_score, cached_move = self.transposition_table[board_hash]
            if cached_depth >= depth:
                return cached_score, cached_move

        if depth == 0 or board.is_game_over():
            return evaluate_board(board), None

        legal_moves = list(board.legal_moves)
        ordered_moves = self.order_moves(board, legal_moves)

        best_move = None
        if maximizing:
            max_eval = -999999
            for move in ordered_moves:
                board.push(move)
                evaluation, _ = self.search_alpha_beta(board, depth - 1, alpha, beta, False)
                board.pop()

                if evaluation > max_eval:
                    max_eval = evaluation
                    best_move = move
                alpha = max(alpha, evaluation)
                if beta <= alpha:
                    break  # Beta cutoff
            self.transposition_table[board_hash] = (depth, max_eval, best_move)
            return max_eval, best_move
        else:
            min_eval = 999999
            for move in ordered_moves:
                board.push(move)
                evaluation, _ = self.search_alpha_beta(board, depth - 1, alpha, beta, True)
                board.pop()

                if evaluation < min_eval:
                    min_eval = evaluation
                    best_move = move
                beta = min(beta, evaluation)
                if beta <= alpha:
                    break  # Alpha cutoff
            self.transposition_table[board_hash] = (depth, min_eval, best_move)
            return min_eval, best_move

    def get_best_move(self, board: chess.Board, max_depth: int = 3, time_limit_sec: float = 3.0) -> Optional[chess.Move]:
        """
        Executes search with iterative deepening and tight time constraint guarding.
        """
        start_time = time.monotonic()
        best_overall_move = None
        
        # Search incrementally (Iterative deepening)
        for current_depth in range(1, max_depth + 1):
            if time.monotonic() - start_time >= time_limit_sec:
                break
                
            # Perform alpha-beta search
            score, move = self.search_alpha_beta(
                board, current_depth, -999999, 999999, board.turn == chess.WHITE
            )
            if move:
                best_overall_move = move
                
        # Fallback if no search completed
        if not best_overall_move:
            legal_moves = list(board.legal_moves)
            if legal_moves:
                best_overall_move = legal_moves[0]
                
        return best_overall_move
