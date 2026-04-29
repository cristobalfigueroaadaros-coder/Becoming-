const FutureSelfBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Bright gradient base */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at top, hsl(200 70% 97%), hsl(210 60% 92%))',
        }}
      />
      
      {/* Subtle light rays */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 origin-left"
            style={{
              width: '50%',
              height: '2px',
              background: 'linear-gradient(to right, hsl(200 70% 70% / 0.4), transparent)',
              transform: `rotate(${i * 15}deg)`,
            }}
          />
        ))}
      </div>

      {/* Soft glow effect at center */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, hsl(200 90% 85%), transparent 60%)',
        }}
      />

      {/* Ambient sparkle effects */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/30 animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default FutureSelfBackground;
