"""
ChessAI Pro - Simple local configuration mapping
Holds settings, validation ranges, and presets.
"""

from typing import Dict, Any
from ..utils.security import SecurityEnforcer

class UserSettings:
    def __init__(self):
        self.difficulty: str = "medium"
        self.theme: str = "classic"
        self.volume: int = 70
        self.ai_think_time: float = 3.0
        self.player_name: str = "Grandmaster"

    def update(self, key: str, value: Any) -> None:
        if key == "difficulty" and value in ("easy", "medium", "hard"):
            self.difficulty = value
        elif key == "theme" and value in ("classic", "dark", "blue", "wooden"):
            self.theme = value
        elif key == "volume":
            vol = int(value)
            SecurityEnforcer.validate_ai_parameters(5, 3.0, vol)
            self.volume = vol
        elif key == "ai_think_time":
            time_val = float(value)
            SecurityEnforcer.validate_ai_parameters(5, time_val, 50)
            self.ai_think_time = time_val
        elif key == "player_name":
            name_str = str(value).strip()
            if SecurityEnforcer.validate_username(name_str):
                self.player_name = name_str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "difficulty": self.difficulty,
            "theme": self.theme,
            "volume": self.volume,
            "ai_think_time": self.ai_think_time,
            "player_name": self.player_name,
        }
