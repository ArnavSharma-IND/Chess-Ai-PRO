"""
ChessAI Pro - Pygame Chess Board Render Canvas
Safely draws pieces, highlighted legal paths, and coordinate guidelines.
"""

import pygame
import chess
from typing import Tuple, Optional, List
from ..utils.constants import SQUARE_SIZE, THEMES

class GameBoardRenderer:
    def __init__(self, size: int = 560):
        self.size = size
        self.sq_size = size // 8
        self.selected_square: Optional[chess.Square] = None
        self.possible_moves: List[chess.Square] = []

    def draw_board(self, surface: pygame.Surface, theme_name: str) -> None:
        """
        Draws 8x8 alternating grid rows based on visual selection theme preset.
        """
        theme = THEMES.get(theme_name, THEMES['classic'])
        for r in range(8):
            for c in range(8):
                # Calculate color
                color = theme['light'] if (r + c) % 2 == 0 else theme['dark']
                rect = pygame.Rect(c * self.sq_size, r * self.sq_size, self.sq_size, self.sq_size)
                pygame.draw.rect(surface, color, rect)

    def draw_highlights(self, surface: pygame.Surface, board: chess.Board, theme_name: str) -> None:
        """
        Highlights checked kings and clicked pieces with soft alpha transparency boxes.
        """
        theme = THEMES.get(theme_name, THEMES['classic'])
        
        # 1. Selection Highlight
        if self.selected_square is not None:
            col = chess.square_file(self.selected_square)
            row = 7 - chess.square_rank(self.selected_square) # flip vertical for pygame coords
            sel_surface = pygame.Surface((self.sq_size, self.sq_size), pygame.SRCALPHA)
            sel_surface.fill((59, 130, 246, 120))  # Slate blue transparent
            surface.blit(sel_surface, (col * self.sq_size, row * self.sq_size))

        # 2. Check King danger alert
        if board.is_check():
            king_sq = board.king(board.turn)
            if king_sq is not None:
                col = chess.square_file(king_sq)
                row = 7 - chess.square_rank(king_sq)
                check_surface = pygame.Surface((self.sq_size, self.sq_size), pygame.SRCALPHA)
                check_surface.fill((239, 68, 68, 140))  # red alert transparent
                surface.blit(check_surface, (col * self.sq_size, row * self.sq_size))

        # 3. Possible legal move destination dot indicators
        for target in self.possible_moves:
            col = chess.square_file(target)
            row = 7 - chess.square_rank(target)
            
            # Indicator circular dot
            center_x = col * self.sq_size + self.sq_size // 2
            center_y = row * self.sq_size + self.sq_size // 2
            
            dot_surface = pygame.Surface((self.sq_size, self.sq_size), pygame.SRCALPHA)
            if board.piece_at(target):
                # Target capture bracket ring
                pygame.draw.circle(dot_surface, (16, 185, 129, 140), (self.sq_size // 2, self.sq_size // 2), self.sq_size // 2.5, 4)
            else:
                # normal dot
                pygame.draw.circle(dot_surface, (16, 185, 129, 180), (self.sq_size // 2, self.sq_size // 2), 8)
            surface.blit(dot_surface, (col * self.sq_size, row * self.sq_size))

    def draw_pieces(self, surface: pygame.Surface, board: chess.Board, font: pygame.font.Font) -> None:
        """
        Draws dynamic chess pieces. Falls back gracefully to typography shapes if image assets are empty.
        """
        for square in chess.SQUARES:
            piece = board.piece_at(square)
            if piece is not None:
                symbol = piece.symbol()
                col = chess.square_file(square)
                row = 7 - chess.square_rank(square)
                
                # Center coordinates
                x = col * self.sq_size + self.sq_size // 2
                y = row * self.sq_size + self.sq_size // 2
                
                # Check piece style colors
                is_white = piece.color == chess.WHITE
                color = (255, 255, 255) if is_white else (30, 41, 59)
                border_color = (15, 23, 42) if is_white else (203, 213, 225)
                
                # Draw elegant background token circle shape
                pygame.draw.circle(surface, color, (x, y), self.sq_size // 2.5)
                pygame.draw.circle(surface, border_color, (x, y), self.sq_size // 2.5, 2)
                
                # Letter representation
                text_char = symbol.upper()
                text_color = (15, 23, 42) if is_white else (248, 250, 252)
                
                char_surf = font.render(text_char, True, text_color)
                char_rect = char_surf.get_rect(center=(x, y))
                surface.blit(char_surf, char_rect)

    def select_square(self, col: int, row: int, board: chess.Board) -> Optional[chess.Square]:
        """
        Resolves mouse click coordinates to valid square indices.
        """
        file_idx = col
        rank_idx = 7 - row
        
        if 0 <= file_idx < 8 and 0 <= rank_idx < 8:
            return chess.square(file_idx, rank_idx)
        return None
