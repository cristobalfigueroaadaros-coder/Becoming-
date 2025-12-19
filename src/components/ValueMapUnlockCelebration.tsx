import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Check, X, Edit3, MapPin } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface ValueMapDetection {
  blockKey: string;
  blockTitle: string;
  blockDescription: string;
  suggestedContent: string;
  confidence: number;
  reasoning: string;
  source: string;
  mentorType?: string;
}

interface ValueMapUnlockCelebrationProps {
  detection: ValueMapDetection;
  onAccept: (blockKey: string, content: string) => Promise<void>;
  onDismiss: () => void;
}

export function ValueMapUnlockCelebration({ 
  detection, 
  onAccept, 
  onDismiss 
}: ValueMapUnlockCelebrationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(detection.suggestedContent);
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept(detection.blockKey, isEditing ? editedContent : detection.suggestedContent);
      
      // Celebration confetti!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#8B5CF6', '#EC4899', '#06B6D4'],
      });
      
      toast.success(`"${detection.blockTitle}" unlocked in your Value Map!`, {
        description: "Your purpose is becoming clearer.",
        duration: 4000,
      });
    } catch (error) {
      console.error("Error accepting detection:", error);
      toast.error("Failed to save to Value Map");
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
      >
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-background to-accent/10 shadow-xl backdrop-blur-sm overflow-hidden">
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
          
          <CardContent className="pt-4 pb-3 relative">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium text-primary">Value Map Discovery</span>
                </div>
                <h3 className="font-semibold text-foreground mt-0.5 truncate">
                  {detection.blockTitle}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {detection.blockDescription}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 -mr-1 -mt-1"
                onClick={onDismiss}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            {isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[80px] text-sm bg-background/50 border-primary/20"
                placeholder="Edit the content..."
              />
            ) : (
              <div className="bg-background/50 rounded-lg p-3 border border-primary/10">
                <p className="text-sm text-foreground leading-relaxed">
                  "{detection.suggestedContent}"
                </p>
              </div>
            )}

            {/* Confidence indicator */}
            <div className="flex items-center gap-2 mt-2 mb-3">
              <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${detection.confidence * 100}%` }}
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  transition={{ delay: 0.3, duration: 0.5 }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {Math.round(detection.confidence * 100)}% match
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleAccept}
                disabled={isAccepting}
                className="flex-1 gap-2"
                size="sm"
              >
                <Check className="w-4 h-4" />
                {isAccepting ? "Saving..." : "Accept"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="gap-2"
              >
                <Edit3 className="w-4 h-4" />
                {isEditing ? "Preview" : "Edit"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
              >
                Not quite
              </Button>
            </div>

            {/* Source attribution */}
            {detection.mentorType && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Discovered through conversation with {detection.mentorType.replace(/_/g, ' ')}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
