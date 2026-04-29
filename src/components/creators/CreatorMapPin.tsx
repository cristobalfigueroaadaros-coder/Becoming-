import { cn } from "@/lib/utils";

interface CreatorMapPinProps {
  x: number;
  y: number;
  color: string;
  isActive: boolean;
  count?: number;
  onClick: () => void;
}

export const CreatorMapPin = ({ x, y, color, isActive, count, onClick }: CreatorMapPinProps) => {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {count && count > 1 ? (
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-background text-primary-foreground transition-transform",
          isActive && "scale-125"
        )} style={{ background: color }}>
          {count}
        </div>
      ) : (
        <>
          <div
            className={cn(
              "w-3 h-3 rounded-full border-2 border-background transition-transform shadow-md",
              isActive && "scale-150"
            )}
            style={{ background: color }}
          />
          <div
            className="absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-30"
            style={{ background: color }}
          />
        </>
      )}
    </button>
  );
};
