"""
ChessAI Pro - UCI Stockfish Engine Bridge
Connects to Stockfish executables if present; falls back cleanly to minimax on failure.
"""

import chess
import chess.engine
import os
from typing import Optional
from ..utils.logger import get_logger

logger = get_logger("StockfishBridge")

class StockfishEngineWrapper:
    def __init__(self, stockfish_path: Optional[str] = None):
        self.stockfish_path = stockfish_path or os.getenv("STOCKFISH_PATH")
        self.engine: Optional[chess.engine.SimpleEngine] = None
        self.initialize_engine()

    def initialize_engine(self) -> None:
        if not self.stockfish_path or not os.path.exists(self.stockfish_path):
            logger.warning("Stockfish path unconfigured or invalid. Bridge offline.")
            return

        try:
            # Secure subprocess init with simple limit parameters
            self.engine = chess.engine.SimpleEngine.popen_uci(self.stockfish_path)
            logger.info("Stockfish UCI subprocess started successfully!")
        except Exception as e:
            logger.error(f"Failed to load Stockfish engine binary: {e}", exc_info=True)
            self.engine = None

    def get_best_move(self, board: chess.Board, limit_sec: float = 2.0) -> Optional[chess.Move]:
        if not self.engine:
            return None
        
        try:
            result = self.engine.play(board, chess.engine.Limit(time=limit_sec))
            return result.move
        except Exception as e:
            logger.error(f"Stockfish query failed: {e}", exc_info=True)
            return None

    def close(self) -> None:
        if self.engine:
            try:
                self.engine.quit()
                logger.info("Stockfish subprocess stopped cleanly.")
            except Exception:
                pass
