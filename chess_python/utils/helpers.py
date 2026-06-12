"""
ChessAI Pro - Generic helper collections and configurations
Tracks schema buffers, file safety limits, and generic transformations.
"""

from dataclasses import dataclass, asdict
from typing import Dict, Any

# Safe upper limit file sizes: max 10MB
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

@dataclass
class MatchStats:
    wins: int = 0
    losses: int = 0
    draws: int = 0
    games_played: int = 0
    rating: int = 1500

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def check_file_size_safe(filepath_str: str) -> bool:
    """
    Checks that the file exists and is within secure processing limits (prevents DoS/resource abuse).
    """
    import os
    try:
        path = os.path.abspath(filepath_str)
        if not os.path.exists(path):
            return False
        stat = os.stat(path)
        return stat.st_size <= MAX_FILE_SIZE_BYTES
    except Exception:
        return False
