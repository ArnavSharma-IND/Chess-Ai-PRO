"""
ChessAI Pro - Secure Database Interface
Leverages parameterized queries and transactions to record ELO statistics and match logs into SQLite safely.
"""

import sqlite3
import os
from typing import List, Dict, Any, Optional
from ..utils.logger import get_logger

logger = get_logger("Database")

class DatabaseManager:
    def __init__(self, db_path: str = "database/chess.db"):
        self.db_path = db_path
        # Ensure database directory path exists securely
        db_dir = os.path.dirname(os.path.abspath(db_path))
        os.makedirs(db_dir, exist_ok=True)
        self.initialize_tables()

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        # Ensure rows are returned as dynamic dictionaries
        conn.row_factory = sqlite3.Row
        return conn

    def initialize_tables(self) -> None:
        """
        Creates Tables with strict schemas according to exact user instruction requirements.
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            with conn:
                # Users table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        username TEXT UNIQUE NOT NULL,
                        games_played INTEGER DEFAULT 0,
                        wins INTEGER DEFAULT 0,
                        losses INTEGER DEFAULT 0,
                        draws INTEGER DEFAULT 0,
                        rating INTEGER DEFAULT 1500
                    )
                """)
                # Games history logs table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS games (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        date TEXT NOT NULL,
                        result TEXT NOT NULL,
                        moves TEXT NOT NULL,
                        duration INTEGER DEFAULT 0,
                        opening TEXT
                    )
                """)
                
                # Check for default player (Grandmaster)
                cursor.execute("SELECT id FROM users WHERE username = ?", ("Grandmaster",))
                if not cursor.fetchone():
                    cursor.execute("""
                        INSERT INTO users (username, games_played, wins, losses, draws, rating)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, ("Grandmaster", 0, 0, 0, 0, 1500))
                    
            logger.info("Database tables initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to bootstrap database tables: {e}", exc_info=True)
            conn.rollback()
        finally:
            conn.close()

    def get_user(self, username: str) -> Optional[Dict[str, Any]]:
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
            row = cursor.fetchone()
            return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error fetching user profile for {username}: {e}", exc_info=True)
            return None
        finally:
            conn.close()

    def update_user_stats(self, username: str, outcome: str, rating_change: int) -> bool:
        """
        Integrates transactional thread-safe updates when logging wins or losses.
        outcome: 'win', 'loss', or 'draw'
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            with conn:
                # Fetch original stats
                cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
                user_row = cursor.fetchone()
                if not user_row:
                    return False
                
                games = user_row['games_played'] + 1
                wins = user_row['wins'] + (1 if outcome == 'win' else 0)
                losses = user_row['losses'] + (1 if outcome == 'loss' else 0)
                draws = user_row['draws'] + (1 if outcome == 'draw' else 0)
                new_rating = max(100, user_row['rating'] + rating_change)

                cursor.execute("""
                    UPDATE users
                    SET games_played = ?, wins = ?, losses = ?, draws = ?, rating = ?
                    WHERE username = ?
                """, (games, wins, losses, draws, new_rating, username))
            return True
        except Exception as e:
            logger.error(f"Failed to update database stats: {e}", exc_info=True)
            conn.rollback()
            return False
        finally:
            conn.close()

    def log_game_history(self, date_str: str, result: str, moves: str, duration_sec: int, opening: str) -> bool:
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            with conn:
                cursor.execute("""
                    INSERT INTO games (date, result, moves, duration, opening)
                    VALUES (?, ?, ?, ?, ?)
                """, (date_str, result, moves, duration_sec, opening))
            return True
        except Exception as e:
            logger.error(f"Error recording played match trace: {e}", exc_info=True)
            conn.rollback()
            return False
        finally:
            conn.close()

    def get_match_history(self, limit: int = 20) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT * FROM games ORDER BY id DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
        except Exception as e:
            logger.error(f"Error fetching historical logs list: {e}", exc_info=True)
            return []
        finally:
            conn.close()
