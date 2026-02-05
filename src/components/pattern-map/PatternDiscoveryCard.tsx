import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Orbit, Check, ArrowRight, Pencil } from "lucide-react";
import confetti from "canvas-confetti";

interface PatternDiscoveryCardProps {
  proposedName: string;
  patternType: string;
  triggerContext: string;
  primaryEmotion: string;
  summary?: string;
  reframe?: string;
  onAccept: (name: string) => void;
  onKeepExploring: () => void;
}

const patternTypeLabels: Record<string, string> = {
  limiting_belief: "Limiting Belief",
  protection_mechanism: "Protection Pattern",
  relational_pattern: "Relational Pattern",
  self_sabotage: "Self-Sabotage",
  emotional_block: "Emotional Block",
  core_wound: "Core Wound",
  life_event: "Life Event",
};

export const PatternDiscoveryCard = ({
  proposedName,
  patternType,
  triggerContext,
  primaryEmotion,
  summary,
  reframe,
  onAccept,
  onKeepExploring,
}: PatternDiscoveryCardProps) => {
  const [editedName, setEditedName] = useState(proposedName);
  const [isEditing, setIsEditing] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const handleAccept = async () => {
    setCelebrating(true);
    
    // Gentle confetti for pattern discovery
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#6366F1', '#8B5CF6', '#A855F7', '#C084FC'],
    });

    await new Promise(resolve => setTimeout(resolve, 800));
    onAccept(editedName);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <Card className="max-w-lg w-full border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-background overflow-hidden shadow-2xl">
        <CardContent className="pt-8 pb-6">
          <div className="text-center space-y-6">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"
            >
              <Orbit className="w-8 h-8 text-white" />
            </motion.div>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <h3 className="text-xl font-semibold text-foreground">
                {patternType === 'life_event' 
                  ? 'A meaningful moment is taking shape.'
                  : 'A pattern is becoming clear.'}
              </h3>
              
              {summary && (
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {summary}
                </p>
              )}
              
              {reframe && (
                <p className="text-sm text-indigo-400 italic max-w-md mx-auto">
                  "{reframe}"
                </p>
              )}
            </motion.div>

            {/* Pattern Name */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-4 bg-muted/30 rounded-xl border border-indigo-500/20"
            >
              <p className="text-xs text-muted-foreground mb-2">Pattern Name</p>
              
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-center text-lg font-semibold border-indigo-500/30 bg-background/50"
                    autoFocus
                    onBlur={() => setIsEditing(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
                  />
                </div>
              ) : (
                <div 
                  className="flex items-center justify-center gap-2 cursor-pointer group"
                  onClick={() => setIsEditing(true)}
                >
                  <span className="text-xl font-semibold text-foreground">
                    {editedName}
                  </span>
                  <Pencil className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </motion.div>

            {/* Metadata */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap justify-center gap-2"
            >
              <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-400">
                {patternTypeLabels[patternType] || patternType}
              </Badge>
              {primaryEmotion && (
                <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                  {primaryEmotion}
                </Badge>
              )}
            </motion.div>

            {triggerContext && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="text-xs text-muted-foreground max-w-sm mx-auto"
              >
                Activates when: {triggerContext}
              </motion.p>
            )}

            {/* Compassionate message */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-sm text-muted-foreground max-w-md mx-auto"
            >
              Awareness is the first step toward transformation. 
              This pattern isn't your enemy — it was trying to protect you.
            </motion.p>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-3 justify-center pt-2"
            >
              <Button
                variant="outline"
                onClick={onKeepExploring}
                disabled={celebrating}
                className="gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Not yet
              </Button>
              <Button
                onClick={handleAccept}
                disabled={celebrating || !editedName.trim()}
                className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
              >
                <Check className="w-4 h-4" />
                {celebrating ? "Creating map..." : "Yes, that's it"}
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
