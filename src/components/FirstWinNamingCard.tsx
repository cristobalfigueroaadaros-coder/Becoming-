import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Check, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";

interface FirstWinNamingCardProps {
  proposedName: string;
  description: string;
  onAccept: (name: string) => void;
  onKeepExploring: () => void;
}

export const FirstWinNamingCard = ({
  proposedName,
  description,
  onAccept,
  onKeepExploring,
}: FirstWinNamingCardProps) => {
  const [editedName, setEditedName] = useState(proposedName);
  const [celebrating, setCelebrating] = useState(false);

  const handleAccept = async () => {
    setCelebrating(true);
    
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8B5CF6', '#D946EF', '#F97316', '#10B981'],
    });

    // Small delay for celebration effect
    await new Promise(resolve => setTimeout(resolve, 800));
    
    onAccept(editedName);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="border-accent/30 bg-gradient-to-br from-accent/5 via-primary/5 to-background overflow-hidden">
        <CardContent className="pt-8 pb-6">
          <div className="text-center space-y-6">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <p className="text-muted-foreground italic text-sm leading-relaxed max-w-md mx-auto">
                "This feels like more than a thought. It feels like the beginning of something."
              </p>
              
              <p className="text-lg text-foreground">
                We're seeing it take shape as:
              </p>
            </motion.div>

            {/* Editable Name */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-4 bg-muted/30 rounded-xl border border-accent/20"
            >
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="text-center text-xl font-semibold border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Name your emerging idea..."
              />
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-muted-foreground max-w-md mx-auto"
            >
              {description}
            </motion.p>

            {/* Question */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-muted-foreground"
            >
              Does this feel right?
            </motion.p>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex gap-3 justify-center pt-2"
            >
              <Button
                variant="outline"
                onClick={onKeepExploring}
                disabled={celebrating}
                className="gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Keep exploring
              </Button>
              <Button
                onClick={handleAccept}
                disabled={celebrating || !editedName.trim()}
                className="gap-2 bg-gradient-to-r from-accent to-primary hover:opacity-90"
              >
                <Check className="w-4 h-4" />
                {celebrating ? "Celebrating..." : "Yes, this is it ✨"}
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};