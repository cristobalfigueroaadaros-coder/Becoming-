import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { QuestInteraction } from "@/data/atlasQuests";

interface Props {
  interaction: QuestInteraction;
  onSubmit: (response: any) => void;
}

export const AtlasQuestInteraction = ({ interaction, onSubmit }: Props) => {
  const { type, prompt, options, minSelect, maxSelect, sliderItems } = interaction;
  const [selected, setSelected] = useState<string[]>([]);
  const [ranked, setRanked] = useState<string[]>(options || []);
  const [sliderValues, setSliderValues] = useState<number[]>((sliderItems || []).map(() => 3));
  const [text, setText] = useState("");

  const canSubmit = (() => {
    switch (type) {
      case "multi_select": return selected.length >= (minSelect || 1);
      case "ranking": return true;
      case "scenario": return selected.length === 1;
      case "card_pick": return selected.length === 1;
      case "energy_slider": return true;
      case "reflection": return text.trim().length > 0;
      default: return false;
    }
  })();

  const handleSubmit = () => {
    switch (type) {
      case "multi_select": return onSubmit(selected);
      case "ranking": return onSubmit(ranked);
      case "scenario": return onSubmit(selected[0]);
      case "card_pick": return onSubmit(selected[0]);
      case "energy_slider": return onSubmit(sliderItems?.map((item, i) => ({ item, value: sliderValues[i] })));
      case "reflection": return onSubmit(text.trim());
    }
  };

  const toggleSelect = (opt: string) => {
    if (type === "scenario" || type === "card_pick") {
      setSelected([opt]);
      return;
    }
    setSelected(prev => {
      if (prev.includes(opt)) return prev.filter(s => s !== opt);
      if (maxSelect && prev.length >= maxSelect) return prev;
      return [...prev, opt];
    });
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setRanked(prev => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-5"
    >
      <h2 className="text-lg font-semibold text-foreground">{prompt}</h2>

      {(type === "multi_select" || type === "scenario" || type === "card_pick") && (
        <div className="flex flex-col gap-2">
          {type === "multi_select" && (
            <p className="text-xs text-muted-foreground">Select {minSelect}–{maxSelect}</p>
          )}
          {(options || []).map((opt) => (
            <button
              key={opt}
              onClick={() => toggleSelect(opt)}
              className={cn(
                "text-left px-4 py-3 rounded-xl border transition-all text-sm",
                selected.includes(opt)
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {type === "ranking" && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">Tap to move up in priority</p>
          {ranked.map((opt, idx) => (
            <button
              key={opt}
              onClick={() => moveUp(idx)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground"
            >
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                {idx + 1}
              </span>
              {opt}
            </button>
          ))}
        </div>
      )}

      {type === "energy_slider" && (
        <div className="flex flex-col gap-5">
          {(sliderItems || []).map((item, idx) => (
            <div key={item} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-foreground">{item}</span>
                <span className="text-muted-foreground">{sliderValues[idx]}/5</span>
              </div>
              <Slider
                value={[sliderValues[idx]]}
                min={1}
                max={5}
                step={1}
                onValueChange={([v]) => setSliderValues(prev => { const n = [...prev]; n[idx] = v; return n; })}
              />
            </div>
          ))}
        </div>
      )}

      {type === "reflection" && (
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your thought…"
          className="min-h-[100px] bg-card"
        />
      )}

      <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full mt-2">
        Continue
      </Button>
    </motion.div>
  );
};
