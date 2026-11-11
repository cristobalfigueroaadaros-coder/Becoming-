import { useState, type Dispatch, type SetStateAction } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { cn } from "@/lib/utils";
import type { QuestInteraction } from "@/data/atlasQuests";

interface Props {
  interaction: QuestInteraction;
  onSubmit: (response: any) => void;
}

export const AtlasQuestInteraction = ({ interaction, onSubmit }: Props) => {
  const {
    type,
    prompt,
    options,
    minSelect,
    maxSelect,
    sliderItems,
    emojiOptions,
    sentenceStem,
    memoryPrompt,
    optionA,
    optionB,
    words,
    thenLabel,
    nowLabel,
    detailHint,
    impactAudienceOptions = [],
    impactNeedOptions = [],
    lessonOptions,
    futureUseOptions,
  } = interaction;
  const [selected, setSelected] = useState<string[]>([]);
  const [ranked, setRanked] = useState<string[]>(options || []);
  const [sliderValues, setSliderValues] = useState<number[]>((sliderItems || []).map(() => 3));
  const [text, setText] = useState("");
  const [emojiIndex, setEmojiIndex] = useState<number | null>(null);
  const [thenText, setThenText] = useState("");
  const [nowText, setNowText] = useState("");
  const [impactAudience, setImpactAudience] = useState<string[]>([]);
  const [impactNeeds, setImpactNeeds] = useState<string[]>([]);
  const [customAudience, setCustomAudience] = useState("");
  const [customNeed, setCustomNeed] = useState("");
  const [impactFrom, setImpactFrom] = useState("");
  const [impactTo, setImpactTo] = useState("");
  const [lessonSignals, setLessonSignals] = useState<string[]>([]);
  const [lessonText, setLessonText] = useState("");
  const [futureUses, setFutureUses] = useState<string[]>([]);

  const writtenAudiences = customAudience.split("\n").map((value) => value.trim()).filter(Boolean);
  const writtenNeeds = customNeed.split("\n").map((value) => value.trim()).filter(Boolean);
  const audiences = [...new Set([...impactAudience, ...writtenAudiences])];
  const needs = [...new Set([...impactNeeds, ...writtenNeeds])];

  const canSubmit = (() => {
    switch (type) {
      case "multi_select": return selected.length >= (minSelect || 1);
      case "ranking": return true;
      case "scenario": return selected.length === 1;
      case "card_pick": return selected.length === 1;
      case "visual_metaphor": return selected.length === 1;
      case "energy_slider": return true;
      case "reflection": return text.trim().length > 0;
      case "emoji_scale": return emojiIndex !== null;
      case "sentence_completion": return text.trim().length > 0;
      case "memory_flash": return text.trim().length > 0;
      case "this_or_that": return selected.length === 1;
      case "tap_resonates": return selected.length >= 1;
      case "then_vs_now": return thenText.trim().length > 0 && nowText.trim().length > 0;
      case "impact_blueprint": return audiences.length > 0 && audiences.length <= 2 && needs.length > 0 && needs.length <= 2 && impactFrom.trim().length > 0 && impactTo.trim().length > 0;
      case "turning_point_lesson": return lessonSignals.length > 0 && lessonText.trim().length > 0 && futureUses.length > 0;
      default: return false;
    }
  })();

  const handleSubmit = () => {
    switch (type) {
      case "multi_select": return onSubmit(selected);
      case "ranking": return onSubmit(ranked);
      case "scenario": return onSubmit(selected[0]);
      case "card_pick": return onSubmit(selected[0]);
      case "visual_metaphor": return onSubmit(selected[0]);
      case "energy_slider": return onSubmit(sliderItems?.map((item, i) => ({ item, value: sliderValues[i] })));
      case "reflection": return onSubmit(text.trim());
      case "emoji_scale": return onSubmit(emojiIndex);
      case "sentence_completion": return onSubmit(`${sentenceStem || ""} ${text.trim()}`);
      case "memory_flash": return onSubmit(text.trim());
      case "this_or_that": return onSubmit(selected[0]);
      case "tap_resonates": return onSubmit(selected);
      case "then_vs_now": return onSubmit({ then: thenText.trim(), now: nowText.trim() });
      case "impact_blueprint": return onSubmit({
        audience: audiences,
        needs,
        transformation: { from: impactFrom.trim(), to: impactTo.trim() },
      });
      case "turning_point_lesson": return onSubmit({
        lessons: lessonSignals,
        lessonInOwnWords: lessonText.trim(),
        futureUse: futureUses,
      });
    }
  };

  const toggleSelect = (opt: string) => {
    if (type === "scenario" || type === "card_pick" || type === "visual_metaphor" || type === "this_or_that") {
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

  const toggleImpactSelection = (
    value: string,
    setter: Dispatch<SetStateAction<string[]>>,
    max = 2,
  ) => {
    setter((current) => {
      if (current.includes(value)) return current.filter((item) => item !== value);
      if (current.length >= max) return current;
      return [...current, value];
    });
  };

  const toggleTurningPointSelection = (
    value: string,
    setter: Dispatch<SetStateAction<string[]>>,
    max = 2,
  ) => {
    setter((current) => {
      if (current.includes(value)) return current.filter((item) => item !== value);
      if (current.length >= max) return current;
      return [...current, value];
    });
  };

  const appendTranscription = (current: string, transcript: string) => {
    const cleaned = transcript.trim();
    if (!cleaned) return current;
    return current.trim() ? `${current.trim()}\n\n${cleaned}` : cleaned;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-5"
    >
      <h2 className="text-lg font-semibold text-foreground">{prompt}</h2>

      {/* Multi-select, scenario, card_pick */}
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

      {/* Visual metaphor — styled cards with italic text */}
      {type === "visual_metaphor" && (
        <div className="flex flex-col gap-2">
          {(options || []).map((opt) => (
            <button
              key={opt}
              onClick={() => toggleSelect(opt)}
              className={cn(
                "text-left px-5 py-4 rounded-2xl border transition-all",
                selected.includes(opt)
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              )}
            >
              <span className="text-sm italic">{opt}</span>
            </button>
          ))}
        </div>
      )}

      {/* This or That — two large buttons side by side */}
      {type === "this_or_that" && optionA && optionB && (
        <div className="grid grid-cols-2 gap-3">
          {[optionA, optionB].map((opt) => (
            <button
              key={opt}
              onClick={() => toggleSelect(opt)}
              className={cn(
                "px-4 py-6 rounded-2xl border transition-all text-sm font-medium text-center",
                selected.includes(opt)
                  ? "border-primary bg-primary/10 text-foreground scale-[1.02]"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Tap what resonates — word cloud */}
      {type === "tap_resonates" && words && (
        <div className="flex flex-wrap gap-2 justify-center">
          <p className="w-full text-xs text-muted-foreground text-center mb-1">Tap all that feel true</p>
          {words.map((word) => (
            <button
              key={word}
              onClick={() => toggleSelect(word)}
              className={cn(
                "px-4 py-2 rounded-full border transition-all text-sm",
                selected.includes(word)
                  ? "border-primary bg-primary/15 text-foreground font-medium"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              )}
            >
              {word}
            </button>
          ))}
        </div>
      )}

      {/* Then vs Now — two text inputs */}
      {type === "then_vs_now" && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">{thenLabel || "Then"}</label>
            <Input
              value={thenText}
              onChange={(e) => setThenText(e.target.value)}
              placeholder="Who I was then…"
              className="bg-card"
            />
            <VoiceRecorder
              onTranscription={(transcript) => setThenText((current) => appendTranscription(current, transcript))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">{nowLabel || "Now"}</label>
            <Input
              value={nowText}
              onChange={(e) => setNowText(e.target.value)}
              placeholder="Who I am now…"
              className="bg-card"
            />
            <VoiceRecorder
              onTranscription={(transcript) => setNowText((current) => appendTranscription(current, transcript))}
            />
          </div>
        </div>
      )}

      {/* Turning point lesson — captures the moment, the learning, and where it can be used next */}
      {type === "turning_point_lesson" && (
        <div className="space-y-6">
          {detailHint && (
            <p className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm leading-6 text-muted-foreground">
              {detailHint}
            </p>
          )}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">1. What did this moment give you?</p>
            <p className="text-xs text-muted-foreground">Choose up to 2 lessons that feel true.</p>
            <div className="flex flex-col gap-2">
              {(lessonOptions || []).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleTurningPointSelection(option, setLessonSignals)}
                  className={cn(
                    "text-left px-4 py-3 rounded-xl border transition-all text-sm",
                    lessonSignals.includes(option)
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">2. Say the lesson in your own words</p>
            <p className="text-xs text-muted-foreground">Complete this: Because of that experience, I now know that I can…</p>
            <Textarea
              value={lessonText}
              onChange={(event) => setLessonText(event.target.value)}
              placeholder="I can keep learning and creating, even when life changes unexpectedly…"
              className="min-h-[100px] bg-card"
            />
            <VoiceRecorder
              onTranscription={(transcript) => setLessonText((current) => appendTranscription(current, transcript))}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">3. Where could you use this lesson next?</p>
            <p className="text-xs text-muted-foreground">Choose the place where it feels most useful now.</p>
            <div className="flex flex-col gap-2">
              {(futureUseOptions || []).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleTurningPointSelection(option, setFutureUses, 1)}
                  className={cn(
                    "text-left px-4 py-3 rounded-xl border transition-all text-sm",
                    futureUses.includes(option)
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Emoji scale */}
      {type === "emoji_scale" && emojiOptions && (
        <div className="flex justify-center gap-2 flex-wrap">
          {emojiOptions.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => setEmojiIndex(idx)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-3 rounded-xl border transition-all min-w-[64px]",
                emojiIndex === idx
                  ? "border-primary bg-primary/10 scale-110"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <span className="text-[10px] text-muted-foreground">{opt.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Ranking */}
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

      {/* Energy slider */}
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

      {/* Sentence completion */}
      {type === "sentence_completion" && (
        <div className="space-y-3">
          <p className="text-base font-medium text-foreground">{sentenceStem}…</p>
          <p className="text-xs text-muted-foreground">
            {detailHint || "Add one real detail if you can: a person, place, moment, or what actually happened."}
          </p>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your answer…"
            className="bg-card text-base"
          />
          <VoiceRecorder
            onTranscription={(transcript) => setText((current) => appendTranscription(current, transcript))}
          />
        </div>
      )}

      {/* Impact blueprint — audience, need, and the change the user wants to create */}
      {type === "impact_blueprint" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">1. Who do you want to help first?</p>
            <p className="text-xs text-muted-foreground">Choose or write up to 2 groups.</p>
            <Textarea
              aria-label="Audience in your own words"
              value={customAudience}
              onChange={(event) => setCustomAudience(event.target.value)}
              placeholder="Or write who you want to help, one group per line"
              disabled={impactAudience.length >= 2 && !customAudience}
              maxLength={240}
              rows={2}
            />
            <div className="flex flex-col gap-2">
              {impactAudienceOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => toggleImpactSelection(option, setImpactAudience, 2 - writtenAudiences.length)}
                  aria-pressed={impactAudience.includes(option)}
                  className={cn(
                    "text-left px-4 py-3 rounded-xl border transition-all text-sm",
                    impactAudience.includes(option)
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">2. What do they need most to move forward?</p>
            <p className="text-xs text-muted-foreground">Choose or write up to 2 needs.</p>
            <Textarea
              aria-label="Need in your own words"
              value={customNeed}
              onChange={(event) => setCustomNeed(event.target.value)}
              placeholder="Or write what they need, one need per line"
              disabled={impactNeeds.length >= 2 && !customNeed}
              maxLength={240}
              rows={2}
            />
            <div className="flex flex-col gap-2">
              {impactNeedOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => toggleImpactSelection(option, setImpactNeeds, 2 - writtenNeeds.length)}
                  aria-pressed={impactNeeds.includes(option)}
                  className={cn(
                    "text-left px-4 py-3 rounded-xl border transition-all text-sm",
                    impactNeeds.includes(option)
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">3. Complete this in your own words</p>
            <p className="text-xs text-muted-foreground">I want people to move from… to…</p>
            <Input
              value={impactFrom}
              onChange={(event) => setImpactFrom(event.target.value)}
              aria-label="What they experience today"
              placeholder="What they experience today"
              className="bg-card"
            />
            <Input
              value={impactTo}
              onChange={(event) => setImpactTo(event.target.value)}
              aria-label="What you want them to experience instead"
              placeholder="What you want them to experience instead"
              className="bg-card"
            />
          </div>
        </div>
      )}

      {/* Memory flash */}
      {type === "memory_flash" && (
        <div className="space-y-3">
          {memoryPrompt && (
            <p className="text-sm italic text-muted-foreground">{memoryPrompt}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {detailHint || "A small scene is enough: where were you, who was involved, and what changed?"}
          </p>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What comes to mind…"
            className="min-h-[100px] bg-card"
          />
          <VoiceRecorder
            onTranscription={(transcript) => setText((current) => appendTranscription(current, transcript))}
          />
        </div>
      )}

      {/* Reflection */}
      {type === "reflection" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {detailHint || "Make it specific: name a moment, person, place, object, or choice from your real life."}
          </p>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your thought…"
            className="min-h-[100px] bg-card"
          />
          <VoiceRecorder
            onTranscription={(transcript) => setText((current) => appendTranscription(current, transcript))}
          />
        </div>
      )}

      <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full mt-2">
        Continue
      </Button>
    </motion.div>
  );
};
