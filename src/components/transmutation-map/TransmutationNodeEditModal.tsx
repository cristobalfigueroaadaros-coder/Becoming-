import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface TransmutationNodeEditModalProps {
  open: boolean;
  onClose: () => void;
  nodeId: string;
  nodeLabel: string;
  phase: 'black' | 'white' | 'gold';
  currentContent: string | null;
  onSave: (content: string) => void;
}

const NODE_PROMPTS: Record<string, { prompt: string; examples: string[] }> = {
  shadow: {
    prompt: "What happened, or what part feels heavy right now?",
    examples: [
      "A relationship breakup...",
      "A moment I felt rejected...",
      "A memory from childhood...",
      "A situation where I felt unsafe, ashamed, or not good enough...",
    ],
  },
  dark_night: {
    prompt: "That moment when it felt like everything was lost, or you hit rock bottom. How was it?",
    examples: [
      "What did you feel emotionally in that moment?",
      "Where were you physically?",
      "What happened around you?",
      "If this moment had a name, what would you call it?",
    ],
  },
  shift_moment: {
    prompt: "What made you change your perspective?",
    examples: [
      "A conversation...",
      "A person who helped...",
      "A moment of clarity...",
      "An insight or realization...",
      "A decision I finally made...",
    ],
  },
  protective_purpose: {
    prompt: "If this pattern was trying to protect you... what was it protecting you from?",
    examples: [
      "Being rejected...",
      "Feeling shame again...",
      "Getting hurt...",
      "Being alone...",
      "Failing in front of others...",
    ],
  },
  lesson_learned: {
    prompt: "Now that you lived this... what do you think it was trying to teach you?",
    examples: [
      "I realized I need boundaries...",
      "I realized I don't need to prove myself...",
      "I realized I can trust myself...",
      "I realized I'm stronger than I thought...",
    ],
  },
  gold_insight: {
    prompt: "What did you gain from this experience?",
    examples: [
      "A new belief I chose...",
      "A new strength I discovered...",
      "A new truth I'm living by...",
      "Something I now understand about myself...",
    ],
  },
  letter_to_self: {
    prompt: "If you could speak to that version of you, what would you say now?",
    examples: [
      "What do they need to hear?",
      "What truth would you give them today?",
      "What message would change everything?",
    ],
  },
  brave_step: {
    prompt: "What is one small brave action you can take this week to live this new truth?",
    examples: [
      "Say no to something...",
      "Have one honest conversation...",
      "Take one step I've been avoiding...",
      "Share something vulnerable...",
      "Choose myself once...",
    ],
  },
};

const getPhaseStyle = (phase: 'black' | 'white' | 'gold') => {
  switch (phase) {
    case 'black':
      return {
        badge: "bg-slate-700 text-slate-200",
        border: "border-slate-600/30",
        bg: "from-slate-800/10 to-transparent",
      };
    case 'white':
      return {
        badge: "bg-slate-200 text-slate-700",
        border: "border-slate-300/30",
        bg: "from-slate-100/10 to-transparent",
      };
    case 'gold':
      return {
        badge: "bg-amber-500/20 text-amber-400",
        border: "border-amber-500/30",
        bg: "from-amber-500/10 to-transparent",
      };
  }
};

export const TransmutationNodeEditModal = ({
  open,
  onClose,
  nodeId,
  nodeLabel,
  phase,
  currentContent,
  onSave,
}: TransmutationNodeEditModalProps) => {
  const [content, setContent] = useState(currentContent || "");
  const nodeConfig = NODE_PROMPTS[nodeId] || { prompt: "Share your thoughts...", examples: [] };
  const style = getPhaseStyle(phase);

  const handleSave = () => {
    if (content.trim()) {
      onSave(content.trim());
      onClose();
    }
  };

  const getMentorCTAText = () => {
    if (phase === 'white') return "Talk to Phoenix Mentor";
    if (phase === 'gold') return "Talk to Stoic Mentor";
    return "Talk to Inner Clarity Mentor";
  };

  const handleTalkToMentor = () => {
    const mentorType = phase === 'white' ? 'phoenix_mentor' : phase === 'gold' ? 'stoic_mentor' : 'inner_clarity_mentor';
    // Navigate to council with the appropriate mentor
    window.location.href = `/council?view=${mentorType}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-md ${style.border} bg-gradient-to-br ${style.bg}`}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge className={style.badge}>
              {phase.charAt(0).toUpperCase() + phase.slice(1)} Phase
            </Badge>
          </div>
          <DialogTitle className="text-lg">{nodeLabel}</DialogTitle>
          <DialogDescription className="text-base font-medium mt-2">
            {nodeConfig.prompt}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Example guidance */}
          <div className="text-xs text-muted-foreground space-y-1">
            {nodeConfig.examples.map((example, index) => (
              <p key={index} className="opacity-70">• {example}</p>
            ))}
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share as little or as much as you want..."
            className="min-h-[120px] resize-none"
          />

          {/* Safety message */}
          <p className="text-xs text-muted-foreground text-center italic">
            This is a safe space. You're in control of what you share.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!content.trim()}
              className={`flex-1 ${phase === 'gold' ? 'bg-amber-600 hover:bg-amber-500' : ''}`}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            onClick={handleTalkToMentor}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {getMentorCTAText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
