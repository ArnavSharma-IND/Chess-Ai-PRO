"""
ChessAI Pro - Pygame Menu Screens
Renders start selectors and button states.
"""

import pygame
from typing import List, Tuple, Callable

class PygameButton:
    def __init__(self, rect: Tuple[int, int, int, int], text: str, callback: Callable, color: Tuple[int,int,int] = (30, 41, 59)):
        self.rect = pygame.Rect(rect)
        self.text = text
        self.callback = callback
        self.color = color
        self.is_hovered = False

    def check_hover(self, mouse_pos: Tuple[int, int]) -> None:
        self.is_hovered = self.rect.collidepoint(mouse_pos)

    def draw(self, surface: pygame.Surface, font: pygame.font.Font) -> None:
        # Hover effect highlighting
        draw_color = (59, 130, 246) if self.is_hovered else self.color
        
        # Border round box
        pygame.draw.rect(surface, draw_color, self.rect, border_radius=8)
        pygame.draw.rect(surface, (71, 85, 105), self.rect, width=1, border_radius=8)
        
        # Text alignment
        text_surf = font.render(self.text, True, (248, 250, 252))
        text_rect = text_surf.get_rect(center=self.rect.center)
        surface.blit(text_surf, text_rect)

    def click(self) -> None:
        self.callback()


class GameMenu:
    def __init__(self, width: int, height: int, on_start_match: Callable, on_exit: Callable):
        self.width = width
        self.height = height
        self.on_start_match = on_start_match
        self.on_exit = on_exit
        self.buttons: List[PygameButton] = []
        self.initialize_buttons()

    def initialize_buttons(self) -> None:
        btn_width = 240
        btn_height = 50
        start_x = (self.width - btn_width) // 2
        
        self.buttons = [
            PygameButton(
                (start_x, 240, btn_width, btn_height),
                "Player vs AI Engine",
                lambda: self.on_start_match("human-ai")
            ),
            PygameButton(
                (start_x, 310, btn_width, btn_height),
                "Local PvP Multiplayer",
                lambda: self.on_start_match("human-human")
            ),
            PygameButton(
                (start_x, 380, btn_width, btn_height),
                "AI vs AI Battle",
                lambda: self.on_start_match("ai-ai")
            ),
            PygameButton(
                (start_x, 450, btn_width, btn_height),
                "Exit Program",
                self.on_exit,
                (225, 29, 72)
            )
        ]

    def draw(self, surface: pygame.Surface, font_title: pygame.font.Font, font_button: pygame.font.Font) -> None:
        surface.fill((15, 23, 42))  # slate 900
        
        # Render title accent
        title_surf = font_title.render("ChessAI Pro", True, (248, 250, 252))
        title_rect = title_surf.get_rect(center=(self.width // 2, 100))
        surface.blit(title_surf, title_rect)

        sub_surf = font_button.render("Local Chess Laboratory & Engine Sandbox", True, (148, 163, 184))
        sub_rect = sub_surf.get_rect(center=(self.width // 2, 160))
        surface.blit(sub_surf, sub_rect)

        # Draw buttons
        for btn in self.buttons:
            btn.draw(surface, font_button)

    def handle_event(self, event: pygame.event.Event) -> None:
        if event.type == pygame.MOUSEMOTION:
            for btn in self.buttons:
                btn.check_hover(event.pos)
        elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            for btn in self.buttons:
                if btn.is_hovered:
                    btn.click()
