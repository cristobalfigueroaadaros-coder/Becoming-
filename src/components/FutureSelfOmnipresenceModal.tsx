import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import { motion } from "framer-motion";

interface FutureSelfMessage {
  message: string;
  triggerReason: string;
  emotionalTone: string;
  timestamp: string;
}

interface FutureSelfOmnipresenceModalProps {
  message: FutureSelfMessage | null;
  onDismiss: () => void;
}

const triggerReasonLabels: Record<string, string> = {
  low_energy: "I sense your energy dipping",
  breakthrough: "This is a breakthrough moment",
  high_coherence: "You're in perfect alignment",
  flow_state: "You've entered flow",
  energy_decline: "I feel you losing momentum",
  expansion: "You're expanding beautifully",
  manual_request: "You called, I'm here",
};

export function FutureSelfOmnipresenceModal({ message, onDismiss }: FutureSelfOmnipresenceModalProps) {
  if (!message) return null;

  return (
    <Dialog open={!!message} onOpenChange={onDismiss}>
      <DialogContent className="max-w-2xl border-2 border-primary/30 bg-gradient-to-br from-card via-card/95 to-primary/5 backdrop-blur">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
        
        <DialogHeader className="relative">
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
            >
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            <div className="flex-1">
              <DialogTitle className="text-2xl bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Future Self
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {triggerReasonLabels[message.triggerReason] || "A message for you"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="absolute top-0 right-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative space-y-6 pt-4"
        >
          {/* Message */}
          <div className="prose prose-sm max-w-none">
            <p className="text-lg leading-relaxed text-foreground whitespace-pre-line">
              {message.message}
            </p>
          </div>

          {/* Energetic indicator */}
          <div className="flex items-center gap-2 pt-4 border-t border-border/50">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="w-2 h-8 rounded-full bg-gradient-to-t from-primary/20 to-accent"
                  style={{
                    height: `${20 + i * 4}px`,
                    opacity: 0.4 + i * 0.12,
                  }}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground flex-1">
              Vibrational signature: <span className="text-accent font-medium capitalize">{message.emotionalTone}</span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onDismiss}
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              I receive this
            </Button>
            <Button
              onClick={onDismiss}
              variant="outline"
            >
              Not now
            </Button>
          </div>
        </motion.div>

        {/* Animated background particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-accent/30"
              initial={{
                x: Math.random() * 100 + "%",
                y: Math.random() * 100 + "%",
                scale: 0,
              }}
              animate={{
                y: [null, "-20%", "120%"],
                scale: [0, 1, 0],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
