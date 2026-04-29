import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, MessageCircle, Gift, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FirstWinPathSelectorProps {
  onSelectPath: (path: "create_share" | "test_idea" | "offer_something") => void;
  onCancel?: () => void;
}

const paths = [
  {
    id: "create_share" as const,
    title: "Create & Share",
    description: "Create something small and share it publicly or semi-publicly",
    examples: ["A post about what you're learning", "A voice note sharing an insight", "A sketch of your idea"],
    icon: Share2,
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
  {
    id: "test_idea" as const,
    title: "Test an Idea",
    description: "Talk to real people to validate a pain, curiosity, or concept",
    examples: ["Message 3 people about your idea", "Ask someone if they'd pay for this", "Run a quick survey"],
    icon: MessageCircle,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  {
    id: "offer_something" as const,
    title: "Offer Something",
    description: "Offer a small service, session, or insight for feedback or money",
    examples: ["A free 15-min consultation", "A mini-workshop for friends", "A beta version of your offer"],
    icon: Gift,
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
  },
];

export const FirstWinPathSelector = ({ onSelectPath, onCancel }: FirstWinPathSelectorProps) => {
  const [selectedPath, setSelectedPath] = useState<typeof paths[0]["id"] | null>(null);
  const [confirming, setConfirming] = useState(false);

  const handleSelect = (pathId: typeof paths[0]["id"]) => {
    setSelectedPath(pathId);
  };

  const handleConfirm = () => {
    if (!selectedPath) return;
    setConfirming(true);
    // Small delay for animation
    setTimeout(() => {
      onSelectPath(selectedPath);
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-4xl space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center gap-2"
          >
            <Sparkles className="w-8 h-8 text-primary" />
          </motion.div>
          <motion.h1
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-4xl font-bold"
          >
            Choose Your First Win Path
          </motion.h1>
          <motion.p
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Clarity comes after action, not before. Choose one path and take your first real step.
          </motion.p>
          <motion.p
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-primary font-medium"
          >
            This is not who you are forever. This is who you are becoming right now.
          </motion.p>
        </div>

        {/* Path Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {paths.map((path, index) => {
            const Icon = path.icon;
            const isSelected = selectedPath === path.id;

            return (
              <motion.div
                key={path.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card
                  className={cn(
                    "cursor-pointer transition-all duration-300 hover:shadow-xl h-full",
                    isSelected 
                      ? `ring-2 ring-primary shadow-xl ${path.bgColor}` 
                      : "hover:scale-[1.02]",
                    path.borderColor
                  )}
                  onClick={() => handleSelect(path.id)}
                >
                  <CardHeader className="pb-3">
                    <div
                      className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center mb-3 bg-gradient-to-br",
                        path.color
                      )}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-xl">{path.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground text-sm">
                      {path.description}
                    </p>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-foreground/70">Examples:</p>
                      <ul className="space-y-1">
                        {path.examples.map((example, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 right-3"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-primary-foreground text-sm">✓</span>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Confirm Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col items-center gap-3"
        >
          <AnimatePresence mode="wait">
            {selectedPath ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Button
                  size="lg"
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="px-8 text-lg"
                >
                  {confirming ? (
                    "Locking in your path..."
                  ) : (
                    <>
                      Commit to this path
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </motion.div>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-muted-foreground text-sm"
              >
                Select a path above to continue
              </motion.p>
            )}
          </AnimatePresence>

          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-muted-foreground"
            >
              I need more clarity first
            </Button>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default FirstWinPathSelector;
