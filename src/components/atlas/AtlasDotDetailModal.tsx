import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { AtlasDot } from "@/hooks/useAtlas";

interface AtlasDotDetailModalProps {
  dot: AtlasDot | null;
  clusterName?: string;
  color: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AtlasDotDetailModal = ({ dot, clusterName, color, open, onOpenChange }: AtlasDotDetailModalProps) => {
  if (!dot) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <DialogTitle className="text-base">{dot.title}</DialogTitle>
          </div>
          {clusterName && (
            <DialogDescription className="text-xs">From: {clusterName}</DialogDescription>
          )}
        </DialogHeader>

        {dot.short_description && (
          <p className="text-sm text-muted-foreground">{dot.short_description}</p>
        )}

        {dot.created_at && (
          <p className="text-xs text-muted-foreground/70">
            Discovered {format(new Date(dot.created_at), "MMMM d, yyyy")}
          </p>
        )}

        {dot.dot_type && (
          <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {dot.dot_type}
          </span>
        )}
      </DialogContent>
    </Dialog>
  );
};
