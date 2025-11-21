const FutureSelfBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Radial gradient base */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, hsl(200 40% 25%), hsl(215 35% 12%))',
        }}
      />
      
      {/* Light rays */}
      <div className="absolute inset-0 opacity-30">
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 origin-left"
            style={{
              width: '50%',
              height: '2px',
              background: 'linear-gradient(to right, hsl(200 60% 50% / 0.3), transparent)',
              transform: `rotate(${i * 15}deg)`,
            }}
          />
        ))}
      </div>

      {/* Glow effect at center */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, hsl(200 80% 60%), transparent 70%)',
        }}
      />
    </div>
  );
};

export default FutureSelfBackground;
