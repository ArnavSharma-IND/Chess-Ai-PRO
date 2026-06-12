"""
ChessAI Pro - Opening Book Theory
Resolves classical opening moves from standard configurations.
"""

import chess
from typing import Optional

OPENING_BOOK = {
    # e4 starter lines
    "": ["e4", "d4", "Nf3", "c4"],
    "e4": ["c5", "e5", "e6", "c6"], # c5 is Sicilian Defense
    "e4 c5": ["Nf3", "Nc3", "c3"],
    "e4 c5 Nf3": ["d6", "e6", "Nc6"],
    "e4 e5": ["Nf3", "Bc4", "f4"], # Open formats
    "e4 e5 Nf3": ["Nc6", "Nf6", "d6"],
    "e4 e5 Nf3 Nc6": ["Bb5", "Bc4", "d4"], # Bb5: Ruy Lopez, Bc4: Italian Game
    # d4 setups
    "d4": ["Nf6", "d5", "f5"],
    "d4 d5": ["c4", "Nf3"], # Queen's Gambit
    "d4 Nf6": ["c4", "Nf3"],
    "d4 Nf6 c4": ["g6", "e6"], # g6 leads to King's Indian Defence
}

def get_book_move(board: chess.Board) -> Optional[chess.Move]:
    """
    Checks history sequence to extract textbook opening movements.
    """
    history_moves = [board.san(m) for m in board.move_stack]
    sequence_string = " ".join(history_moves)
    
    # Try looking up direct matches
    if sequence_string in OPENING_BOOK:
        suggested_moves = OPENING_BOOK[sequence_string]
        for move_san in suggested_moves:
            try:
                move = board.parse_san(move_san)
                if move in board.legal_moves:
                    return move
            except ValueError:
                continue
    return None
