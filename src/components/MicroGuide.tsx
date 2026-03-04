import { useState } from "react";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MicroGuideProps {
  guideKey: string;
  title: string;
  description: string;
  className?: string;
}

export const MicroGuide = ({ guideKey, title, description, className }: MicroGuideProps) => {
  const storageKey = `microguide_viewed_${guideKey}`;
  const [open, setOpen] = useState(false);
  const [viewed, setViewed] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  });

  const handleOpen = () => {
    setOpen(true);
    if (!viewed) {
      try {
        localStorage.setItem(storageKey, "1");
      } catch {}
      setViewed(true);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className={cn(
          "inline-flex items-center justify-center rounded-full p-0.5 transition-opacity hover:opacity-100",
          viewed ? "opacity-40" : "opacity-60 animate-pulse",
          className
        )}
        aria-label={`Learn about ${title}`}
      >
        <Info className="h-4 w-4 text-muted-foreground" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">{title}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed whitespace-pre-line">
              {description}
            </DialogDescription>
          </DialogHeader>
          <Button size="sm" className="w-full" onClick={() => setOpen(false)}>
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};
