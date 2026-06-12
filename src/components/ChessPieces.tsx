import React from 'react';

interface PieceProps {
  color: 'w' | 'b';
  className?: string;
}

export const Pawn: React.FC<PieceProps> = ({ color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';
  return (
    <svg viewBox="0 0 45 45" className={className} id={`pawn-${color}`}>
      <defs>
        <linearGradient id={isWhite ? "pawn-white-grad" : "pawn-black-grad"} x1="0" y1="0" x2="0" y2="1">
          {isWhite ? (
            <>
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </>
          )}
        </linearGradient>
        <filter id="p-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3" />
        </filter>
      </defs>
      <g
        fill={`url(#${isWhite ? "pawn-white-grad" : "pawn-black-grad"})`}
        stroke={isWhite ? "#475569" : "#1e293b"}
        strokeWidth="1.5"
        strokeLinejoin="round"
        filter="url(#p-shadow)"
      >
        <path d="M22.5,9 C24.2,9 25.5,10.3 25.5,12 C25.5,13.7 24.2,15 22.5,15 C20.8,15 19.5,13.7 19.5,12 C19.5,10.3 20.8,9 22.5,9 z" />
        <path d="M22.5,15.5 C17.5,15.5 16.5,23.5 16.5,29 L28.5,29 C28.5,23.5 27.5,15.5 22.5,15.5 z" />
        <path d="M11.5,32 L33.5,32 L33.5,34.5 L11.5,34.5 L11.5,32 z" />
        <path d="M14.5,34.5 L30.5,34.5 L30.5,37 L14.5,37 L14.5,34.5 z" />
        {isWhite && <path d="M22.5,10 C21.5,10 20.5,11 20.5,12 C20.5,13 21.5,14 22.5,14" fill="none" stroke="#fff" strokeWidth="0.8" />}
      </g>
    </svg>
  );
};

export const Knight: React.FC<PieceProps> = ({ color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';
  return (
    <svg viewBox="0 0 45 45" className={className} id={`knight-${color}`}>
      <defs>
        <linearGradient id={isWhite ? "knight-white-grad" : "knight-black-grad"} x1="0" y1="0" x2="0" y2="1">
          {isWhite ? (
            <>
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </>
          )}
        </linearGradient>
      </defs>
      <g
        fill={`url(#${isWhite ? "knight-white-grad" : "knight-black-grad"})`}
        stroke={isWhite ? "#475569" : "#1e293b"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M 22,10 C 22,10 19,11 16,15 C 13,19 13,23 13,23 C 13,23 14.5,21.5 17,21.5 C 17,21.5 15,24 15,28 C 15,32 18,33 18,33 C 18,33 19,29 23,29 C 27,29 28,31 29,31 C 30,31 31.5,29.5 31.5,28 C 31.5,26.5 30.5,24 29,22 C 27.5,20 27.5,15 27.5,15 C 27.5,15 30,12 28,9 C 26,6 22,10 22,10 z" />
        <path d="M 9.5,35.5 L 35.5,35.5 L 35.5,38.5 L 9.5,38.5 L 9.5,35.5 Z" />
        <circle cx="18" cy="15" r="1.5" fill={isWhite ? "#475569" : "#94a3b8"} stroke="none" />
      </g>
    </svg>
  );
};

export const Bishop: React.FC<PieceProps> = ({ color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';
  return (
    <svg viewBox="0 0 45 45" className={className} id={`bishop-${color}`}>
      <defs>
        <linearGradient id={isWhite ? "bishop-white-grad" : "bishop-black-grad"} x1="0" y1="0" x2="0" y2="1">
          {isWhite ? (
            <>
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </>
          )}
        </linearGradient>
      </defs>
      <g
        fill={`url(#${isWhite ? "bishop-white-grad" : "bishop-black-grad"})`}
        stroke={isWhite ? "#475569" : "#1e293b"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M 9,36 L 36,36 L 36,39 L 9,39 L 9,36 z" />
        <path d="M 15,36 L 15,33 C 15,28 17.5,25 22.5,18 C 27.5,25 30,28 30,33 L 30,36 L 15,36 z" />
        <path d="M 22.5,18 C 22.5,18 20,13 22.5,8 C 25,13 22.5,18 22.5,18 z" />
        {/* Mitre cross symbol */}
        <path d="M 22.5,11 L 22.5,15 M 20.5,13 L 24.5,13" fill="none" stroke={isWhite ? "#475569" : "#94a3b8"} strokeWidth="1.5" />
        {/* The Bishop Slit */}
        <path d="M 24,19.5 L 27.5,22.5" fill="none" stroke={isWhite ? "#475569" : "#94a3b8"} strokeWidth="1.5" />
      </g>
    </svg>
  );
};

export const Rook: React.FC<PieceProps> = ({ color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';
  return (
    <svg viewBox="0 0 45 45" className={className} id={`rook-${color}`}>
      <defs>
        <linearGradient id={isWhite ? "rook-white-grad" : "rook-black-grad"} x1="0" y1="0" x2="0" y2="1">
          {isWhite ? (
            <>
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </>
          )}
        </linearGradient>
      </defs>
      <g
        fill={`url(#${isWhite ? "rook-white-grad" : "rook-black-grad"})`}
        stroke={isWhite ? "#475569" : "#1e293b"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M 9,39 L 36,39 L 36,35 L 9,35 L 9,39 z" />
        <path d="M 12,35 L 33,35 L 30,16 L 15,16 L 12,35 z" />
        <path d="M 12,16 L 33,16 L 33,10 L 29,10 L 29,13 L 25,13 L 25,10 L 20,10 L 20,13 L 16,13 L 16,10 L 12,10 L 12,16 z" />
        <path d="M 14,30 L 31,30" fill="none" stroke={isWhite ? "#cbd5e1" : "#475569"} strokeWidth="1" />
      </g>
    </svg>
  );
};

export const Queen: React.FC<PieceProps> = ({ color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';
  return (
    <svg viewBox="0 0 45 45" className={className} id={`queen-${color}`}>
      <defs>
        <linearGradient id={isWhite ? "queen-white-grad" : "queen-black-grad"} x1="0" y1="0" x2="0" y2="1">
          {isWhite ? (
            <>
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </>
          )}
        </linearGradient>
      </defs>
      <g
        fill={`url(#${isWhite ? "queen-white-grad" : "queen-black-grad"})`}
        stroke={isWhite ? "#475569" : "#1e293b"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M 8,39 L 37,39 L 37,36 L 8,36 L 8,39 z" />
        <path d="M 11.5,36 C 11.5,36 9,21 22.5,12 C 36,21 33.5,36 33.5,36 L 11.5,36 z" />
        <path d="M 11,20 L 5,10 L 15,14 L 22.5,4 L 30,14 L 40,10 L 34,20" />
        {/* Visual Crown Pearls */}
        <circle cx="5" cy="10" r="1.5" />
        <circle cx="15" cy="14" r="1.5" />
        <circle cx="22.5" cy="4" r="1.5" />
        <circle cx="30" cy="14" r="1.5" />
        <circle cx="40" cy="10" r="1.5" />
      </g>
    </svg>
  );
};

export const King: React.FC<PieceProps> = ({ color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';
  return (
    <svg viewBox="0 0 45 45" className={className} id={`king-${color}`}>
      <defs>
        <linearGradient id={isWhite ? "king-white-grad" : "king-black-grad"} x1="0" y1="0" x2="0" y2="1">
          {isWhite ? (
            <>
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </>
          )}
        </linearGradient>
      </defs>
      <g
        fill={`url(#${isWhite ? "king-white-grad" : "king-black-grad"})`}
        stroke={isWhite ? "#475569" : "#1e293b"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M 8,39 L 37,39 L 37,36 L 8,36 L 8,39 z" />
        <path d="M 11.5,36 L 33.5,36 L 30,17 C 30,17 27.5,21 22.5,17 C 17.5,21 15,17 15,17 L 11.5,36 z" />
        {/* Crown structural arcs */}
        <path d="M 15,17 C 15,17 18.5,10 22.5,10 C 26.5,10 30,17 30,17" />
        {/* Cross on top of the Crown */}
        <path d="M 22.5,4 L 22.5,10 M 19.5,7 L 25.5,7" fill="none" strokeWidth="2" />
      </g>
    </svg>
  );
};

export const ChessPiece: React.FC<{ type: string; color: 'w' | 'b'; className?: string }> = ({ type, color, className }) => {
  switch (type.toLowerCase()) {
    case 'p': return <Pawn color={color} className={className} />;
    case 'n': return <Knight color={color} className={className} />;
    case 'b': return <Bishop color={color} className={className} />;
    case 'r': return <Rook color={color} className={className} />;
    case 'q': return <Queen color={color} className={className} />;
    case 'k': return <King color={color} className={className} />;
    default: return null;
  }
};
