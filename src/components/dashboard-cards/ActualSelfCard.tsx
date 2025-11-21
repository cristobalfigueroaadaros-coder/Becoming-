const ActualSelfCard = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[280px]">
      <svg viewBox="0 0 200 240" className="w-full max-w-[180px]">
        {/* Head */}
        <circle cx="100" cy="50" r="25" fill="hsl(30 50% 65%)" />
        
        {/* Hair */}
        <path
          d="M 75 45 Q 75 25 100 25 Q 125 25 125 45"
          fill="hsl(0 0% 20%)"
        />
        
        {/* Eyes (closed) */}
        <line x1="88" y1="48" x2="96" y2="48" stroke="hsl(0 0% 20%)" strokeWidth="2" strokeLinecap="round" />
        <line x1="104" y1="48" x2="112" y2="48" stroke="hsl(0 0% 20%)" strokeWidth="2" strokeLinecap="round" />
        
        {/* Smile */}
        <path
          d="M 88 58 Q 100 62 112 58"
          fill="none"
          stroke="hsl(0 0% 20%)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Torso (teal shirt) */}
        <path
          d="M 75 75 L 75 140 Q 75 150 85 150 L 115 150 Q 125 150 125 140 L 125 75"
          fill="hsl(180 50% 40%)"
        />

        {/* Arms */}
        <path
          d="M 75 90 Q 50 110 40 140"
          stroke="hsl(30 50% 65%)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 125 90 Q 150 110 160 140"
          stroke="hsl(30 50% 65%)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
        />

        {/* Meditation hands */}
        <circle cx="40" cy="140" r="8" fill="hsl(30 50% 65%)" />
        <circle cx="160" cy="140" r="8" fill="hsl(30 50% 65%)" />

        {/* Legs (cross-legged) */}
        <ellipse cx="100" cy="180" rx="60" ry="30" fill="hsl(200 30% 25%)" />
      </svg>
    </div>
  );
};

export default ActualSelfCard;
