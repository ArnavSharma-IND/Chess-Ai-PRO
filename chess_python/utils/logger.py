"""
ChessAI Pro - Structured, Secure Logging Utility
Protects sensitive configuration states while retaining solid audit logs.
"""

import os
import logging
from logging.handlers import RotatingFileHandler

# Ensure log path directory exists securely
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs')
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE_PATH = os.path.join(LOG_DIR, 'app.log')

# Predefined blocklist patterns to omit from log outputs to avoid leakage
BLOCKLIST_WORDS = {'key', 'token', 'secret', 'password', 'auth', 'database_url'}

class SafeLogFilter(logging.Filter):
    """
    Filter to scan messages and sanitize any unintended sensitive substrings.
    """
    def filter(self, record: logging.LogRecord) -> bool:
        msg = str(record.msg).lower()
        for word in BLOCKLIST_WORDS:
            if word in msg:
                record.msg = f"[SANitized] Message contained sensitive term: '{word}'"
        return True

def get_logger(name: str = 'ChessAIPro') -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        
        # Safe rotating file fallback
        file_handler = RotatingFileHandler(
            LOG_FILE_PATH,
            maxBytes=2 * 1024 * 1024,  # 2MB cap
            backupCount=3,
            encoding='utf-8'
        )
        file_handler.setLevel(logging.INFO)
        
        # Console output streams
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.WARNING)
        
        # Formatting
        log_format = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        file_handler.setFormatter(log_format)
        console_handler.setFormatter(log_format)
        
        # Filters
        safe_filter = SafeLogFilter()
        file_handler.addFilter(safe_filter)
        console_handler.addFilter(safe_filter)
        
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
        
    return logger
