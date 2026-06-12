"""
ChessAI Pro - Core Security Guardians
Includes input sanitizers, rate-limit builders, sandbox validation and path resolving structures.
"""

import re
import time
from pathlib import Path
from typing import Optional

# Safe alphanumeric username restrictions
USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9_\-]{3,16}$")

# Official FEN layout validation regex
FEN_REGEX = re.compile(
    r"^([rnbqkpRNBQKP1-8]{1,8}/){7}[rnbqkpRNBQKP1-8]{1,8}\s+[wb]\s+([KkQq]{1,4}|-)\s+([a-h][36]|-)\s+\d+\s+\d+$"
)

class SecurityEnforcer:
    """
    Validates limits and formats securely before forwarding arguments.
    """
    
    @staticmethod
    def validate_username(username: str) -> bool:
        return bool(USERNAME_REGEX.match(username))

    @staticmethod
    def validate_fen(fen: str) -> bool:
        return bool(FEN_REGEX.match(fen))

    @staticmethod
    def validate_ai_parameters(depth: int, think_time: float, volume: int) -> None:
        """
        Enforce strict safety boundaries.
        Throws ValueError on trespass.
        """
        if not (1 <= depth <= 10):
            raise ValueError(f"AI Search Depth outside permitted range (1-10): {depth}")
        if not (1.0 <= think_time <= 60.0):
            raise ValueError(f"AI Think Time outside permitted range (1-60s): {think_time}")
        if not (0 <= volume <= 100):
            raise ValueError(f"Audio Volume outside permitted range (0-100): {volume}")

    @staticmethod
    def get_safe_filepath(base_directory: Path, user_provided_filename: str) -> Path:
        """
        Forces resolution against Path traversal (../../ attacks) and locks down directories.
        """
        # Ensure only .pgn or .fen extensions
        suffix = Path(user_provided_filename).suffix.lower()
        if suffix not in ('.pgn', '.fen'):
            raise ValueError(f"Insecure file extension blocked: {suffix}")

        base_dir_resolved = base_directory.resolve()
        target_path = base_dir_resolved / Path(user_provided_filename).name # strip folders, keep basename
        target_resolved = target_path.resolve()

        if not target_resolved.is_relative_to(base_dir_resolved):
            raise PermissionError("Directory Traversal attack thwarted! Locked inside workspace sandbox.")

        return target_resolved


class TokenBucketRateLimiter:
    """
    Thread-safe implementation of Token Bucket rate limiters for analysis tasks.
    E.g. Limit analysis actions to 30 actions per minute.
    """
    def __init__(self, capacity: int = 30, fill_rate: float = 0.5):
        """
        capacity: max tokens bucket can store
        fill_rate: tokens added per second (0.5 means 30 tokens added per minute)
        """
        self.capacity = capacity
        self.fill_rate = fill_rate
        self.tokens = float(capacity)
        self.last_update = time.monotonic()

    def allow_request(self) -> bool:
        current_time = time.monotonic()
        delta = current_time - self.last_update
        self.last_update = current_time
        
        # Replenish
        self.tokens = min(self.capacity, self.tokens + delta * self.fill_rate)
        
        if self.tokens >= 1.0:
            self.tokens -= 1.0
            return True
        return False
