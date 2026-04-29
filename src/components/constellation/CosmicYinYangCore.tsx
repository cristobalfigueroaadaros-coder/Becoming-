import { motion } from "framer-motion";

interface CosmicYinYangCoreProps {
  userName?: string;
  size?: number;
}

export const CosmicYinYangCore = ({ 
  userName = "You", 
  size = 180 
}: CosmicYinYangCoreProps) => {
  const fontSize = Math.max(10, size / 14);
  
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative"
      style={{ width: size, height: size }}
    >
      {/* Outer glow */}
      <div 
        className="absolute inset-0 rounded-full blur-xl opacity-50"
        style={{
          background: "radial-gradient(circle, hsl(270 70% 50% / 0.4) 0%, hsl(45 90% 55% / 0.3) 50%, transparent 70%)"
        }}
      />
      
      {/* Cosmic Yin-Yang SVG */}
      <svg
        viewBox="0 0 100 100"
        className="relative z-10"
        style={{ width: size, height: size }}
      >
        <defs>
          {/* Cosmic/starry gradient for the dark half */}
          <pattern id="cosmicPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="hsl(260 40% 15%)" />
            <circle cx="2" cy="3" r="0.5" fill="white" opacity="0.8" />
            <circle cx="8" cy="12" r="0.3" fill="white" opacity="0.6" />
            <circle cx="15" cy="5" r="0.4" fill="white" opacity="0.7" />
            <circle cx="18" cy="15" r="0.3" fill="white" opacity="0.5" />
            <circle cx="10" cy="18" r="0.5" fill="white" opacity="0.6" />
            <circle cx="5" cy="8" r="0.2" fill="white" opacity="0.4" />
          </pattern>
          
          {/* Dark cosmic half (Becoming) */}
          <linearGradient id="cosmicDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(260 50% 20%)" />
            <stop offset="100%" stopColor="hsl(270 40% 12%)" />
          </linearGradient>
          
          {/* Light half (My Journey) */}
          <linearGradient id="cosmicLight" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(45 80% 90%)" />
            <stop offset="50%" stopColor="hsl(40 70% 85%)" />
            <stop offset="100%" stopColor="hsl(35 60% 80%)" />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id="coreGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="0" dy="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.4" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Background circle with gradient border */}
        <circle 
          cx="50" cy="50" r="48" 
          fill="none" 
          stroke="url(#cosmicLight)" 
          strokeWidth="1" 
          opacity="0.5"
        />
        
        {/* Light half (My Journey) - Yin shape */}
        <path
          d="M 50 2
             A 48 48 0 0 0 50 98
             A 24 24 0 0 0 50 50
             A 24 24 0 0 1 50 2"
          fill="url(#cosmicLight)"
          filter="url(#coreGlow)"
        />
        
        {/* Dark cosmic half (Who I'm Becoming) - Yang shape */}
        <path
          d="M 50 2
             A 48 48 0 0 1 50 98
             A 24 24 0 0 1 50 50
             A 24 24 0 0 0 50 2"
          fill="url(#cosmicDark)"
          filter="url(#coreGlow)"
        />
        
        {/* Star overlay on dark half */}
        <clipPath id="darkHalfClip">
          <path
            d="M 50 2
               A 48 48 0 0 1 50 98
               A 24 24 0 0 1 50 50
               A 24 24 0 0 0 50 2"
          />
        </clipPath>
        <rect x="0" y="0" width="100" height="100" fill="url(#cosmicPattern)" clipPath="url(#darkHalfClip)" opacity="0.6" />
        
        {/* Small yang dot (light in dark) */}
        <circle cx="50" cy="26" r="6" fill="url(#cosmicLight)" />
        
        {/* Small yin dot (dark in light) */}
        <circle cx="50" cy="74" r="6" fill="url(#cosmicDark)" />
        
        {/* Dividing line */}
        <path
          d="M 50 2
             A 24 24 0 0 1 50 50
             A 24 24 0 0 0 50 98"
          fill="none"
          stroke="hsl(var(--background))"
          strokeWidth="0.5"
          opacity="0.3"
        />
      </svg>
      
      {/* Center content overlay */}
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none"
      >
        {/* "My Journey" label (top - light side) */}
        <div 
          className="absolute text-center"
          style={{ 
            top: size * 0.18,
            fontSize: fontSize * 0.7,
          }}
        >
          <span className="font-medium text-amber-900/70">My Journey</span>
        </div>
        
        {/* User name (center) */}
        <span 
          className="font-bold text-foreground"
          style={{ fontSize: fontSize + 2 }}
        >
          {userName}
        </span>
        
        {/* "Who I'm Becoming" label (bottom - dark side) */}
        <div 
          className="absolute text-center"
          style={{ 
            bottom: size * 0.18,
            fontSize: fontSize * 0.7,
          }}
        >
          <span className="font-medium text-violet-200/80">Who I'm Becoming</span>
        </div>
      </div>
      
      {/* Orbital ring animation */}
      <motion.div
        className="absolute inset-0 rounded-full border border-primary/20"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.1, 0.3]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
};
