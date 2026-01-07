import { User, Rocket } from "lucide-react";
import { motion } from "framer-motion";

interface YinYangCoreProps {
  userName?: string;
  projectName?: string;
  size?: number;
}

export const YinYangCore = ({ 
  userName = "You", 
  projectName = "Your Journey",
  size = 200 
}: YinYangCoreProps) => {
  const halfSize = size / 2;
  const fontSize = Math.max(10, size / 16);
  const questionFontSize = Math.max(8, size / 22);
  
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative"
      style={{ width: size, height: size }}
    >
      {/* Glow effect */}
      <div 
        className="absolute inset-0 rounded-full blur-xl opacity-40"
        style={{
          background: "linear-gradient(135deg, hsl(270 75% 60%) 0%, hsl(45 90% 60%) 100%)"
        }}
      />
      
      {/* Main Yin-Yang SVG */}
      <svg
        viewBox="0 0 100 100"
        className="relative z-10"
        style={{ width: size, height: size }}
      >
        <defs>
          {/* Becoming gradient (violet/purple) */}
          <linearGradient id="becomingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(280, 75%, 55%)" />
            <stop offset="100%" stopColor="hsl(260, 70%, 45%)" />
          </linearGradient>
          
          {/* Creating gradient (amber/gold) */}
          <linearGradient id="creatingGradient" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(45, 90%, 55%)" />
            <stop offset="100%" stopColor="hsl(35, 85%, 45%)" />
          </linearGradient>
          
          {/* Drop shadow */}
          <filter id="coreGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="0" dy="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Background circle */}
        <circle cx="50" cy="50" r="48" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="0.5" filter="url(#coreGlow)" />
        
        {/* Becoming half (top-left, violet) - Yin shape */}
        <path
          d="M 50 2
             A 48 48 0 0 0 50 98
             A 24 24 0 0 0 50 50
             A 24 24 0 0 1 50 2"
          fill="url(#becomingGradient)"
        />
        
        {/* Creating half (bottom-right, amber) - Yang shape */}
        <path
          d="M 50 2
             A 48 48 0 0 1 50 98
             A 24 24 0 0 1 50 50
             A 24 24 0 0 0 50 2"
          fill="url(#creatingGradient)"
        />
        
        {/* Dividing line - subtle curve */}
        <path
          d="M 50 2
             A 24 24 0 0 1 50 50
             A 24 24 0 0 0 50 98"
          fill="none"
          stroke="hsl(var(--background))"
          strokeWidth="1"
          opacity="0.5"
        />
      </svg>
      
      {/* Center content overlay */}
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none"
        style={{ padding: size * 0.15 }}
      >
        {/* User name */}
        <span 
          className="font-bold text-foreground text-center leading-tight"
          style={{ fontSize: fontSize + 2 }}
        >
          {userName}
        </span>
        
        {/* Project name */}
        <span 
          className="text-muted-foreground text-center leading-tight mt-0.5"
          style={{ fontSize: fontSize - 1 }}
        >
          {projectName}
        </span>
      </div>
      
      {/* Becoming question (top-left) */}
      <div 
        className="absolute z-20 text-center max-w-[80px] pointer-events-none"
        style={{ 
          top: size * 0.08, 
          left: size * 0.05,
          fontSize: questionFontSize
        }}
      >
        <User className="w-3 h-3 mx-auto mb-0.5 text-violet-400" />
        <span className="text-violet-300 italic leading-tight block">
          Who am I becoming?
        </span>
      </div>
      
      {/* Creating question (bottom-right) */}
      <div 
        className="absolute z-20 text-center max-w-[80px] pointer-events-none"
        style={{ 
          bottom: size * 0.08, 
          right: size * 0.05,
          fontSize: questionFontSize
        }}
      >
        <Rocket className="w-3 h-3 mx-auto mb-0.5 text-amber-400" />
        <span className="text-amber-300 italic leading-tight block">
          What am I creating?
        </span>
      </div>
      
      {/* Subtle pulse animation */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-primary/20"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.3, 0.1, 0.3]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
};
