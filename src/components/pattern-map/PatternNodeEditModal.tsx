import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";

interface PatternNodeEditModalProps {
  open: boolean;
  onClose: () => void;
  nodeType: string;
  nodeLabel: string;
  currentContent: string | null;
  onSave: (content: string) => void;
}

const guidingQuestions: Record<string, { question: string; examples: string[] }> = {
  trigger_event: {
    question: "What situations activate this pattern?",
    examples: ["criticism", "rejection", "conflict", "being watched", "success", "intimacy", "pressure"],
  },
  old_story: {
    question: "What belief keeps looping when this pattern is active?",
    examples: ["I'm not safe", "I'm not enough", "People leave", "I will fail", "I don't deserve this"],
  },
  mental_loop: {
    question: "What repeating thought or behavior shows up?",
    examples: ["overthinking", "self-doubt", "delaying", "avoiding", "perfectionism", "people-pleasing"],
  },
  cost: {
    question: "What does this pattern cost you?",
    examples: ["relationships", "opportunities", "money", "expression", "progress", "confidence", "peace"],
  },
  protective_role: {
    question: "What is this pattern trying to protect you from?",
    examples: ["rejection", "disappointment", "being hurt again", "failure", "being seen", "losing control"],
  },
  life_event: {
    question: "Is there an earlier moment connected to this pattern?",
    examples: ["childhood experience", "relationship that shaped you", "loss or change", "moment of pain"],
  },
};

export const PatternNodeEditModal = ({
  open,
  onClose,
  nodeType,
  nodeLabel,
  currentContent,
  onSave,
}: PatternNodeEditModalProps) => {
  const [content, setContent] = useState(currentContent || "");
  
  const guidance = guidingQuestions[nodeType] || {
    question: "What would you like to explore here?",
    examples: [],
  };

  const handleSave = () => {
    onSave(content.trim());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500" />
            {nodeLabel}
          </DialogTitle>
          <DialogDescription className="text-left">
            {guidance.question}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Take your time... there's no rush."
            rows={4}
            className="resize-none"
            autoFocus
          />
          
          {guidance.examples.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <p className="text-xs text-muted-foreground">Examples to inspire:</p>
              <div className="flex flex-wrap gap-1.5">
                {guidance.examples.map((example) => (
                  <button
                    key={example}
                    onClick={() => setContent(prev => prev ? `${prev}, ${example}` : example)}
                    className="px-2 py-1 text-xs rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
