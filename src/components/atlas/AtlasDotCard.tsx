import { format } from "date-fns";
import type { AtlasDot } from "@/hooks/useAtlas";
import { getDotColor } from "@/hooks/useAtlas";

interface AtlasDotCardProps {
  dot: AtlasDot;
  color: string;
  onTap: () => void;
  miniDotCount?: number;
}

export const AtlasDotCard = ({ dot, onTap, miniDotCount = 0 }: AtlasDotCardProps) => {
  const dotColor = getDotColor(dot);
  const hasDepth = miniDotCount > 0;

  return (
    <button
      onClick={onTap}
      className="w-full text-left p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-card transition-colors"
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-1 w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: dotColor }}
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{(dot as any).original_title || dot.title}</p>
          {(dot as any).original_title && dot.title !== (dot as any).original_title && (
            <p className="text-[11px] text-muted-foreground/70 mt-0.5 italic truncate">→ {dot.title}</p>
          )}
          {dot.short_description && !(dot as any).original_title && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{dot.short_description}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            {dot.dot_category && dot.dot_category !== "strength" && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${dotColor}20`, color: dotColor }}
              >
                {dot.dot_category === "shadow" ? "Shadow" : "Life Imprint"}
              </span>
            )}
            {dot.created_at && (
              <p className="text-[10px] text-muted-foreground/60">
                {format(new Date(dot.created_at), "MMM d, yyyy")}
              </p>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};
