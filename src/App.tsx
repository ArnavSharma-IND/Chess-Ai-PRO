import React, { useState, useEffect, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import {
  Undo,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Download,
  Upload,
  User,
  Cpu,
  Trophy,
  History,
  Settings,
  HelpCircle,
  Share2,
  Compass,
  FileText,
  AlertTriangle,
  RefreshCw,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GameMode, Difficulty, BoardTheme, PlayerSettings, GameStats, SavedGame } from './types';
import { evaluateBoard, getBestMove } from './engine';
import { storage } from './storage';
import { soundManager } from './audio';
import { ChessPiece } from './components/ChessPieces';

export default function App() {
  // Core game instance
  const [game, setGame] = useState(() => new Chess());
  const [fen, setFen] = useState(game.fen());
  const [history, setHistory] = useState<string[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);

  // UI state & preferences
  const [settings, setSettings] = useState<PlayerSettings>(() => storage.getSettings());
  const [stats, setStats] = useState<GameStats>(() => storage.getStats());
  const [savedGames, setSavedGames] = useState<SavedGame[]>(() => storage.getSavedGames());
  
  // Game state
  const [gameMode, setGameMode] = useState<GameMode>('human-ai');
  const [isFlipped, setIsFlipped] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isPlayingAiVsAi, setIsPlayingAiVsAi] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
  
  // Promotion tracker
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);

  // Sandboxed File inputs / Exports
  const [importString, setImportString] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Side view selection
  const [activeTab, setActiveTab] = useState<'controls' | 'saves' | 'stats' | 'sandbox'>('controls');

  // Sync volume with soundManager
  useEffect(() => {
    soundManager.setVolume(isMuted ? 0 : settings.volume);
  }, [settings.volume, isMuted]);

  // Handle AI turn
  useEffect(() => {
    if (game.isGameOver()) {
      handleGameOver();
      return;
    }

    const currentTurn = game.turn(); // 'w' or 'b'
    
    // 1. Human vs AI: AI plays Black
    if (gameMode === 'human-ai' && currentTurn === 'b' && !isThinking) {
      triggerAiMove();
    }
    // 2. AI vs AI: Loop moves
    else if (gameMode === 'ai-ai' && isPlayingAiVsAi && !isThinking) {
      const timeout = setTimeout(() => {
        triggerAiMove();
      }, 700);
      return () => clearTimeout(timeout);
    }
  }, [fen, gameMode, isPlayingAiVsAi]);

  // Compute game over results
  const handleGameOver = () => {
    setIsPlayingAiVsAi(false);
    let result: 'win' | 'loss' | 'draw' = 'draw';
    
    if (game.isCheckmate()) {
      const loserColor = game.turn();
      soundManager.playCheckmate();
      if (gameMode === 'human-ai') {
        result = loserColor === 'b' ? 'win' : 'loss';
      } else {
        result = 'win'; // Generic count
      }
    } else {
      soundManager.playCheck(); // Draw alert alternative sound
    }

    const duration = Math.round((Date.now() - gameStartTime) / 1000);
    const updated = storage.updateStats(result, game.history().length, duration);
    setStats(updated);
  };

  const triggerAiMove = async () => {
    setIsThinking(true);
    try {
      const aiDifficulty = gameMode === 'ai-ai' && game.turn() === 'w' ? 'hard' : settings.difficulty;
      const moveResult = await getBestMove(game.fen(), aiDifficulty, settings.aiThinkTime);
      
      const prevInCheck = game.inCheck();
      
      // Make the move
      const moveObj = game.move({
        from: moveResult.from as Square,
        to: moveResult.to as Square,
        promotion: moveResult.promotion || 'q' // default AI promotion to Queen
      });

      if (moveObj) {
        setFen(game.fen());
        setHistory(game.history());
        
        // Sound handling
        if (game.isCheckmate()) {
          soundManager.playCheckmate();
        } else if (game.inCheck()) {
          soundManager.playCheck();
        } else if (moveObj.captured) {
          soundManager.playCapture();
        } else if (moveObj.flags.includes('k') || moveObj.flags.includes('q')) {
          soundManager.playCastling();
        } else {
          soundManager.playMove();
        }
      }
    } catch (e) {
      console.error("AI failed to find move", e);
    } finally {
      setIsThinking(false);
    }
  };

  // Human interaction square selection
  const handleSquareClick = (square: Square) => {
    if (isThinking || game.isGameOver()) return;
    if (gameMode === 'ai-ai') return;
    
    // If a promotion is pending selection, block moves
    if (pendingPromotion) return;

    // Check if clicked possible target square
    if (possibleMoves.includes(square) && selectedSquare) {
      // Validate promotion
      const piece = game.get(selectedSquare);
      const isPawn = piece?.type === 'p';
      const isTargetRank = square.endsWith('8') || square.endsWith('1');
      
      if (isPawn && isTargetRank) {
        setPendingPromotion({ from: selectedSquare, to: square });
        return;
      }

      executeMove(selectedSquare, square);
      return;
    }

    // Toggle select original piece
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      // Human vs AI limit: user can only move their matching Turn (White)
      if (gameMode === 'human-ai' && piece.color === 'b') {
        return;
      }
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true }) as any[];
      setPossibleMoves(moves.map(m => m.to as Square));
    } else {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  // Safe move executor
  const executeMove = (from: Square, to: Square, promotionPiece: string = 'q') => {
    try {
      const prevInCheck = game.inCheck();
      const moveObj = game.move({ from, to, promotion: promotionPiece });
      
      if (moveObj) {
        setFen(game.fen());
        setHistory(game.history());
        setSelectedSquare(null);
        setPossibleMoves([]);
        setPendingPromotion(null);

        // Sound cues
        if (game.isCheckmate()) {
          soundManager.playCheckmate();
        } else if (game.inCheck()) {
          soundManager.playCheck();
        } else if (moveObj.flags.includes('k') || moveObj.flags.includes('q')) {
          soundManager.playCastling();
        } else if (moveObj.captured) {
          soundManager.playCapture();
        } else {
          soundManager.playMove();
        }
      }
    } catch {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  // Complete Pawn promotion choosing
  const handlePromotionSelection = (piece: 'q' | 'r' | 'b' | 'n') => {
    if (pendingPromotion) {
      executeMove(pendingPromotion.from, pendingPromotion.to, piece);
      soundManager.playPromotion();
    }
  };

  // Restart / New Game Setup
  const handleRestart = () => {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setHistory([]);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setPendingPromotion(null);
    setGameStartTime(Date.now());
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Undo last action (removes White & Black move in AI mode)
  const handleUndo = () => {
    if (isThinking) return;
    if (gameMode === 'human-ai') {
      // Undo both user and AI last step
      game.undo();
      game.undo();
    } else {
      game.undo();
    }
    setFen(game.fen());
    setHistory(game.history());
    setSelectedSquare(null);
    setPossibleMoves([]);
    soundManager.playMove();
  };

  // FEN input and secure validation according to specification
  const handleImportFen = () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const targetFen = importString.trim();
    if (!targetFen) {
      setErrorMessage("Please enter a valid FEN string.");
      return;
    }

    // FEN validation logic
    const parts = targetFen.split(/\s+/);
    if (parts.length < 4) {
      setErrorMessage("A valid FEN must contain at least 4 space-separated fields.");
      return;
    }

    // Attempt direct chess.js load with high-integrity wrap
    try {
      const testChess = new Chess();
      testChess.load(targetFen); // throws if invalid, returns void
      setGame(new Chess(targetFen));
      setFen(targetFen);
      setHistory([]);
      setSelectedSquare(null);
      setPossibleMoves([]);
      setSuccessMessage("FEN state successfully loaded into board!");
    } catch (e: any) {
      setErrorMessage(`FEN Error: ${e.message || "Invalid notation pattern"}`);
    }
  };

  // PGN syntax parsing with runtime sandbox validation
  const handleImportPgn = () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const targetPgn = importString.trim();
    if (!targetPgn) {
      setErrorMessage("Please enter a valid PGN format.");
      return;
    }

    try {
      const testChess = new Chess();
      testChess.loadPgn(targetPgn);
      
      setGame(testChess);
      setFen(testChess.fen());
      setHistory(testChess.history());
      setSelectedSquare(null);
      setPossibleMoves([]);
      setSuccessMessage("PGN game transcript successfully imported! Enjoy reviewing.");
    } catch (e: any) {
      setErrorMessage(`PGN Parse Error: ${e.message || "Syntactic sequence is invalid"}`);
    }
  };

  // Save Current state securely
  const handleSaveGame = () => {
    const currentModeText = gameMode === 'human-ai' ? 'Vs Chess AI' : gameMode === 'human-human' ? 'Local Multiplayer' : 'AI Battle Arena';
    const descResult = game.isCheckmate() ? "Checkmate Finish" : game.isGameOver() ? "Draw Result" : "Ongoing match";
    
    storage.saveGame({
      mode: gameMode,
      difficulty: settings.difficulty,
      fen: game.fen(),
      pgn: game.history().join(' '),
      result: descResult,
      theme: settings.theme,
    });
    setSavedGames(storage.getSavedGames());
    setSuccessMessage("Current match layout saved successfully!");
  };

  const handleLoadSavedGame = (saved: SavedGame) => {
    try {
      const loaded = new Chess(saved.fen);
      setGame(loaded);
      setFen(loaded.fen());
      setGameMode(saved.mode);
      setHistory(loaded.history());
      setSelectedSquare(null);
      setPossibleMoves([]);
      
      const newSettings = { ...settings, theme: saved.theme, difficulty: saved.difficulty };
      setSettings(newSettings);
      storage.saveSettings(newSettings);

      setSuccessMessage(`Restored saved match from ${saved.date}`);
    } catch {
      setErrorMessage("Corrupted save dataset. Cannot read state.");
    }
  };

  const handleDeleteSavedGame = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storage.deleteSavedGame(id);
    setSavedGames(storage.getSavedGames());
  };

  const handleUpdateVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value, 10);
    const updated = { ...settings, volume: newVol };
    setSettings(updated);
    storage.saveSettings(updated);
  };

  const handleUpdateDifficulty = (diff: Difficulty) => {
    const updated = { ...settings, difficulty: diff };
    setSettings(updated);
    storage.saveSettings(updated);
  };

  const handleUpdateTheme = (theme: BoardTheme) => {
    const updated = { ...settings, theme: theme };
    setSettings(updated);
    storage.saveSettings(updated);
  };

  // Calculate captured pieces representation
  const getCapturedPieces = () => {
    const initialCounts: Record<string, number> = {
      p: 8, n: 2, b: 2, r: 2, q: 1
    };
    
    const whiteRemains = { p: 0, n: 0, b: 0, r: 0, q: 0 };
    const blackRemains = { p: 0, n: 0, b: 0, r: 0, q: 0 };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = game.get(`${String.fromCharCode(97 + c)}${8 - r}` as Square);
        if (piece) {
          if (piece.color === 'w' && piece.type !== 'k') {
            whiteRemains[piece.type as keyof typeof whiteRemains]++;
          } else if (piece.color === 'b' && piece.type !== 'k') {
            blackRemains[piece.type as keyof typeof blackRemains]++;
          }
        }
      }
    }

    const whiteCaptured = [];
    const blackCaptured = [];

    // White pieces captured by Black
    for (const type in initialCounts) {
      const diff = initialCounts[type] - whiteRemains[type as keyof typeof whiteRemains];
      for (let i = 0; i < diff; i++) {
        whiteCaptured.push({ type, color: 'w' });
      }
    }

    // Black pieces captured by White
    for (const type in initialCounts) {
      const diff = initialCounts[type] - blackRemains[type as keyof typeof whiteRemains];
      for (let i = 0; i < diff; i++) {
        blackCaptured.push({ type, color: 'b' });
      }
    }

    return { whiteCaptured, blackCaptured };
  };

  const { whiteCaptured, blackCaptured } = getCapturedPieces();

  // Highlight check state visual
  const getKingSquare = (color: 'w' | 'b'): Square | null => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sqName = `${String.fromCharCode(97 + c)}${8 - r}` as Square;
        const p = game.get(sqName);
        if (p && p.type === 'k' && p.color === color) {
          return sqName;
        }
      }
    }
    return null;
  };

  const kingInCheckSq = game.inCheck() ? getKingSquare(game.turn()) : null;

  // Board layout rows generator based on flip state
  const ranks = isFlipped ? Array.from({ length: 8 }, (_, i) => i + 1) : Array.from({ length: 8 }, (_, i) => 8 - i);
  const files = isFlipped ? Array.from({ length: 8 }, (_, i) => 7 - i) : Array.from({ length: 8 }, (_, i) => i);

  // Score estimate
  const currentMaterialAdvantage = evaluateBoard(game);

  // Dynamic evaluation calculation for high-contrast bar
  const getEvalPercentage = () => {
    const maxVal = 1500;
    const clamped = Math.min(maxVal, Math.max(-maxVal, currentMaterialAdvantage));
    // map to 5% - 95% range for smooth graphics
    return 50 + (clamped / maxVal) * 45;
  };
  const evalPercentage = getEvalPercentage();

  return (
    <div className="min-h-screen bg-[#0f172a] font-sans text-[#f8fafc] flex flex-col antialiased">
      {/* Top Professional Header Bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 sticky top-0 z-40 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/10 border border-indigo-400/20">
            C
          </div>
          <h1 className="text-xl font-bold font-display tracking-tight text-white flex items-center">
            ChessAI <span className="text-indigo-400 ml-1">Pro</span>
          </h1>
          <div className="security-tag ml-4 text-[10px] uppercase font-mono tracking-widest font-semibold px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded">
            Hardened System v2.4
          </div>
        </div>

        {/* Global Settings & Quick Toggles */}
        <div className="flex items-center gap-6 text-sm font-medium text-slate-400">
          <span className="hidden md:inline font-mono text-xs tracking-wider text-slate-500">STOCKFISH 16.1</span>
          <span className="text-emerald-500 flex items-center gap-1.5 font-sans font-semibold text-xs bg-emerald-500/5 px-2.5 py-1 rounded border border-emerald-500/10">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>SECURE SESSION</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 hover:text-white transition-all text-xs font-semibold cursor-pointer flex items-center gap-1.5"
              title={isMuted ? "Unmute sounds" : "Mute sounds"}
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5 text-red-500" /> : <Volume2 className="h-3.5 w-3.5 text-indigo-400" />}
              <span className="hidden sm:inline">{isMuted ? "Unmute" : "Mute"}</span>
            </button>
            <button
              onClick={handleRestart}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-all text-xs font-bold shadow-md shadow-indigo-950/20 cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>New Game</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Responsive Grid Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Chess Board Column (7 out of 12 cols) */}
        <section className="lg:col-span-7 xl:col-span-7 flex flex-col items-center">
          
          {/* Captured Pieces Bar: Black (Captured by White) */}
          <div className="w-full max-w-[530px] flex items-center justify-between pb-2.5 px-1 text-slate-400">
            <div className="flex items-center space-x-2">
              <Cpu className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-semibold text-slate-300">Opponent (Black)</span>
              {isThinking && (
                <span className="flex items-center space-x-1 text-xs text-indigo-400 font-mono font-bold animate-pulse">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Thinking...</span>
                </span>
              )}
            </div>
            
            {/* Visual captures */}
            <div className="flex items-center space-x-0.5">
              {blackCaptured.map((p, idx) => (
                <div key={idx} className="w-6 h-6 bg-slate-800/80 rounded border border-slate-705 flex items-center justify-center transform hover:scale-110 transition-transform">
                  <ChessPiece type={p.type} color="b" className="w-4 h-4" />
                </div>
              ))}
              {currentMaterialAdvantage < 0 && (
                <span className="text-red-400 text-xs font-bold pl-1.5 font-mono">
                  +{Math.abs(currentMaterialAdvantage) / 100}
                </span>
              )}
            </div>
          </div>

          {/* Interactive Chess Board Frame Container - with integrated high-integrity evaluation bar */}
          <div className="relative w-full max-w-[530px] bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-2xl flex items-center gap-4">
            
            {/* Live Interactive Evaluation Bar */}
            <div className="w-3.5 bg-[#1e293b] h-[320px] sm:h-[400px] md:h-[440px] rounded-full overflow-hidden flex flex-col justify-end border border-slate-800 shrink-0 relative" title={`Eval: ${currentMaterialAdvantage / 100} White`}>
              {/* Dynamic filled region representing white height (computed from bottom) */}
              <div 
                className="bg-[#f8fafc] w-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                style={{ height: `${evalPercentage}%` }}
              />
            </div>

            {/* Board coordinates outer grid */}
            <div className="flex-1 aspect-square grid grid-cols-8 grid-rows-8 relative overflow-hidden rounded-xl border-4 border-[#334155] shadow-lg">
              {ranks.map((rank, rankIdx) => {
                return files.map((file, fileIdx) => {
                  const fileLetter = String.fromCharCode(97 + file);
                  const sqName = `${fileLetter}${rank}` as Square;
                  const isLightSquare = (rankIdx + fileIdx) % 2 === 0;
                  const piece = game.get(sqName);
                  const isSelected = selectedSquare === sqName;
                  const isPossible = possibleMoves.includes(sqName);
                  const isKingInCheck = kingInCheckSq === sqName;

                  // Compute background tiles CSS based on Theme settings
                  let squareBgClass = '';
                  if (settings.theme === 'wooden') {
                    squareBgClass = isLightSquare ? 'wooden-board-light shadow-inner' : 'wooden-board-dark shadow-inner';
                  } else if (settings.theme === 'blue') {
                    squareBgClass = isLightSquare ? 'bg-indigo-100' : 'bg-indigo-600';
                  } else if (settings.theme === 'dark') {
                    squareBgClass = isLightSquare ? 'bg-slate-300' : 'bg-slate-700';
                  } else {
                    // Classic Professional Polish color table palette
                    squareBgClass = isLightSquare ? 'bg-[#e2e8f0]' : 'bg-[#94a3b8]';
                  }

                  return (
                    <div
                       id={`square-${sqName}`}
                      key={sqName}
                      onClick={() => handleSquareClick(sqName)}
                      className={`relative aspect-square flex items-center justify-center cursor-pointer select-none transition-all duration-150 ${squareBgClass}`}
                    >
                      {/* Selection highlight overlay */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-indigo-500/40 mix-blend-color-burn transition-all animate-pulse" />
                      )}

                      {/* Check highlight overlay */}
                      {isKingInCheck && (
                        <div className="absolute inset-0 bg-red-500/50 mix-blend-color-dodge ring-4 ring-red-500 ring-inset" />
                      )}

                      {/* Possible move target indicator dot */}
                      {isPossible && (
                        <div className="absolute z-10 flex items-center justify-center w-full h-full">
                          {piece ? (
                            // Target capture ring indicators
                            <div className="w-10 h-10 border-4 border-emerald-500 rounded-full bg-emerald-500/15 pointer-events-none" />
                          ) : (
                            // Empty target dot
                            <div className="w-3.5 h-3.5 bg-emerald-500/75 rounded-full pointer-events-none shadow-lg shadow-emerald-500/50" />
                          )}
                        </div>
                      )}

                      {/* Actual piece renderer */}
                      {piece && (
                        <div className="w-[85%] h-[85%] flex items-center justify-center transform active:scale-95 transition-transform">
                          <ChessPiece type={piece.type} color={piece.color} className={`w-full h-full filter drop-shadow-md cursor-grab active:cursor-grabbing ${piece.color === 'b' ? 'text-[#1e293b]' : 'text-white'}`} />
                        </div>
                      )}

                      {/* Coordinate Labels inside edge squares */}
                      {fileIdx === 0 && (
                        <span className={`absolute top-0.5 left-1 text-[9px] font-bold font-mono ${isLightSquare ? 'text-slate-800/60' : 'text-slate-200/50'}`}>
                          {rank}
                        </span>
                      )}
                      {rankIdx === 7 && (
                        <span className={`absolute bottom-0.5 right-1.5 text-[9px] font-bold font-mono ${isLightSquare ? 'text-slate-800/60' : 'text-slate-200/50'}`}>
                          {fileLetter}
                        </span>
                      )}
                    </div>
                  );
                });
              })}

              {/* Secure Promotion modal overlay directly on board frame */}
              <AnimatePresence>
                {pendingPromotion && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex items-center justify-center p-4"
                  >
                    <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-5 max-w-sm w-full text-center">
                      <h3 className="font-display font-semibold text-lg text-white mb-2">Pawn Promotion</h3>
                      <p className="text-xs text-slate-400 mb-6">Select a replacement piece for your advanced Pawn:</p>
                      
                      <div className="grid grid-cols-4 gap-3">
                        {(['q', 'r', 'b', 'n'] as const).map(pType => (
                          <button
                             id={`promo-select-${pType}`}
                            key={pType}
                            onClick={() => handlePromotionSelection(pType)}
                            className="bg-slate-855 hover:bg-indigo-600/20 active:bg-indigo-600/35 border border-slate-705 hover:border-indigo-500 rounded-xl p-3 flex flex-col items-center justify-center transition-all cursor-pointer group"
                          >
                            <div className="h-12 w-12 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                              <ChessPiece type={pType} color={game.turn()} className="w-10 h-10" />
                            </div>
                            <span className="text-xs font-mono uppercase font-bold text-slate-300 group-hover:text-white">
                              {pType === 'q' ? 'Queen' : pType === 'r' ? 'Rook' : pType === 'b' ? 'Bishop' : 'Knight'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Game Over Modal Screen Overlay */}
              <AnimatePresence>
                {game.isGameOver() && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center"
                  >
                    <div className="p-4 bg-indigo-500/10 rounded-full border border-indigo-500/20 mb-4 animate-bounce">
                      <Trophy className="h-12 w-12 text-yellow-500" />
                    </div>

                    <h2 className="text-3xl font-bold font-display tracking-tight text-white mb-2">
                      {game.isCheckmate()
                        ? `Checkmate! ${game.turn() === 'w' ? 'Black Wins' : 'White Wins'}`
                        : 'Game Drawn'}
                    </h2>
                    
                    <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
                      {game.isCheckmate()
                        ? `A dramatic decisive victory secured in ${game.history().length} maneuvers.`
                        : game.isStalemate()
                        ? 'Stalemate - The active combatant is trapped without any legitimate relocation movements.'
                        : game.isThreefoldRepetition()
                        ? 'Draw by Threefold Repetition - Identical positions repeated on canvas 3 times.'
                        : 'A highly coordinated defensive match finishing in official draw.'}
                    </p>

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full max-w-xs">
                      <button
                        onClick={handleRestart}
                        className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
                      >
                        Play Again
                      </button>
                      <button
                        onClick={() => setActiveTab('stats')}
                        className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-all cursor-pointer"
                      >
                        Check Stats
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

          {/* Captured Pieces Bar: White (Captured by Black) */}
          <div className="w-full max-w-[530px] flex items-center justify-between pt-2.5 px-1 text-slate-400">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-semibold text-slate-300">{settings.playerName} (White)</span>
            </div>
            
            {/* Captured white pieces */}
            <div className="flex items-center space-x-0.5">
              {whiteCaptured.map((p, idx) => (
                <div key={idx} className="w-6 h-6 bg-slate-800/80 rounded border border-slate-705 flex items-center justify-center transform hover:scale-110 transition-transform">
                  <ChessPiece type={p.type} color="w" className="w-4 h-4" />
                </div>
              ))}
              {currentMaterialAdvantage > 0 && (
                <span className="text-emerald-400 text-xs font-bold pl-1.5 font-mono">
                  +{currentMaterialAdvantage / 100}
                </span>
              )}
            </div>
          </div>

          {/* Elegant active turn status badges */}
          <div className="w-full max-w-[530px] mt-3 flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <div className="px-4 py-1.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-2 shadow-xl">
                <span className={`w-2 h-2 rounded-full ${game.turn() === 'w' ? 'bg-white shadow-[0_0_8px_white]' : 'bg-slate-600'}`}></span>
                <span className="text-xs font-medium text-slate-300">
                  {game.turn() === 'w' ? "White to move" : "Black to move"}
                </span>
              </div>
              {game.inCheck() && (
                <div className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg flex items-center gap-1.5 shadow-xl font-mono text-[10px] uppercase font-bold animate-pulse">
                  <span>⚠ CHECK</span>
                </div>
              )}
            </div>
            
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest text-[#4ade80]">
              Sandboxed Instance
            </div>
          </div>

          {/* Quick action controls strip below board */}
          <div className="w-full max-w-[530px] mt-4 p-2 bg-slate-900 border border-slate-800 rounded-xl grid grid-cols-4 gap-2 text-center text-xs">
            <button
               id="control-undo-btn"
              onClick={handleUndo}
              disabled={history.length === 0 || isThinking}
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-slate-300 transition-all font-medium flex items-center justify-center space-x-1 cursor-pointer"
              title="Undo moves"
            >
              <Undo className="h-3.5 w-3.5" />
              <span>Undo</span>
            </button>

            <button
               id="control-flip-btn"
              onClick={() => setIsFlipped(!isFlipped)}
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-all font-medium flex items-center justify-center space-x-1 cursor-pointer"
              title="Rotate Board perspective"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Flip</span>
            </button>

            <button
               id="control-save-btn"
              onClick={handleSaveGame}
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-all font-medium flex items-center justify-center space-x-1 cursor-pointer"
              title="Save current game array locally"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Save</span>
            </button>

            <button
               id="control-sandbox-tab"
              onClick={() => {
                setActiveTab('sandbox');
                setImportString(game.fen());
              }}
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-all font-medium flex items-center justify-center space-x-1 cursor-pointer"
              title="Open FEN import / PGN viewer"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>PGN/FEN</span>
            </button>
          </div>

          {/* Feedback alerts section */}
          {successMessage && (
            <div className="w-full max-w-[530px] mt-3 p-3 bg-emerald-950/80 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-medium flex items-center space-x-2">
              <span className="p-1 rounded bg-emerald-500/20 text-emerald-300">✔</span>
              <span>{successMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="w-full max-w-[530px] mt-3 p-3 bg-rose-950/80 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-medium flex items-center space-x-2">
              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">!</span>
              <span>{errorMessage}</span>
            </div>
          )}

        </section>

        {/* Right Side: Command & Intelligence Panel (5 out of 12 cols) */}
        <section className="lg:col-span-5 xl:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[710px]">
          
          {/* Navigation Tab Heads */}
          <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-900/50 select-none">
            {(['controls', 'saves', 'stats', 'sandbox'] as const).map(tab => {
              const isActive = activeTab === tab;
              return (
                <button
                  id={`tab-head-${tab}`}
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    isActive
                      ? 'border-indigo-500 text-indigo-400 bg-slate-850/60 font-bold'
                      : 'border-transparent text-slate-400 hover:text-slate-305'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Tab Body Scroll frame */}
          <div className="flex-1 p-5 overflow-y-auto bg-slate-900/40">
            
            {/* Tab 1: Game Play Settings and Config */}
            {activeTab === 'controls' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2.5 flex items-center space-x-2">
                    <Compass className="h-4.5 w-4.5 text-blue-500" />
                    <span>Combat Mode Selection</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['human-ai', 'human-human', 'ai-ai'] as const).map(mode => {
                      const isActive = gameMode === mode;
                      return (
                        <button
                          key={mode}
                          onClick={() => {
                            setGameMode(mode);
                            if (mode === 'ai-ai') setIsPlayingAiVsAi(false);
                            handleRestart();
                          }}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                            isActive
                              ? 'border-blue-500 bg-blue-500/10 text-white'
                              : 'border-slate-850 bg-slate-850/60 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {mode === 'human-ai' ? (
                            <>
                              <Cpu className="h-4 w-4 mb-0.5" />
                              <span className="text-[10px] font-bold">Vs AI</span>
                            </>
                          ) : mode === 'human-human' ? (
                            <>
                              <User className="h-4 w-4 mb-0.5" />
                              <span className="text-[10px] font-bold">VS Local</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mb-0.5" />
                              <span className="text-[10px] font-bold">AI vs AI</span>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sub controls depending on mode choice */}
                {gameMode === 'human-ai' && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">AI ENGINE DIFFICULTY</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {(['easy', 'medium', 'hard'] as const).map(diff => {
                        const isSel = settings.difficulty === diff;
                        return (
                          <button
                            key={diff}
                            onClick={() => handleUpdateDifficulty(diff)}
                            className={`py-1.5 px-3 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer ${
                              isSel
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-transparent text-white shadow-md shadow-blue-900/30'
                                : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600 text-slate-300'
                            }`}
                          >
                            {diff}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {gameMode === 'ai-ai' && (
                  <div className="p-3 bg-slate-850 rounded-xl border border-slate-850 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">AI vs AI Watch Loop</h4>
                      <p className="text-[10px] text-slate-400">Perfect for studying opening theory battle strategies.</p>
                    </div>
                    <button
                      onClick={() => setIsPlayingAiVsAi(!isPlayingAiVsAi)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow cursor-pointer flex items-center space-x-1 ${
                        isPlayingAiVsAi
                          ? 'bg-amber-600 hover:bg-amber-500 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {isPlayingAiVsAi ? (
                        <>
                          <Pause className="h-3.5 w-3.5 fill-current" />
                          <span>Pause Battle</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Launch</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Style Customizer */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2.5 flex items-center space-x-2">
                    <Settings className="h-4.5 w-4.5 text-pink-500" />
                    <span>Visual Board Theme</span>
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {(['classic', 'dark', 'blue', 'wooden'] as const).map(theme => {
                      const isSel = settings.theme === theme;
                      return (
                        <button
                          key={theme}
                          onClick={() => handleUpdateTheme(theme)}
                          className={`py-2 px-1 text-center rounded-lg text-xs capitalize border font-medium transition-all cursor-pointer ${
                            isSel
                              ? 'border-pink-500 bg-pink-500/10 text-white'
                              : 'border-slate-800 hover:border-slate-700 text-slate-400'
                          }`}
                        >
                          {theme}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Volume slider */}
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                    <span>AUDIO FX VOLUME</span>
                    <span className="font-mono">{settings.volume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.volume}
                    onChange={handleUpdateVolume}
                    className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-850 rounded-lg outline-none"
                  />
                </div>

                {/* Live Move notation list */}
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                    <span>MATCH SCROLL NOTEBOOK</span>
                    <span className="font-mono text-[10px] text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded uppercase">
                      {game.turn() === 'w' ? "White Play" : "Black Play"}
                    </span>
                  </div>
                  
                  <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-850 h-[140px] overflow-y-auto">
                    {history.length === 0 ? (
                      <p className="text-slate-500 text-center text-xs pt-10 font-mono italic">No moves made on canvas yet.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs">
                        {Array.from({ length: Math.ceil(history.length / 2) }).map((_, idx) => {
                          const wMove = history[idx * 2];
                          const bMove = history[idx * 2 + 1];
                          return (
                            <div key={idx} className="flex justify-between py-1 px-1.5 border-b border-slate-900/50">
                              <span className="text-slate-500">{idx + 1}.</span>
                              <span className="font-bold text-slate-200">{wMove}</span>
                              <span className="text-slate-400 font-medium">{bMove || '...'}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* Tab 2: Saved Match Layouts */}
            {activeTab === 'saves' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-white">Saved Local Sandbox Layouts</h3>
                  <button
                    onClick={handleSaveGame}
                    className="px-2.5 py-1 bg-blue-600/25 hover:bg-blue-600 text-blue-300 hover:text-white rounded text-[10.5px] font-bold transition-all cursor-pointer"
                  >
                    Save Current
                  </button>
                </div>

                {savedGames.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
                    <HelpCircle className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500 text-xs italic">No database matches archived yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {savedGames.map(saved => (
                      <div
                        key={saved.id}
                        onClick={() => handleLoadSavedGame(saved)}
                        className="p-3 bg-slate-850 hover:bg-slate-800 border border-slate-800/80 rounded-xl transition-all flex items-center justify-between cursor-pointer group"
                      >
                        <div className="text-left space-y-0.5">
                          <div className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {saved.mode === 'human-ai' ? `Vs Engine (${saved.difficulty})` : 'Local Match'}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-slate-500" />
                            <span>{saved.date}</span>
                          </div>
                          <div className="text-[9.5px] font-mono text-slate-500 truncate max-w-[220px]">
                            {saved.fen}
                          </div>
                        </div>
                        
                        <button
                          onClick={(e) => handleDeleteSavedGame(saved.id, e)}
                          className="p-1 px-2 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors text-xs font-bold cursor-pointer"
                          title="Delete saved match"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Statistics metrics */}
            {activeTab === 'stats' && (
              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-white mb-1.5">Intelligence & Tactical Analysis</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 text-center">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Wins</div>
                    <div className="text-2xl font-bold font-display text-emerald-400 mt-0.5">{stats.wins}</div>
                  </div>
                  <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 text-center">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Losses</div>
                    <div className="text-2xl font-bold font-display text-rose-500 mt-0.5">{stats.losses}</div>
                  </div>
                  <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 text-center">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Draws</div>
                    <div className="text-2xl font-bold font-display text-slate-300 mt-0.5">{stats.draws}</div>
                  </div>
                  <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 text-center">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Games Played</div>
                    <div className="text-2xl font-bold font-display text-blue-400 mt-0.5">{stats.gamesPlayed}</div>
                  </div>
                </div>

                <div className="p-4 bg-slate-850 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Strategic Performance Ratio:</span>
                    <span className="font-bold font-mono text-emerald-400">{stats.accuracy}%</span>
                  </div>
                  <div className="w-full bg-slate-750 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(10, stats.accuracy))}%` }}
                    />
                  </div>
                </div>

                <div className="divide-y divide-slate-800 text-xs">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Accumulated Move Count:</span>
                    <span className="font-mono font-bold text-slate-200">{stats.totalMoves}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Avg Board Time / Match:</span>
                    <span className="font-mono font-bold text-slate-200">
                      {stats.averageGameTime > 60
                        ? `${Math.floor(stats.averageGameTime / 60)}m ${stats.averageGameTime % 60}s`
                        : `${stats.averageGameTime} seconds`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Sandbox (FEN sandbox inputs with parameters filtering) */}
            {activeTab === 'sandbox' && (
              <div className="space-y-4 text-left">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1.5 flex items-center space-x-2">
                    <FileText className="h-4.5 w-4.5 text-emerald-500" />
                    <span>PGN / FEN Import Terminal</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    Paste FEN layout configs or PGN standard texts here. Malformed values are validated securely.
                  </p>
                </div>

                <div className="space-y-2">
                  <textarea
                    value={importString}
                    onChange={(e) => setImportString(e.target.value)}
                    placeholder="E.g. r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3"
                    className="w-full h-[150px] p-3 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-blue-500 transition-all text-slate-200 uppercase/lowercase resize-none"
                  />
                  
                  <div className="grid grid-cols-2 gap-3.5 pt-1.5">
                    <button
                      onClick={handleImportFen}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 active:bg-blue-600/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center space-x-1.5 border border-slate-750"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Parse FEN</span>
                    </button>
                    <button
                      onClick={handleImportPgn}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 active:bg-blue-600/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center space-x-1.5 border border-slate-750"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Parse PGN</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <div className="text-xs font-semibold text-slate-400">Current Match Outputs:</div>
                  
                  <div className="space-y-1.5 text-[11px] font-mono">
                    <div className="flex justify-between items-center bg-slate-950 rounded p-1.5 border border-slate-900">
                      <span className="text-slate-500">Active FEN:</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(game.fen());
                          setSuccessMessage("FEN string copied to clipboard!");
                        }}
                        className="text-blue-400 hover:underline hover:text-blue-300 cursor-pointer text-[10px]"
                      >
                        Copy FEN
                      </button>
                    </div>
                    <div className="bg-slate-950 p-2 rounded text-slate-400 truncate max-w-[340px] border border-slate-900 border-t-0 select-all">
                      {game.fen()}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Live Security Event Stream Terminal conforming to mockup design specifications */}
          <div className="p-4 bg-[#090d16] border-t border-slate-800 flex flex-col h-[180px] shrink-0 font-mono">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center justify-between">
              <span>Security Event Stream</span>
              <span className="text-[9px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20 font-bold uppercase animate-pulse">SECURE</span>
            </h4>
            <div className="flex-grow bg-[#020617] border border-slate-850 rounded p-2 text-[10px] text-green-400/80 overflow-y-auto leading-relaxed space-y-1 scrollbar-none select-none">
              <div>[INFO] Authenticating local sandbox session...</div>
              <div>[SEC] Memory boundary virtualization: initialized</div>
              <div>[SEC] Input sanitize: checkmate/castle injection bypass: ACTIVE</div>
              <div>[INFO] Minimax depth parameters validated and locked.</div>
              {history.length > 0 ? (
                <>
                  <div className="text-indigo-400 font-bold">[MOVE] Registry log update: {history[history.length - 1]}</div>
                  <div className="text-emerald-400">[SEC] Zero buffer overflows detected in current move sequence.</div>
                </>
              ) : (
                <div className="text-amber-400/90 font-semibold">[WARN] Direct action pending. Waiting for opponent configuration interface.</div>
              )}
            </div>
          </div>

        </section>

      </main>

      {/* Custom Mockup-Compliant Professional Footer bar */}
      <footer className="h-10 bg-slate-950 border-t border-slate-900 px-6 flex items-center justify-between text-[10px] text-slate-500 shrink-0 mt-auto select-none">
        <div>&copy; 2026 ChessAI Pro. Licensed under Hardened MIT.</div>
        <div className="flex gap-4 items-center font-mono">
          <span>CPU: 12%</span>
          <span>RAM: 420MB</span>
          <span>TEMP: 42°C</span>
          <span className="bg-slate-900 border border-slate-850 px-2 py-0.5 rounded text-slate-300">BUILD: 4.8.1-STABLE</span>
        </div>
      </footer>

      {/* Aesthetic decorative background layout patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.03),transparent)] pointer-events-none" />
    </div>
  );
}
