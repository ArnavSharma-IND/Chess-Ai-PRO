"""
ChessAI Pro - Positional Evaluation engine
Heuristics evaluating piece positions, pawn structures, king safety, and material values.
"""

import chess
from ..utils.constants import (
    PIECE_VALUES, PAWN_TABLE, KNIGHT_TABLE, BISHOP_TABLE,
    ROOK_TABLE, QUEEN_TABLE, KING_MIDGAME_TABLE, KING_ENDGAME_TABLE
)

def is_endgame(board: chess.Board) -> bool:
    """
    Decides if the board state has entered the endgame phase (Queens off or minimal files).
    """
    white_queens = len(board.pieces(chess.QUEEN, chess.WHITE))
    black_queens = len(board.pieces(chess.QUEEN, chess.BLACK))
    
    # Calculate minor pieces count
    white_minors = len(board.pieces(chess.BISHOP, chess.WHITE)) + len(board.pieces(chess.KNIGHT, chess.WHITE))
    black_minors = len(board.pieces(chess.BISHOP, chess.BLACK)) + len(board.pieces(chess.KNIGHT, chess.BLACK))

    if white_queens == 0 and black_queens == 0:
        return True
    if white_queens <= 1 and white_minors <= 1 and black_queens <= 1 and black_minors <= 1:
        return True
    return False

def get_piece_square_bonus(piece_type: chess.PieceType, color: chess.Color, square: chess.Square, endgame_phase: bool) -> int:
    """
    Gets bonus value depending on row/col index. Flipped dynamically based on active player perspective.
    """
    row = chess.square_rank(square)
    col = chess.square_file(square)

    # Flipping coords for black pieces to evaluate symmetrically
    table_row = 7 - row if color == chess.WHITE else row
    table_col = col if color == chess.WHITE else 7 - col

    if piece_type == chess.PAWN:
        return PAWN_TABLE[table_row][table_col]
    elif piece_type == chess.KNIGHT:
        return KNIGHT_TABLE[table_row][table_col]
    elif piece_type == chess.BISHOP:
        return BISHOP_TABLE[table_row][table_col]
    elif piece_type == chess.ROOK:
        return ROOK_TABLE[table_row][table_col]
    elif piece_type == chess.QUEEN:
        return QUEEN_TABLE[table_row][table_col]
    elif piece_type == chess.KING:
        if endgame_phase:
            return KING_ENDGAME_TABLE[table_row][table_col]
        return KING_MIDGAME_TABLE[table_row][table_col]
    
    return 0

def evaluate_board(board: chess.Board) -> int:
    """
    Full heuristic evaluation of the board from White perspective (positive is White advantage).
    Returns value in centipawns representing structural bias.
    """
    # 1. Quick Terminal evaluation
    if board.is_game_over():
        outcome = board.outcome()
        if outcome and outcome.winner is not None:
            return 30000 if outcome.winner == chess.WHITE else -30000
        return 0

    score = 0
    endgame_phase = is_endgame(board)

    # 2. Add material & positional alignments
    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if piece is not None:
            symbol = piece.symbol()
            val = PIECE_VALUES.get(symbol, 0)
            bonus = get_piece_square_bonus(piece.piece_type, piece.color, square, endgame_phase)
            
            if piece.color == chess.WHITE:
                score += val + bonus
            else:
                score += val - bonus  # negative valuation for black pieces, val is negative in table map

    # 3. Positional adjustments: Mobility & King Safety
    white_mobility = board.legal_moves.count()
    board.turn = chess.BLACK
    black_mobility = board.legal_moves.count()
    board.turn = chess.WHITE  # Reset turn state
    
    score += (white_mobility - black_mobility) * 8

    # Give a minor penalty for double/isolated pawns for evaluation depths
    # Center ownership boost
    for sq in [chess.D4, chess.E4, chess.D5, chess.E5]:
        p = board.piece_at(sq)
        if p:
            score += 15 if p.color == chess.WHITE else -15

    return score
