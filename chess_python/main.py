"""
ChessAI Pro - Core Python Entry point
Loads secure configs, runs main event dispatcher, and runs Pygame context frames.
"""

import sys
import os
import pygame
from dotenv import load_dotenv

# Set Python path to look inside root so imports work perfectly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from chess_python.utils.logger import get_logger
from chess_python.utils.constants import SCREEN_WIDTH, SCREEN_HEIGHT
from chess_python.database.db import DatabaseManager
from chess_python.gui.menu import GameMenu
from chess_python.gui.game import ChessGameController
from chess_python.gui.settings import UserSettings

# Load secure env parameters
load_dotenv()

logger = get_logger("Main")

class ChessApplication:
    def __init__(self):
        pygame.init()
        pygame.display.set_caption("ChessAI Pro - Offline Intelligence sandbox")
        
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        self.clock = pygame.time.Clock()
        self.is_running = True
        
        # Load fonts safely with fallback structures
        self.font_title = pygame.font.SysFont("comicsansms" if sys.platform == "win32" else "sans", 44, bold=True)
        self.font_btn = pygame.font.SysFont("arial", 18, bold=True)
        self.font_small = pygame.font.SysFont("courier", 14, bold=True)
        
        # Database setup
        database_file = os.getenv("DATABASE_PATH", "database/chess.db")
        self.db = DatabaseManager(db_path=database_file)
        
        # Settings state
        self.settings = UserSettings()
        
        # View status: 'menu' or 'playing'
        self.view_state = "menu"
        self.active_match: Optional[ChessGameController] = None
        
        # Instantiates static menus
        self.menu = GameMenu(
            SCREEN_WIDTH,
            SCREEN_HEIGHT,
            on_start_match=self.start_new_match,
            on_exit=self.terminate_app
        )

    def start_new_match(self, mode: str) -> None:
        """
        Switches screen view to playing and bootstraps matching game layouts.
        """
        logger.info(f"Bootstrapping match combat mode: {mode}")
        self.active_match = ChessGameController(
            self.screen,
            mode,
            self.settings,
            self.db,
            on_back_to_menu=self.return_to_menu
        )
        self.view_state = "playing"

    def return_to_menu(self) -> None:
        self.view_state = "menu"
        self.active_match = None
        logger.info("Returned back to main menu dashboard.")

    def terminate_app(self) -> None:
        self.is_running = False
        logger.info("ChessAI Pro closing safely. Goodbye.")

    def run_loop(self) -> None:
        while self.is_running:
            # Handle event dispatching
            events = pygame.event.get()
            for event in events:
                if event.type == pygame.QUIT:
                    self.terminate_app()
                
                # Forward to matching screen view
                if self.view_state == "menu":
                    self.menu.handle_event(event)
                elif self.view_state == "playing" and self.active_match:
                    if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                        self.active_match.handle_click(event.pos)
                    elif event.type == pygame.KEYDOWN:
                        self.active_match.handle_keypress(event.key)

            # Frame updates
            if self.view_state == "playing" and self.active_match:
                self.active_match.update()

            # Layout draws
            if self.view_state == "menu":
                self.menu.draw(self.screen, self.font_title, self.font_btn)
            elif self.view_state == "playing" and self.active_match:
                self.active_match.draw(self.font_title, self.font_small)

            pygame.display.flip()
            self.clock.tick(60)  # lock frame counts to 60fps for battery efficiency

        pygame.quit()
        sys.exit(0)


if __name__ == "__main__":
    try:
        app = ChessApplication()
        app.run_loop()
    except Exception as e:
        logger.fatal(f"Uncaught critical application failure: {e}", exc_info=True)
        sys.exit(1)
