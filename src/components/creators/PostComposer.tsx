import { useState } from "react";
import { MapPin, Target, ArrowRight, Image, ChevronDown, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const POST_TYPES = [
  { value: "creating", label: "Creating", emoji: "🚀" },
  { value: "working_on_self", label: "Working on myself", emoji: "🌱" },
  { value: "looking_for_help", label: "Looking for help", emoji: "🤝" },
  { value: "offering_help", label: "Offering help", emoji: "💚" },
];

interface PostComposerProps {
  onSubmit: (post: { statement: string; goal?: string; next_step?: string; location?: string; post_type: string; image_url?: string }) => Promise<void>;
  isSubmitting: boolean;
}

export const PostComposer = ({ onSubmit, isSubmitting }: PostComposerProps) => {
  const [statement, setStatement] = useState("");
  const [goal, setGoal] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [location, setLocation] = useState("");
  const [postType, setPostType] = useState("creating");
  const [showDetails, setShowDetails] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const selectedType = POST_TYPES.find((t) => t.value === postType) ?? POST_TYPES[0];

  const handleSubmit = async () => {
    if (!statement.trim()) return;
    await onSubmit({
      statement: statement.trim(),
      goal: goal.trim() || undefined,
      next_step: nextStep.trim() || undefined,
      location: location.trim() || undefined,
      post_type: postType,
    });
    setStatement("");
    setGoal("");
    setNextStep("");
    setLocation("");
    setShowDetails(false);
  };

  return (
    <Card className="p-3 space-y-2.5">
      {/* Main input row */}
      <div className="flex gap-2.5">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-0.5">
          Y
        </div>
        <textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          placeholder="What are you creating for a better world?"
          rows={2}
          className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none leading-relaxed"
        />
      </div>

      {/* Helper hints */}
      {!statement && (
        <p className="text-[11px] text-muted-foreground/50 pl-[42px] -mt-1">
          e.g. starting a community project • building a purpose-driven business • healing myself
        </p>
      )}

      {/* Expandable details */}
      {showDetails && (
        <div className="pl-[42px] space-y-2 pt-1">
          <div className="flex items-center gap-2 text-xs">
            <Target className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What impact would you like to achieve?"
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
            <input
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              placeholder="What is your next step?"
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location (optional)"
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between pl-[42px] pt-0.5">
        <div className="flex items-center gap-2">
          {/* Post type selector */}
          <div className="relative">
            <button
              onClick={() => setShowTypeMenu(!showTypeMenu)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors rounded-full bg-muted/50 px-2.5 py-1"
            >
              <span>{selectedType.emoji}</span>
              <span>{selectedType.label}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {showTypeMenu && (
              <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-10 py-1 min-w-[160px]">
                {POST_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => { setPostType(t.value); setShowTypeMenu(false); }}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-accent transition-colors",
                      t.value === postType && "text-primary font-medium"
                    )}
                  >
                    <span>{t.emoji}</span> {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors rounded-full bg-muted/50 px-2.5 py-1"
          >
            {showDetails ? "Less" : "+ Details"}
          </button>
        </div>

        {/* Share button */}
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!statement.trim() || isSubmitting}
          className="h-7 text-xs px-3 rounded-full gap-1"
        >
          <Send className="w-3 h-3" />
          Share
        </Button>
      </div>
    </Card>
  );
};
