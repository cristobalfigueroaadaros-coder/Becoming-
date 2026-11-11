import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Shield, Star, Compass, RefreshCw, Check, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DOT_TYPE_COLORS, getAtlasClusterColor, useAtlas } from "@/hooks/useAtlas";
import confetti from "canvas-confetti";
import type { DotInterpretation } from "@/data/atlasQuests";
import type { DotCategory } from "@/data/atlasSignals";

export type ValidationMode = "initial" | "picking" | "regenerating" | "editing" | "discarded" | "confirmed";

interface Props {
  dot: DotInterpretation;
  clusterName: string;
  destinationClusterSlug?: string;
  fallbackClusterSlug?: string;
  onConfirm: (primary?: DotInterpretation, extras?: DotInterpretation[], userEdited?: boolean) => void;
  onRegenerate: (feedback?: string) => void;
  isLoading?: boolean;
  isPatternBased?: boolean;
  isReinforced?: boolean;
  mirrorFeedback?: string;
  variations?: DotInterpretation[];
  validationMode: ValidationMode;
  onSetValidationMode: (mode: ValidationMode) => void;
  confirmLabel?: string;
  editEachCandidate?: boolean;
}

const CATEGORY_CONFIG: Record<string, { icon: typeof Sparkles; label: string }> = {
  strength: { icon: Sparkles, label: "Strength" },
  shadow: { icon: Shield, label: "Shadow" },
  life_imprint: { icon: Star, label: "Life Imprint" },
  direction: { icon: Compass, label: "Direction" },
};

const CLUSTER_LABELS: Record<string, string> = {
  "who-i-serve": "Who I Serve",
  "how-i-create-impact": "How I Create Impact",
  "vision-for-a-better-world": "Vision for a Better World",
  "life-events": "Life Events",
  "aha-moments": "Aha Moments",
  "natural-talents": "Natural Talents",
  skills: "Skills",
  experiments: "Experiments",
  inspirations: "Inspirations",
};

const clusterLabelFor = (clusterSlug?: string, fallback?: string) => {
  if (!clusterSlug) return fallback;
  return CLUSTER_LABELS[clusterSlug] || clusterSlug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const AtlasWinningCard = ({
  dot, clusterName, destinationClusterSlug, fallbackClusterSlug, onConfirm, onRegenerate, isLoading, isPatternBased, isReinforced,
  mirrorFeedback, variations, validationMode, onSetValidationMode, confirmLabel, editEachCandidate,
}: Props) => {
  const dotCategory = dot.dotCategory || "strength";
  const dotColor = DOT_TYPE_COLORS[dotCategory] || DOT_TYPE_COLORS.strength;
  const catConfig = CATEGORY_CONFIG[dotCategory] || CATEGORY_CONFIG.strength;

  const { clusters } = useAtlas();
  const getDestination = (candidate: DotInterpretation) => {
    const slug = destinationClusterSlug || candidate.clusterSlug;
    const cluster = clusters.find((item) => slug ? item.slug === slug : item.name === clusterName)
      || clusters.find((item) => item.slug === fallbackClusterSlug);
    return {
      label: cluster?.name || clusterLabelFor(slug, clusterName),
      color: cluster ? getAtlasClusterColor(cluster) : undefined,
    };
  };
  const destination = getDestination(dot);

  const [editTitle, setEditTitle] = useState(dot.title);
  const [editDesc, setEditDesc] = useState(dot.description);
  const [discardFeedback, setDiscardFeedback] = useState("");
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [edits, setEdits] = useState<Record<number, DotInterpretation>>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editCategory, setEditCategory] = useState(dotCategory);
  const [editClusterSlug, setEditClusterSlug] = useState(dot.clusterSlug ?? "");
  const maxSelections = Math.min(3, variations?.length ?? 1);
  const reviewDots = (variations ?? []).map((candidate, index) => edits[index] ?? candidate);
  const selectedVars = selectedIndices.map((index) => reviewDots[index]).filter(Boolean);

  const toggleVariation = (index: number) => {
    setSelectedIndices(prev => {
      if (prev.includes(index)) return prev.filter(selected => selected !== index);
      if (prev.length >= maxSelections) return prev;
      return [...prev, index];
    });
  };

  const startEditingCandidate = (index: number, candidate: DotInterpretation) => {
    setEditingIndex(index);
    setEditTitle(candidate.title);
    setEditDesc(candidate.description);
    setEditCategory(candidate.dotCategory);
    setEditClusterSlug(candidate.clusterSlug ?? "");
    onSetValidationMode("editing");
  };

  const saveCandidateEdit = () => {
    if (editingIndex === null) return;
    const candidate = reviewDots[editingIndex];
    if (!candidate || !editTitle.trim() || !editDesc.trim() || !editClusterSlug) return;
    setEdits((current) => ({
      ...current,
      [editingIndex]: {
        ...candidate,
        title: editTitle.trim(),
        description: editDesc.trim(),
        dotCategory: editCategory,
        clusterSlug: editClusterSlug,
      },
    }));
    setEditingIndex(null);
    onSetValidationMode("picking");
  };

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

  // Default: multi-select picking mode
  if ((validationMode === "picking" || validationMode === "initial") && variations && variations.length > 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center gap-4 px-6 w-full">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{headerLabel}</p>
          <p className="text-sm text-muted-foreground">Pick the ones that feel like you <span className="text-muted-foreground/60">(up to {maxSelections})</span></p>
        </div>

        {mirrorFeedback && (
          <p className="text-xs text-muted-foreground/80 italic max-w-xs">{mirrorFeedback}</p>
        )}

        <div className="space-y-3 w-full max-w-sm">
          {reviewDots.map((v, i) => {
            const vColor = DOT_TYPE_COLORS[v.dotCategory || "strength"] || DOT_TYPE_COLORS.strength;
            const vCat = CATEGORY_CONFIG[v.dotCategory || "strength"] || CATEGORY_CONFIG.strength;
            const candidateDestination = getDestination(v);
            const isSelected = selectedIndices.includes(i);
            const isMaxed = selectedVars.length >= maxSelections && !isSelected;
            return (
              <div key={i}>
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                  onClick={() => !isMaxed && toggleVariation(i)}
                  disabled={isLoading || isMaxed}
                  aria-pressed={isSelected}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-colors space-y-2 active:scale-[0.98] relative ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : isMaxed
                      ? "border-border opacity-40 cursor-not-allowed"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <div className="space-y-1.5 pr-6">
                    <p className="font-semibold text-foreground">{v.title}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <div
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ backgroundColor: vColor.replace(")", " / 0.13)"), color: vColor }}
                      >
                        {vCat.label}
                      </div>
                      <div
                        className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium"
                        style={candidateDestination.color ? { backgroundColor: candidateDestination.color.replace(")", " / 0.13)"), color: candidateDestination.color } : undefined}
                      >
                        {candidateDestination.label}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{v.description}</p>
                  {editEachCandidate && v.sourceQuote && (
                    <p className="text-xs text-muted-foreground">You said: “{v.sourceQuote}”</p>
                  )}
                </motion.button>
                {editEachCandidate && (
                  <Button type="button" variant="ghost" size="sm" disabled={isLoading} onClick={() => startEditingCandidate(i, v)}>
                    <Pencil className="mr-1 h-3 w-3" /> Edit {v.title}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <div className="w-full max-w-sm space-y-2">
          <Button
            onClick={() => onConfirm(selectedVars[0], selectedVars.slice(1))}
            disabled={selectedVars.length === 0 || isLoading}
            className="w-full gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {confirmLabel || "Add to Atlas"}{selectedVars.length > 0 ? ` (${selectedVars.length})` : ""}
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>

          <div className="flex gap-3 justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              disabled={isLoading}
              onClick={() => onSetValidationMode("discarded")}
            >
              <X className="w-3 h-3 mr-1" /> None of these
            </Button>
            {!editEachCandidate && <Button
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
            </Button>}
          </div>
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
          {editingIndex !== null && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                Dot type
                <select className="rounded-md border bg-background p-2" value={editCategory} onChange={(event) => setEditCategory(event.target.value as DotCategory)}>
                  {Object.entries(CATEGORY_CONFIG).map(([value, config]) => <option key={value} value={value}>{config.label}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                Atlas destination
                <select className="rounded-md border bg-background p-2" value={editClusterSlug} onChange={(event) => setEditClusterSlug(event.target.value)}>
                  {clusters.map((cluster) => <option key={cluster.id} value={cluster.slug}>{cluster.name}</option>)}
                </select>
              </label>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => {
            setEditingIndex(null);
            onSetValidationMode("picking");
          }}>Cancel</Button>
          <Button
            size="sm"
            disabled={!editTitle.trim() || (editingIndex !== null && (!editDesc.trim() || !editClusterSlug))}
            onClick={editingIndex !== null ? saveCandidateEdit : () => onConfirm({ ...dot, title: editTitle, description: editDesc, dotCategory }, [], true)}
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

      <div className="flex flex-wrap items-center justify-center gap-2">
        <div
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: dotColor.replace(")", " / 0.13)"), color: dotColor }}
        >
          {catConfig.label}
        </div>
        <div
          className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
          style={destination.color ? { backgroundColor: destination.color.replace(")", " / 0.13)"), color: destination.color } : undefined}
        >
          {destination.label}
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
