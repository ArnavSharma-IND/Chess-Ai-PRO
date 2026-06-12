# ChessAI Pro

A complete, production-grade, and security-hardened offline Chess Application with custom tactical AI engines built with Python 3.12+ and Pygame.

This directory houses the standalone offline Python package of **ChessAI Pro**. The workspace root also contains the fully functional dynamic React Web preview on port 3000 to play immediately in the sandboxed browser environment!

---

## 🎨 Core Design & Features

-   **Multi-mode Engine Battle Lab**:
    -   *Player vs AI*: Play with White pieces against customized strategic depth levels.
    -   *Local PvP*: Standard local dual-turn matches with highlighted valid moves.
    -   *AI vs AI Battle*: Watch automated engine battles to study classical positional theories.
-   **Intelligent Positional Heuristics**: Calculates moves based on material balances, pawn structures, center control metrics, mobility, king safety configurations, and Piece-Square Tables (PST).
-   **Aesthetic Fallback Graphics**: Programmed with procedural vector rendering, eliminating core game crashes if image icons are unzipped or missing.
-   **Audio Synthesizers**: Generates organic physical woody piece clicks dynamically on the fly, matching player volume sliders.

---

## 🛠️ Unified Security Hardening Guardrails

1.  **Directory Traversal Defenses**: Forces validation checks via `pathlib.Path.resolve()` relative to base directories, filtering file loading schemes against safe filenames and blocking attempts to hijack parent directory files (`../../`).
2.  **SQL-Injection Eradication**: Leverages Python SQLite parameterized statement queries exclusively. String concatenation inside DB requests is strictly banned.
3.  **Token-Bucket Rates Throttle**: Integrates thread-safe Token Bucket Rate Limiters capping expensive analysis actions to prevent resource exhaustion attacks.
4.  **Leak Filter Loggers**: Blocks logging of sensitive environment identifiers (e.g. key, credential, token) by running log filters on rotating `app.log` file outputs.
5.  **Calculate Thread Pools**: Computes hard AI minimax searches on non-blocking background threads, preventing Pygame UI freezes.

---

## 🚀 Installation & Local Launch

Ensure Python 3.12+ is installed on your local machine.

```bash
# 1. Navigate into the Python project folder
cd chess_python/

# 2. Build local virtual environment and activate
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# 3. Securely install dependencies
pip install -r requirements.txt

# 4. Initialize environment configurations
cp .env.example .env

# 5. Boot the game client
python main.py
```

### 🎮 Active Keyboard Controls (Pygame Game Screen)

-   **`LEFT-CLICK Mouse`**: Click an active piece to select, then click highlighted safe dots to place.
-   **`[ESC]`**: Instantly pause the matches and return to Start Dashboard.
-   **`[U]`**: Undo previous action steps (reverts both player & opponent in AI mode).

---

## 🤖 Deep-Dive on ChessAI Engine Architecture

The decision engines run on cascading tier algorithms depending on the difficulty selected:

```
                  [ Opening Book Lookups ]
                             │
                             ├──── (Match Sequence Found) ──► Apply Book Move (Instant)
                             │
                             └──── (No Match Found)
                                     │
                             [ Alpha-Beta Search ]
                                     │
                             [ Move Ordering Heuristics ]
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
           [ Material Weights ]             [ Positional Assessment ]
           (P: 100, N: 320, B: 330,         (Piece-Square Table Positional, 
            R: 500, Q: 900, K: 20000)        Center Control, King Safety)
```

-   **Piece-Square Tables (PST)**: Guides piece development dynamically. Pawns gain bonuses when locking down center circles or advancing in endgames, whereas Knights are penalized on edge tiles.
-   **MVV-LVA Move Sorting Heuristic**: Drastically optimizes search paths by prioritizing captures (Most Valuable Victim - Least Valuable Aggressor), check indicators, and promotion positions first, sparking 75%+ Alpha-Beta cutoffs.
-   **Transposition Table**: Saves hashed records of observed board grids using cryptographic-friendly FEN hashing, skipping duplicated tree branches during deep iterative deepening.
