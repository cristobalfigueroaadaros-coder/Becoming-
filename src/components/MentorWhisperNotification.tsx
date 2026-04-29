import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { HighlightedText } from "@/components/HighlightedText";

interface FutureSelfWhisperNotificationProps {
  whisper: {
    id: string;
    mentor_type: string;
    message: string;
    whisper_type?: string;
  };
  onDismiss: () => void;
  onReply: () => void;
}

// Future Self exclusive styling - rose/pink gradient for distinctiveness
const futureSelfColor = "from-[hsl(var(--future-self))]/20 to-[hsl(var(--future-self-light))]/20 border-[hsl(var(--future-self))]/30";

const whisperTypeIcons: Record<string, string> = {
  encouragement: "💫",
  challenge: "🔥",
  reminder: "🔔",
  deep_question: "🌀",
  nurturing: "💝",
  celebration: "🎉",
  pattern_interruption: "⚡",
};

// Renamed to clarify this is exclusively for Future Self
export function MentorWhisperNotification({ whisper, onDismiss, onReply }: FutureSelfWhisperNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const handleReply = () => {
    onReply();
    // Always navigate to future_self chat
    navigate("/chat/future_self");
  };

  const whisperIcon = whisperTypeIcons[whisper.whisper_type || "encouragement"] || "✨";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-4 right-4 z-50 max-w-sm"
        >
          <Card className={cn(
            "p-4 shadow-2xl backdrop-blur-lg bg-gradient-to-br border-2",
            futureSelfColor
          )}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-lg">
                  {whisperIcon}
                </div>
                <div>
                  <p className="font-semibold text-sm text-[hsl(var(--future-self))]">
                    Your Future Self
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    Private Whisper
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-background/50"
                onClick={handleDismiss}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Message */}
            <div className="mb-4">
              <HighlightedText text={whisper.message} className="text-sm leading-relaxed" />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={handleDismiss}
              >
                Later
              </Button>
              <Button
                size="sm"
                className="flex-1 gap-1"
                onClick={handleReply}
              >
                Reply
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </Card>

          {/* Glow effect */}
          <motion.div
            className="absolute -inset-1 -z-10 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 blur-xl"
            animate={{
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
