import { Badge } from "@/components/ui/badge";

interface QuestsCardProps {
  showNotification?: boolean;
}

const QuestsCard = ({ showNotification = false }: QuestsCardProps) => {
  return (
    <div className="relative flex items-center justify-center gap-8 h-full min-h-[200px]">
      {/* Notification badge */}
      {showNotification && (
        <Badge className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold p-0 animate-pulse">
          1
        </Badge>
      )}
      
      {/* Scroll */}
      <svg viewBox="0 0 60 80" className="w-16">
        <rect x="10" y="15" width="40" height="50" rx="3" fill="hsl(40 50% 85%)" stroke="hsl(40 40% 60%)" strokeWidth="2" />
        <line x1="18" y1="28" x2="42" y2="28" stroke="hsl(0 0% 30%)" strokeWidth="1.5" />
        <line x1="18" y1="35" x2="42" y2="35" stroke="hsl(0 0% 30%)" strokeWidth="1.5" />
        <line x1="18" y1="42" x2="42" y2="42" stroke="hsl(0 0% 30%)" strokeWidth="1.5" />
        <line x1="18" y1="49" x2="35" y2="49" stroke="hsl(0 0% 30%)" strokeWidth="1.5" />
        
        {/* Scroll curls */}
        <path d="M 10 15 Q 8 12 10 10 Q 12 12 10 15" fill="hsl(40 50% 75%)" />
        <path d="M 50 15 Q 52 12 50 10 Q 48 12 50 15" fill="hsl(40 50% 75%)" />
      </svg>

      {/* Mountain */}
      <svg viewBox="0 0 80 80" className="w-20">
        {/* Mountain peak */}
        <path
          d="M 20 65 L 40 25 L 60 65 Z"
          fill="hsl(200 30% 35%)"
          stroke="hsl(200 40% 25%)"
          strokeWidth="2"
        />
        
        {/* Snow cap */}
        <path
          d="M 35 37 L 40 25 L 45 37 Z"
          fill="white"
          opacity="0.9"
        />
        
        {/* Flag */}
        <line x1="40" y1="25" x2="40" y2="15" stroke="hsl(0 70% 50%)" strokeWidth="2" />
        <path
          d="M 40 15 L 50 18 L 40 21"
          fill="hsl(0 70% 50%)"
        />
      </svg>
    </div>
  );
};

export default QuestsCard;
