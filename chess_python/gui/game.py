"""
ChessAI Pro - Active Pygame Battle Control Loop
Configures background calculation threads for the AI engine, database logging, and settings syncing.
"""

import pygame
import chess
import threading
import queue
import time
from datetime import datetime
from typing import Callable, Optional
from ..engine.ai import ChessAIEngine
from ..utils.logger import get_logger
from ..utils.security import SecurityEnforcer
from ..database.db import DatabaseManager
from ..utils.constants import SIDEBAR_WIDTH, SCREEN_HEIGHT, BOARD_SIZE
from .board import GameBoardRenderer
from .settings import UserSettings

logger = get_logger("GameController")

class ChessGameController:
    def __init__(self, screen: pygame.Surface, mode: str, settings: UserSettings, db: DatabaseManager, on_back_to_menu: Callable):
        self.screen = screen
        self.mode = mode
        self.settings = settings
        self.db = db
        self.on_back_to_menu = on_back_to_menu
        
        self.board = chess.Board()
        self.renderer = GameBoardRenderer()
        self.ai = ChessAIEngine()
        
        self.is_running = True
        self.start_time = time.time()
        self.ai_queue: queue.Queue = queue.Queue()
        self.is_ai_calculating = False
        self.history_sans = []
        
        # Audio mixer init
        pygame.mixer.init()

    def play_sound(self, sound_type: str) -> None:
        """
        Play custom procedural click sounds securely based on user volume.
        """
        if self.settings.volume == 0:
            return
        
        # Emit a clean procedural wave sound if assets are absent
        try:
            chan = pygame.mixer.find_channel()
            if chan:
                # Basic synthetic click
                import numpy as np
                sample_rate = 22050
                duration = 0.08
                freq = 200 if sound_type == "move" else 400
                t = np.linspace(0, duration, int(sample_rate * duration), False)
                wave = np.sin(2 * np.pi * freq * t) * (self.settings.volume / 100.0) * 32767
                wave = wave.astype(np.int16)
                sound = pygame.mixer.Sound(buffer=wave)
                chan.play(sound)
        except Exception as e:
            logger.warning(f"Audio synthetic clip generation bypass: {e}")

    def trigger_background_ai_move(self) -> None:
        """
        Dispatches AI minimax calculations to a separate background thread.
        This completely prevents Pygame GUI freezing during deep hard searches.
        """
        if self.is_ai_calculating:
            return
            
        self.is_ai_calculating = True
        thread = threading.Thread(
            target=self._async_compute_move,
            args=(self.board.copy(), self.settings.difficulty, self.settings.ai_think_time),
            daemon=True
        )
        thread.start()

    def _async_compute_move(self, board_state: chess.Board, diff: str, think_time: float) -> None:
        try:
            best_move = self.ai.find_best_move(board_state, diff, think_time)
            self.ai_queue.put(best_move)
        except Exception as e:
            logger.error(f"Error under background AI thread calculation: {e}", exc_info=True)
            self.ai_queue.put(None)

    def update(self) -> None:
        """
        Inspect thread queues and update layout parameters.
        """
        # Read from background thread results queue
        if not self.ai_queue.empty():
            best_move = self.ai_queue.get()
            self.is_ai_calculating = False
            
            if best_move and best_move in self.board.legal_moves:
                san_symbol = self.board.san(best_move)
                self.history_sans.append(san_symbol)
                
                is_capture = self.board.is_capture(best_move)
                self.board.push(best_move)
                
                if self.board.is_game_over():
                    self.play_sound("checkmate")
                    self.log_finished_game()
                else:
                    self.play_sound("capture" if is_capture else "move")
                    
        # Multi AI auto battle automation
        if self.mode == "ai-ai" and not self.is_ai_calculating and not self.board.is_game_over():
            self.trigger_background_ai_move()

    def draw(self, font_large: pygame.font.Font, font_small: pygame.font.Font) -> None:
        """
        Clear page, draw 8x8 squares, render fallback pieces, and sidebar state widgets.
        """
        self.screen.fill((15, 23, 42))  # Slate 900
        
        # 1. Draw chessboard
        self.renderer.draw_board(self.screen, self.settings.theme)
        self.renderer.draw_highlights(self.screen, self.board, self.settings.theme)
        self.renderer.draw_pieces(self.screen, self.board, font_large)
        
        # 2. Draw Side Panel Details Controls
        panel_rect = pygame.Rect(BOARD_SIZE, 0, SIDEBAR_WIDTH, SCREEN_HEIGHT)
        pygame.draw.rect(self.screen, (30, 41, 59), panel_rect)  # slate 800
        pygame.draw.line(self.screen, (71, 85, 105), (BOARD_SIZE, 0), (BOARD_SIZE, SCREEN_HEIGHT), 1)

        # Draw Labels
        mode_label = font_small.render(f"Combat Mode: {self.mode.upper()}", True, (241, 245, 249))
        self.screen.blit(mode_label, (BOARD_SIZE + 20, 20))

        diff_label = font_small.render(f"AI Difficulty: {self.settings.difficulty.upper()}", True, (148, 163, 184))
        self.screen.blit(diff_label, (BOARD_SIZE + 20, 50))

        turn_text = "White turn" if self.board.turn == chess.WHITE else "Black turn"
        turn_label = font_small.render(f"Active Turn: {turn_text}", True, (59, 130, 246))
        self.screen.blit(turn_label, (BOARD_SIZE + 20, 80))

        # Show game stats ELO if user is logged in
        player_dict = self.db.get_user(self.settings.player_name)
        if player_dict:
            elo_label = font_small.render(f"Player ELO Rating: {player_dict['rating']}", True, (16, 185, 129))
            self.screen.blit(elo_label, (BOARD_SIZE + 20, 120))

        # Show move list snippet
        move_header = font_small.render("Move History List:", True, (241, 245, 249))
        self.screen.blit(move_header, (BOARD_SIZE + 20, 200))
        
        move_snippet = " ... ".join(self.history_sans[-4:])
        if not move_snippet:
            move_snippet = "No moves logged"
        snippet_label = font_small.render(move_snippet, True, (148, 163, 184))
        self.screen.blit(snippet_label, (BOARD_SIZE + 20, 235))

        # Controls reference instructions
        esc_label = font_small.render("[ESC] Back to main menu", True, (244, 63, 94))
        self.screen.blit(esc_label, (BOARD_SIZE + 20, SCREEN_HEIGHT - 60))

        undo_label = font_small.render("[U] Undo previous move", True, (251, 191, 36))
        self.screen.blit(undo_label, (BOARD_SIZE + 20, SCREEN_HEIGHT - 30))

        # If thinking overlay spinner text
        if self.is_ai_calculating:
            think_label = font_small.render("Engine pondering optimal trajectory...", True, (251, 146, 60))
            self.screen.blit(think_label, (BOARD_SIZE + 20, 160))

    def handle_click(self, pos: Tuple[int, int]) -> None:
        """
        Processes human clicks on chessboard cells, highlights paths, and pushes move inputs.
        """
        if self.is_ai_calculating or self.board.is_game_over():
            return
        if self.mode == "ai-ai":
            return

        # Restrict board square hits
        if pos[0] >= BOARD_SIZE or pos[1] >= BOARD_SIZE:
            return

        col = pos[0] // SQUARE_SIZE
        row = pos[1] // SQUARE_SIZE
        
        clicked_square = self.renderer.select_square(col, row, self.board)
        if clicked_square is None:
            return

        # Attempt to play movement
        if clicked_square in self.renderer.possible_moves and self.renderer.selected_square is not None:
            move = chess.Move(self.renderer.selected_square, clicked_square)
            
            # Pawn Promotion automatically promotes to standard Queen for Pygame simplification
            if self.board.piece_type_at(self.renderer.selected_square) == chess.PAWN:
                if chess.square_rank(clicked_square) in (0, 7):
                    move.promotion = chess.QUEEN

            san_symbol = self.board.san(move)
            self.history_sans.append(san_symbol)
            
            is_capture = self.board.is_capture(move)
            self.board.push(move)
            
            # Refresh
            self.renderer.selected_square = None
            self.renderer.possible_moves = []
            self.play_sound("capture" if is_capture else "move")

            if self.board.is_game_over():
                self.log_finished_game()
                return

            # Trigger AI response immediately under Player Mode
            if self.mode == "human-ai" and not self.board.is_game_over():
                self.trigger_background_ai_move()
                
            return

        # Select piece setup
        piece = self.board.piece_at(clicked_square)
        if piece is not None and piece.color == self.board.turn:
            # Human AI limits
            if self.mode == "human-ai" and piece.color == chess.BLACK:
                return
            self.renderer.selected_square = clicked_square
            self.renderer.possible_moves = list(self.board.generate_legal_moves(from_mask=chess.BB_SQUARES[clicked_square]))
        else:
            self.renderer.selected_square = None
            self.renderer.possible_moves = []

    def handle_keypress(self, key: int) -> None:
        if key == pygame.K_ESCAPE:
            self.is_running = False
            self.on_back_to_menu()
        elif key == pygame.K_u and not self.is_ai_calculating:
            # Undo move
            if len(self.board.move_stack) > 0:
                self.board.pop()
                if self.mode == "human-ai" and len(self.board.move_stack) > 0:
                    self.board.pop()  # also pop user's original move
                self.renderer.selected_square = None
                self.renderer.possible_moves = []
                self.play_sound("move")

    def log_finished_game(self) -> None:
        """
        Record final results and stats inside SQLite database securely.
        """
        outcome = self.board.outcome()
        if not outcome:
            return

        result_txt = "Draw"
        rating_mod = 0
        user_outcome = "draw"

        if outcome.winner == chess.WHITE:
            result_txt = "White Wins"
            rating_mod = 15
            user_outcome = "win"
        elif outcome.winner == chess.BLACK:
            result_txt = "Black Wins"
            rating_mod = -15
            user_outcome = "loss"

        duration = int(time.time() - self.start_time)
        opening_label = "Open Games" if len(self.board.move_stack) > 0 else "N/A"
        
        # SQL transaction write
        self.db.log_game_history(
            datetime.now().strftime("%Y-%m-%d %H:%M"),
            result_txt,
            " ".join(self.history_sans),
            duration,
            opening_label
        )
        # Update ratings
        self.db.update_user_stats(self.settings.player_name, user_outcome, rating_mod)
        logger.info(f"Match log recorded. Decision: {result_txt}, Rating Diff: {rating_mod}")
