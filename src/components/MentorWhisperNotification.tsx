import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MentorWhisperNotificationProps {
  whisper: {
    id: string;
    mentor_type: string;
    message: string;
    whisper_type?: string;
  };
  onDismiss: () => void;
  onReply: () => void;
}

const mentorNames: Record<string, string> = {
  mamba_mentor: "Mamba Mentor",
  creative_visionary: "Creative Visionary",
  quantum_inventor: "Quantum Inventor",
  ancient_sage: "Ancient Sage",
  compassionate_elder: "Compassionate Elder",
  future_self: "Future Self",
  business_mentor: "Business Mentor",
  creator_mentor: "Creator Mentor",
  mystic_mentor: "Mystic Mentor",
  heart_mentor: "Heart Mentor",
  strategist_mentor: "Strategist Mentor",
  explorer_mentor: "Explorer Mentor",
  discipline_mentor: "Discipline Mentor",
  alignment_mentor: "Alignment Mentor",
  oracle_mother: "Oracle Mother",
};

const mentorColors: Record<string, string> = {
  mamba_mentor: "from-amber-500/20 to-orange-500/20 border-amber-500/30",
  creative_visionary: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
  quantum_inventor: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
  ancient_sage: "from-green-500/20 to-emerald-500/20 border-green-500/30",
  compassionate_elder: "from-rose-500/20 to-pink-500/20 border-rose-500/30",
  future_self: "from-violet-500/20 to-purple-500/20 border-violet-500/30",
  business_mentor: "from-slate-500/20 to-gray-500/20 border-slate-500/30",
  creator_mentor: "from-fuchsia-500/20 to-purple-500/20 border-fuchsia-500/30",
  mystic_mentor: "from-indigo-500/20 to-violet-500/20 border-indigo-500/30",
  heart_mentor: "from-red-500/20 to-rose-500/20 border-red-500/30",
  strategist_mentor: "from-teal-500/20 to-cyan-500/20 border-teal-500/30",
  explorer_mentor: "from-yellow-500/20 to-amber-500/20 border-yellow-500/30",
  discipline_mentor: "from-gray-500/20 to-slate-500/20 border-gray-500/30",
  alignment_mentor: "from-sky-500/20 to-blue-500/20 border-sky-500/30",
  oracle_mother: "from-violet-500/20 to-indigo-500/20 border-violet-500/30",
};

const whisperTypeIcons: Record<string, string> = {
  encouragement: "💫",
  challenge: "🔥",
  reminder: "🔔",
  deep_question: "🌀",
  nurturing: "💝",
  celebration: "🎉",
  pattern_interruption: "⚡",
};

export function MentorWhisperNotification({ whisper, onDismiss, onReply }: MentorWhisperNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const handleReply = () => {
    onReply();
    navigate(`/chat/${whisper.mentor_type}`);
  };

  const mentorColor = mentorColors[whisper.mentor_type] || "from-primary/20 to-accent/20 border-primary/30";
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
            mentorColor
          )}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-lg">
                  {whisperIcon}
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {mentorNames[whisper.mentor_type] || "Mentor"}
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
              <p className="text-sm leading-relaxed">
                {whisper.message}
              </p>
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
