import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, X } from "lucide-react";

interface MentorSuggestionCardProps {
  mentorType: string;
  mentorName: string;
  suggestionMessage: string;
  onAccept: () => void;
  onDismiss: () => void;
}

export const MentorSuggestionCard = ({
  mentorType,
  mentorName,
  suggestionMessage,
  onAccept,
  onDismiss,
}: MentorSuggestionCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="border-2 border-accent/40 bg-gradient-to-br from-accent/10 via-primary/5 to-background overflow-hidden">
        <CardContent className="pt-6 pb-5">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-accent">The Council Suggests</p>
                <p className="text-foreground mt-1 leading-relaxed">
                  {suggestionMessage}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={onDismiss}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Mentor Preview */}
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-sm font-medium">{mentorName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Continue shaping your idea in a focused 1-to-1 conversation
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onDismiss}
                className="flex-1"
              >
                Stay with Council
              </Button>
              <Button
                onClick={onAccept}
                className="flex-1 gap-2 bg-gradient-to-r from-accent to-primary hover:opacity-90"
              >
                Yes, let's go
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
