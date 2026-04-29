import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bookmark, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface KeywordHighlighterProps {
  children: React.ReactNode;
  sourceType: string;
  sourceId?: string;
}

interface SelectionPopup {
  x: number;
  y: number;
  text: string;
}

export const KeywordHighlighter = ({ children, sourceType, sourceId }: KeywordHighlighterProps) => {
  const [popup, setPopup] = useState<SelectionPopup | null>(null);
  const [saving, setSaving] = useState(false);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setPopup(null);
      return;
    }

    const text = selection.toString().trim();
    // Only show popup for selections between 3-50 characters
    if (text.length < 3 || text.length > 50) {
      setPopup(null);
      return;
    }

    // Get selection position
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    setPopup({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      text
    });
  }, []);

  const handleSaveKeyword = async () => {
    if (!popup) return;
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if keyword already exists
      const { data: existing } = await supabase
        .from("user_keywords")
        .select("id, frequency_count")
        .eq("user_id", user.id)
        .eq("keyword", popup.text.toLowerCase())
        .maybeSingle();

      if (existing) {
        // Update frequency count
        await supabase
          .from("user_keywords")
          .update({ 
            frequency_count: (existing.frequency_count || 1) + 1,
            last_seen_at: new Date().toISOString()
          })
          .eq("id", existing.id);
        toast.success(`"${popup.text}" tracked again!`);
      } else {
        // Insert new keyword
        await supabase.from("user_keywords").insert({
          user_id: user.id,
          keyword: popup.text.toLowerCase(),
          keyword_type: "concept",
          source: sourceType,
          source_id: sourceId || null,
          context: popup.text,
        });
        toast.success(`"${popup.text}" saved as keyword!`);
      }

      setPopup(null);
      window.getSelection()?.removeAllRanges();
    } catch (error: any) {
      console.error("Error saving keyword:", error);
      toast.error("Failed to save keyword");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onMouseUp={handleMouseUp} className="relative">
      {children}
      
      <AnimatePresence>
        {popup && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.9 }}
            className="fixed z-50"
            style={{
              left: popup.x,
              top: popup.y,
              transform: "translate(-50%, -100%)"
            }}
          >
            <div className="flex items-center gap-1 bg-popover border border-border rounded-lg shadow-lg p-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 gap-1 text-xs"
                onClick={handleSaveKeyword}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Bookmark className="w-3 h-3" />
                )}
                Save keyword
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => {
                  setPopup(null);
                  window.getSelection()?.removeAllRanges();
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Component to display saved keywords as badges
interface KeywordBadgesProps {
  keywords: Array<{ keyword: string; frequency_count: number; source: string }>;
  onKeywordClick?: (keyword: string) => void;
}

export const KeywordBadges = ({ keywords, onKeywordClick }: KeywordBadgesProps) => {
  if (keywords.length === 0) return null;

  const getSourceColor = (source: string) => {
    switch (source) {
      case "mentor_chat": return "bg-primary/20 text-primary border-primary/30";
      case "user_highlighted": return "bg-accent/20 text-accent-foreground border-accent/30";
      case "ai_detected": return "bg-secondary/20 text-secondary-foreground border-secondary/30";
      case "council": return "bg-violet-500/20 text-violet-700 border-violet-500/30";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {keywords.map((kw, i) => (
        <Badge
          key={`${kw.keyword}-${i}`}
          variant="outline"
          className={`cursor-pointer hover:scale-105 transition-transform ${getSourceColor(kw.source)}`}
          onClick={() => onKeywordClick?.(kw.keyword)}
        >
          {kw.keyword}
          {kw.frequency_count > 1 && (
            <span className="ml-1 text-[10px] opacity-70">×{kw.frequency_count}</span>
          )}
        </Badge>
      ))}
    </div>
  );
};