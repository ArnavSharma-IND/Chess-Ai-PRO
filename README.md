# ChessAI Pro ♟️🤖

> A secure, offline, production-grade AI Chess application built with Python, Pygame, and python-chess.

![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![Security](https://img.shields.io/badge/Security-OWASP%20Compliant-success.svg)
![Tests](https://img.shields.io/badge/Tests-Pytest-orange.svg)
![Coverage](https://img.shields.io/badge/Coverage-80%25+-brightgreen.svg)

---

## 🚀 Overview

**ChessAI Pro** is a modern desktop chess application inspired by Chess.com and Lichess while remaining fully **offline**, **open-source**, and **privacy-friendly**.

Play against intelligent AI opponents powered by **Minimax**, **Alpha-Beta Pruning**, and optional **Stockfish** integration.

Designed with security, scalability, and maintainability in mind.

---

## ✨ Features

### 🎮 Game Modes

* Human vs AI
* Human vs Human
* AI vs AI

### ♟ Chess Features

* Full FIDE chess rules
* Castling
* En passant
* Pawn promotion
* Check & checkmate detection
* Stalemate detection
* Threefold repetition
* Fifty-move rule
* Insufficient material detection

### 🧠 AI Engine

* Easy → Random moves
* Medium → Minimax (Depth 2–3)
* Hard → Advanced evaluation (Depth 4–6)
* Expert → Stockfish Engine

### 📊 Analysis

* Engine evaluation
* Best move suggestions
* Move history
* PGN export
* FEN export

### 💾 Save & Load

* Save games in PGN format
* Load previous games
* Export positions as FEN

### 🎨 GUI Features

* Drag & drop pieces
* Move highlighting
* Legal move indicators
* Captured pieces panel
* Current player indicator
* Check notifications
* Checkmate screen
* Multiple board themes

### 🔊 Sound Effects

* Move
* Capture
* Castling
* Promotion
* Check
* Checkmate

---

# 🔐 Security Features

ChessAI Pro is built following **OWASP Secure Coding Practices**.

### ✅ Input Validation

* PGN validation
* FEN validation
* Username sanitization
* Settings validation

### ✅ Secure File Handling

* Safe file paths using `pathlib`
* Protection against path traversal attacks
* File extension restrictions

Supported formats:

```text
.pgn
.fen
```

### ✅ Secure Database

* SQLite parameterized queries
* Transaction support
* Automatic rollback on failure

### ✅ Secrets Management

Configuration stored using:

```text
.env
```

No secrets are hardcoded into source code.

### ✅ Logging Security

* Rotating logs
* No sensitive information stored
* Error tracking enabled

### ✅ Thread Safety

* AI calculations run in background threads
* GUI remains responsive
* Shared-state protection using locks

---

# 🏗️ Project Structure

```text
chess_ai/
│
├── assets/
│   ├── pieces/
│   ├── sounds/
│   └── themes/
│
├── engine/
│   ├── ai.py
│   ├── evaluation.py
│   ├── minimax.py
│   ├── opening_book.py
│   └── stockfish_engine.py
│
├── gui/
│   ├── board.py
│   ├── game.py
│   ├── menu.py
│   └── settings.py
│
├── database/
│   └── db.py
│
├── utils/
│   ├── constants.py
│   ├── security.py
│   ├── logger.py
│   └── helpers.py
│
├── tests/
│
├── main.py
├── requirements.txt
├── README.md
├── .env.example
└── .gitignore
```

---

# 🧠 AI Architecture

## Search Algorithms

* Minimax Search
* Alpha-Beta Pruning
* Iterative Deepening
* Move Ordering
* Transposition Tables
* Zobrist Hashing

### Optional

* Monte Carlo Tree Search (MCTS)
* Neural Network Evaluation

---

# 📈 Evaluation Function

The AI evaluates positions using:

| Feature            | Weight |
| ------------------ | ------ |
| Material           | High   |
| Mobility           | Medium |
| King Safety        | High   |
| Pawn Structure     | Medium |
| Center Control     | Medium |
| Endgame Evaluation | High   |

### Piece Values

| Piece  | Value |
| ------ | ----: |
| Pawn   |   100 |
| Knight |   320 |
| Bishop |   330 |
| Rook   |   500 |
| Queen  |   900 |
| King   | 20000 |

---

# 📚 Opening Book

Supported openings:

* Sicilian Defense
* Italian Game
* Ruy Lopez
* Queen's Gambit
* King's Indian Defense

The AI follows opening theory during early moves.

---

# ♔ Endgame Support

Implemented endgames:

* King + Queen vs King
* King + Rook vs King
* Basic tablebase support

---

# 📊 Statistics Tracking

Stored using SQLite.

Tracked metrics:

* Wins
* Losses
* Draws
* Average Game Time
* Move Count
* Accuracy
* Player Rating

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/ChessAI-Pro.git
cd ChessAI-Pro
```

## Create Virtual Environment

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### Linux / macOS

```bash
python3 -m venv venv
source venv/bin/activate
```

## Install Dependencies

```bash
pip install -r requirements.txt
```

## Run Application

```bash
python main.py
```

---

# 📦 Requirements

```text
pygame
python-chess
numpy
python-dotenv
pytest
```

Optional:

```text
stockfish
torch
tensorflow
```

---

# 🔑 Environment Variables

Create a `.env` file:

```env
STOCKFISH_PATH=
DATABASE_PATH=database/chess.db
LOG_LEVEL=INFO
```

---

# 🧪 Running Tests

Run all tests:

```bash
pytest
```

Generate coverage report:

```bash
pytest --cov=.
```

Target Coverage:

```text
> 80%
```

---

# 🔍 Security Auditing

Install:

```bash
pip install pip-audit
```

Scan dependencies:

```bash
pip-audit
```

---

# 🎮 Controls

| Action     | Input       |
| ---------- | ----------- |
| Move Piece | Drag & Drop |
| Undo Move  | Ctrl + Z    |
| Restart    | R           |
| Save Game  | Ctrl + S    |
| Load Game  | Ctrl + O    |

---

# 🎨 Themes

Available themes:

* Classic
* Dark
* Blue
* Wooden

Custom themes can be added in:

```text
assets/themes/
```

---

# 📷 Screenshots

```text
Add screenshots here after implementation.
```

Example:

* Main Menu
* Gameplay Screen
* AI Analysis
* Statistics Dashboard

---

# 🛡 Security Checklist

* [x] No exposed secrets
* [x] Input validation implemented
* [x] Parameterized SQL queries
* [x] Safe file handling
* [x] Thread-safe AI engine
* [x] Structured logging
* [x] Exception handling
* [x] Dependency auditing
* [x] OWASP compliance

---

# 🚀 Future Improvements

* Online multiplayer
* Cloud synchronization
* Elo matchmaking
* Neural-network evaluation
* Self-play reinforcement learning
* Chess puzzles and training mode
* Tournament system

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/new-feature
```

3. Commit changes

```bash
git commit -m "Add new feature"
```

4. Push to GitHub

```bash
git push origin feature/new-feature
```

5. Open a Pull Request

---

# 📜 License

Distributed under the **MIT License**.

See `LICENSE` for more information.

---

## ⭐ If you like this project, don't forget to star the repository! ♟️🚀
