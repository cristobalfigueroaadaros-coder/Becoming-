import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap, ArrowRight, Shield, Star, RefreshCw, Check, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DOT_TYPE_COLORS } from "@/hooks/useAtlas";
import confetti from "canvas-confetti";
import type { DotInterpretation } from "@/data/atlasQuests";
import type { DotCategory } from "@/data/atlasSignals";

export type ValidationMode = "initial" | "picking" | "regenerating" | "editing" | "discarded" | "confirmed";

interface Props {
  dot: DotInterpretation;
  clusterName: string;
  onConfirm: (editedDot?: DotInterpretation, userEdited?: boolean) => void;
  onRegenerate: (feedback?: string) => void;
  isLoading?: boolean;
  isPatternBased?: boolean;
  isReinforced?: boolean;
  mirrorFeedback?: string;
  variations?: DotInterpretation[];
  validationMode: ValidationMode;
  onSetValidationMode: (mode: ValidationMode) => void;
}

const CATEGORY_CONFIG: Record<string, { icon: typeof Sparkles; label: string }> = {
  strength: { icon: Sparkles, label: "Strength" },
  shadow: { icon: Shield, label: "Shadow" },
  life_imprint: { icon: Star, label: "Life Imprint" },
};

export const AtlasWinningCard = ({
  dot, clusterName, onConfirm, onRegenerate, isLoading, isPatternBased, isReinforced,
  mirrorFeedback, variations, validationMode, onSetValidationMode,
}: Props) => {
  const dotCategory = dot.dotCategory || "strength";
  const dotColor = DOT_TYPE_COLORS[dotCategory] || DOT_TYPE_COLORS.strength;
  const catConfig = CATEGORY_CONFIG[dotCategory] || CATEGORY_CONFIG.strength;

  const [editTitle, setEditTitle] = useState(dot.title);
  const [editDesc, setEditDesc] = useState(dot.description);
  const [discardFeedback, setDiscardFeedback] = useState("");

  useEffect(() => {
    if (validationMode === "picking" && variations && variations.length > 0) {
      const timer = setTimeout(() => {
        confetti({
          particleCount: isPatternBased ? 120 : isReinforced ? 60 : 80,
          spread: isPatternBased ? 90 : 70,
          origin: { y: 0.6 },
        });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [validationMode, isPatternBased, isReinforced, variations]);

  let headerLabel: string;

  if (isReinforced) {
    headerLabel = "Atlas Dot Reinforced";
  } else if (isPatternBased) {
    headerLabel = "New Atlas Dot";
  } else {
    headerLabel = "New Atlas Dot";
  }

  // Default: 3-option picking mode
  if ((validationMode === "picking" || validationMode === "initial") && variations && variations.length > 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center gap-4 px-6 w-full">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{headerLabel}</p>
          <p className="text-sm text-muted-foreground">Pick the one that feels most like you:</p>
        </div>

        {mirrorFeedback && (
          <p className="text-xs text-muted-foreground/80 italic max-w-xs">{mirrorFeedback}</p>
        )}

        <div className="space-y-3 w-full max-w-sm">
          {variations.map((v, i) => {
            const vColor = DOT_TYPE_COLORS[v.dotCategory || "strength"] || DOT_TYPE_COLORS.strength;
            const vCat = CATEGORY_CONFIG[v.dotCategory || "strength"] || CATEGORY_CONFIG.strength;
            return (
              <button
                key={i}
                onClick={() => onConfirm(v)}
                disabled={isLoading}
                className="w-full text-left p-4 rounded-xl border border-border hover:border-primary/50 transition-all space-y-2 active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground">{v.title}</p>
                  <div
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{ backgroundColor: `${vColor}20`, color: vColor }}
                  >
                    {vCat.label}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{v.description}</p>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 mt-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            disabled={isLoading}
            onClick={() => onSetValidationMode("discarded")}
          >
            <X className="w-3 h-3 mr-1" /> None of these
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => {
              setEditTitle(variations[0]?.title || dot.title);
              setEditDesc(variations[0]?.description || dot.description);
              onSetValidationMode("editing");
            }}
          >
            <Pencil className="w-3 h-3 mr-1" /> Let me edit
          </Button>
        </div>
      </motion.div>
    );
  }

  // Editing mode
  if (validationMode === "editing") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 px-6 w-full">
        <p className="text-sm text-muted-foreground">Edit your discovery:</p>
        <div className="w-full max-w-sm space-y-3">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Discovery title"
            className="text-center font-semibold"
          />
          <Textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            placeholder="Description"
            rows={3}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onSetValidationMode("picking")}>Cancel</Button>
          <Button
            size="sm"
            disabled={!editTitle.trim()}
            onClick={() => onConfirm({ title: editTitle, description: editDesc, dotCategory }, true)}
          >
            <Check className="w-4 h-4 mr-1" /> Save
          </Button>
        </div>
      </motion.div>
    );
  }

  // Discarded — ask for feedback then regenerate
  if (validationMode === "discarded") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 px-6 w-full">
        <p className="text-sm text-muted-foreground">What would describe you better?</p>
        <Textarea
          value={discardFeedback}
          onChange={(e) => setDiscardFeedback(e.target.value)}
          placeholder="Tell us in your own words..."
          rows={3}
          className="max-w-sm"
        />
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onSetValidationMode("picking")}>Back</Button>
          <Button
            size="sm"
            disabled={!discardFeedback.trim() || isLoading}
            onClick={() => onRegenerate(discardFeedback)}
          >
            Regenerate
          </Button>
        </div>
      </motion.div>
    );
  }

  // Fallback: single dot display (shouldn't normally happen with 3-option flow)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center gap-5 px-6"
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
      >
        <catConfig.icon className="w-12 h-12" style={{ color: dotColor }} />
      </motion.div>

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground uppercase tracking-wider">{headerLabel}</p>
        <h2 className="text-2xl font-bold text-foreground">{dot.title}</h2>
        <p className="text-base text-muted-foreground leading-relaxed max-w-sm">{dot.description}</p>
      </div>

      {mirrorFeedback && (
        <p className="text-xs text-muted-foreground/80 italic max-w-xs">{mirrorFeedback}</p>
      )}

      <div className="flex items-center gap-2">
        <div
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: `${dotColor}20`, color: dotColor }}
        >
          {catConfig.label}
        </div>
        <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
          {clusterName}
        </div>
      </div>

      <div className="w-full max-w-xs space-y-2">
        <Button onClick={() => onConfirm()} disabled={isLoading} className="w-full gap-2">
          <Check className="w-4 h-4" /> Yes, that's me
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground"
          onClick={() => onSetValidationMode("editing")}
        >
          <Pencil className="w-3 h-3 mr-1" /> Let me edit
        </Button>
      </div>
    </motion.div>
  );
};
