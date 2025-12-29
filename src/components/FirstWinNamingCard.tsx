import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Check, ArrowRight, RefreshCw, GitMerge } from "lucide-react";
import confetti from "canvas-confetti";

export type CoherenceType = 'NEW_CORE_PROJECT' | 'BRANCH_ADDITION' | 'CORE_EVOLUTION' | 'INSIGHT_ONLY';

interface FirstWinNamingCardProps {
  proposedName: string;
  description: string;
  onAccept: (name: string) => void;
  onKeepExploring: () => void;
  // PDR v2.1: Evolution support
  isEvolution?: boolean;
  previousNodeTitle?: string | null;
  evolutionInsight?: string | null;
  // PDR v2.2: Coherence type for context-aware copy
  coherenceType?: CoherenceType;
  coreTheme?: string | null;
}

const copyVariants: Record<CoherenceType, {
  icon: React.ReactNode;
  header: string;
  subheader: string;
  acceptButton: string;
  dismissButton: string;
  gradient: string;
}> = {
  NEW_CORE_PROJECT: {
    icon: <Sparkles className="w-8 h-8 text-white" />,
    header: "This is becoming more than an idea.",
    subheader: "We're seeing something real take shape.",
    acceptButton: "Yes, let's build this",
    dismissButton: "Not yet, keep shaping",
    gradient: "from-accent to-primary",
  },
  BRANCH_ADDITION: {
    icon: <GitMerge className="w-8 h-8 text-white" />,
    header: "Your project is growing.",
    subheader: "This complements your core focus.",
    acceptButton: "Add to my project",
    dismissButton: "Keep as insight only",
    gradient: "from-green-500 to-emerald-600",
  },
  CORE_EVOLUTION: {
    icon: <RefreshCw className="w-8 h-8 text-white" />,
    header: "Your vision is refocusing.",
    subheader: "Your project is evolving into something clearer.",
    acceptButton: "Refocus my project",
    dismissButton: "Keep current direction",
    gradient: "from-amber-500 to-orange-600",
  },
  INSIGHT_ONLY: {
    icon: <Sparkles className="w-8 h-8 text-white" />,
    header: "This is becoming more than an idea.",
    subheader: "We're seeing something real take shape.",
    acceptButton: "Yes, let's build this",
    dismissButton: "Not yet, keep shaping",
    gradient: "from-accent to-primary",
  },
};

export const FirstWinNamingCard = ({
  proposedName,
  description,
  onAccept,
  onKeepExploring,
  isEvolution = false,
  previousNodeTitle = null,
  evolutionInsight = null,
  coherenceType = 'NEW_CORE_PROJECT',
  coreTheme = null,
}: FirstWinNamingCardProps) => {
  const [editedName, setEditedName] = useState(proposedName);
  const [celebrating, setCelebrating] = useState(false);

  // Determine the right copy based on coherenceType or isEvolution flag
  const effectiveType: CoherenceType = isEvolution ? 'CORE_EVOLUTION' : coherenceType;
  const copy = copyVariants[effectiveType];

  const handleAccept = async () => {
    setCelebrating(true);
    
    // Only show confetti for new core projects
    if (effectiveType === 'NEW_CORE_PROJECT') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#D946EF', '#F97316', '#10B981'],
      });
    } else {
      // Smaller celebration for evolutions and branches
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
        colors: effectiveType === 'BRANCH_ADDITION' 
          ? ['#22C55E', '#10B981', '#34D399'] 
          : ['#F59E0B', '#F97316', '#FBBF24'],
      });
    }

    await new Promise(resolve => setTimeout(resolve, 800));
    onAccept(editedName);
  };

  // Custom subheader based on context
  const getSubheader = () => {
    if (isEvolution && previousNodeTitle) {
      return `This builds on your work with "${previousNodeTitle}".`;
    }
    if (effectiveType === 'BRANCH_ADDITION' && coreTheme) {
      return `This complements your focus on "${coreTheme}".`;
    }
    return copy.subheader;
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
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${copy.gradient} flex items-center justify-center`}
            >
              {copy.icon}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <h3 className="text-xl font-semibold text-foreground">
                {copy.header}
              </h3>
              
              <p className="text-muted-foreground">
                {getSubheader()}
              </p>
              
              {evolutionInsight && (
                <p className="text-sm text-accent italic">{evolutionInsight}</p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-4 bg-muted/30 rounded-xl border border-accent/20"
            >
              <p className="text-xs text-muted-foreground mb-2">
                {effectiveType === 'BRANCH_ADDITION' ? 'Branch Name' : 'Project Name'}
              </p>
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="text-center text-xl font-semibold border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Name your project..."
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-muted-foreground max-w-md mx-auto"
            >
              {description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex gap-3 justify-center pt-2"
            >
              <Button
                variant="outline"
                onClick={onKeepExploring}
                disabled={celebrating}
                className="gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                {copy.dismissButton}
              </Button>
              <Button
                onClick={handleAccept}
                disabled={celebrating || !editedName.trim()}
                className={`gap-2 bg-gradient-to-r ${copy.gradient} hover:opacity-90`}
              >
                <Check className="w-4 h-4" />
                {celebrating ? "Celebrating..." : copy.acceptButton}
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
