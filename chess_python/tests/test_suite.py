"""
ChessAI Pro - Automated Testing Suite
Runs robust test cases covering standard move dynamics, security controls, and SQL injection prevention.
"""

import os
import sys
import pytest
import chess
from pathlib import Path

# Add project root to python path dynamically
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from chess_python.utils.security import SecurityEnforcer, TokenBucketRateLimiter
from chess_python.utils.helpers import check_file_size_safe
from chess_python.database.db import DatabaseManager
from chess_python.engine.evaluation import evaluate_board
from chess_python.engine.ai import ChessAIEngine


# ─── 1. MOVEMENT & RULES VALIDATION TESTS ────────────────────────────────────

def test_initial_board_move_validation():
    """
    Test standard legal first moves validation.
    """
    board = chess.Board()
    # Confirm classical starting move (e4) is valid
    e4_move = board.parse_san("e4")
    assert e4_move in board.legal_moves

    # Confirm invalid movement (e5 on first white turn instead of black) is blocked
    with pytest.raises(Exception):
        board.parse_san("e5")


# ─── 2. AI EVALUATION & MOVES SELECTION TESTS ────────────────────────────────

def test_ai_routing_engine():
    """
    Verifies that various AI difficulties route valid moves successfully.
    """
    board = chess.Board()
    engine = ChessAIEngine()
    
    # Test Easy AI move routing
    easy_move = engine.find_best_move(board, "easy")
    assert easy_move is not None
    assert easy_move in board.legal_moves

    # Test Medium AI move routing (Depth 2 Minimax)
    medium_move = engine.find_best_move(board, "medium")
    assert medium_move is not None
    assert medium_move in board.legal_moves

    # Test Board state positional assessment evaluation
    start_eval = evaluate_board(board)
    assert start_eval == 0  # Black and White are perfectly balanced initially


# ─── 3. SECURE INPUT VALIDATION TESTS (FEN & PGN SPEC) ──────────────────────

def test_fen_validation_safety():
    """
    Tests checking standard board configuration inputs and rejecting malformed structures.
    """
    valid_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    assert SecurityEnforcer.validate_fen(valid_fen) is True

    # Bad fen structures
    malformed_fen_1 = "not-a-fen"
    malformed_fen_2 = "rnbqkbnr/pppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0"
    assert SecurityEnforcer.validate_fen(malformed_fen_1) is False
    assert SecurityEnforcer.validate_fen(malformed_fen_2) is False


def test_username_validation():
    """
    Checks safe profile username boundaries.
    """
    assert SecurityEnforcer.validate_username("BobbyFischer") is True
    assert SecurityEnforcer.validate_username("Magnus_123") is True
    assert SecurityEnforcer.validate_username("admin; DROP TABLE users;") is False  # SQL injection test
    assert SecurityEnforcer.validate_username("gm*") is False  # dangerous spec chars


# ─── 4. PATH TRAVERSAL SECURITY ATTACK DEFENSE TESTS ────────────────────────

def test_path_traversal_blocking():
    """
    Tests security defenses preventing directory escape tricks such as file names like "../../etc/passwd".
    """
    base_sandbox = Path("/tmp/app_saved_games")
    # Simulate attempt to overwrite system files or access root folder
    traversal_input = "../../../etc/passwd"
    
    with pytest.raises(ValueError):
        # ValueError raised because extension validation blocks missing .pgn/.fen
        SecurityEnforcer.get_safe_filepath(base_sandbox, traversal_input)

    traversal_input_valid_ext = "../../../etc/shadow.pgn"
    with pytest.raises(PermissionError):
        # Blocks path traversal since resolved path escapes the standard base directory
        SecurityEnforcer.get_safe_filepath(base_sandbox, traversal_input_valid_ext)


# ─── 5. SECURITY HARDENED DATABASE SQL INJECTION CORES ──────────────────────

def test_secure_sqlite_parameter_transactions(tmp_path):
    """
    Tests database initialization, updates, and validates parameterized query boundaries.
    """
    test_db_path = tmp_path / "test_chess.db"
    db = DatabaseManager(db_path=str(test_db_path))
    
    # Check default user creation profile
    profile = db.get_user("Grandmaster")
    assert profile is not None
    assert profile["rating"] == 1500

    # SQL Injection Simulation attempt: Try to inject drops inside username queries
    db.initialize_tables()
    attacker_name = "gm'; DROP TABLE games; --"
    user = db.get_user(attacker_name)
    assert user is None  # Safe: returns None elegantly, queries don't crash nor execute drops


# ─── 6. RESOURCE EXHAUSTION RATE LIMITER TESTS ──────────────────────────────

def test_token_bucket_limitations():
    """
    Validate that TokenBucketRateLimiter correctly throttles high-capacity requests.
    """
    limiter = TokenBucketRateLimiter(capacity=3, fill_rate=0) # no regeneration for testing
    
    assert limiter.allow_request() is True
    assert limiter.allow_request() is True
    assert limiter.allow_request() is True
    assert limiter.allow_request() is False # fully drained
