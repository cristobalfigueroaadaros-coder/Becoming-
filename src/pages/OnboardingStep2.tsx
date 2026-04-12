import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

type Phase = "DISCOVER" | "GROW" | "BUILD";
type Step = "q1" | "q2" | "q3" | "detecting" | "reveal" | "manual" | "phase_card";

const QUESTIONS = [
  {
    prompt: "Which one feels closest to where you are right now?",
    options: [
      { label: "I feel lost, I don't know what to build yet", phase: "DISCOVER" as Phase, emoji: "🔍" },
      { label: "I have an idea or something I'm working on", phase: "GROW" as Phase, emoji: "🌱" },
      { label: "I already built something and now I want to grow it", phase: "BUILD" as Phase, emoji: "🛠️" },
    ],
  },
  {
    prompt: "What have you already done?",
    options: [
      { label: "Mostly thinking, exploring", phase: "DISCOVER" as Phase, emoji: "💭" },
      { label: "Started building or shaping an idea", phase: "GROW" as Phase, emoji: "🔨" },
      { label: "Built and tested something in real life", phase: "BUILD" as Phase, emoji: "✅" },
    ],
  },
  {
    prompt: "What do you need most right now?",
    options: [
      { label: "Clarity and direction", phase: "DISCOVER" as Phase, emoji: "🧭" },
      { label: "Structure and validation", phase: "GROW" as Phase, emoji: "📐" },
      { label: "Help to sell, grow, or scale", phase: "BUILD" as Phase, emoji: "🚀" },
    ],
  },
];

const PHASE_DATA: Record<Phase, {
  title: string;
  icon: string;
  borderColor: string;
  bgColor: string;
  lines: string[];
  cardDescription: string;
}> = {
  DISCOVER: {
    title: "Discovery",
    icon: "🔍",
    borderColor: "border-primary/40",
    bgColor: "bg-primary/8",
    lines: [
      "I see where you are 👀",
      "You're in the Discovery phase.",
      "You're looking to create something meaningful, and we're going to help you find clarity and direction.",
    ],
    cardDescription: "You're exploring your direction. We'll help you connect the dots and find what truly matters to you.",
  },
  GROW: {
    title: "Growth",
    icon: "🌱",
    borderColor: "border-cyan-500/40",
    bgColor: "bg-cyan-500/8",
    lines: [
      "I see where you are 👀",
      "You're in the Growth phase.",
      "You already have an idea, and now we're going to help you structure it and move it forward.",
    ],
    cardDescription: "You have direction. We'll help you structure your idea and move it forward with confidence.",
  },
  BUILD: {
    title: "Build",
    icon: "🛠️",
    borderColor: "border-orange-500/40",
    bgColor: "bg-orange-500/8",
    lines: [
      "I see where you are 👀",
      "You're in the Build phase.",
      "You've already created something real, and now we're going to help you take it to the next stage.",
    ],
    cardDescription: "You've built something real. We'll help you grow it, reach more people, and scale.",
  },
};

const STAGE_MENTORS: Record<Phase, string[]> = {
  DISCOVER: ["strategist_mentor", "creative_visionary", "inner_clarity_mentor", "problem_mentor", "perspective_mentor", "alignment_mentor", "challenger_mentor"],
  GROW: ["strategist_mentor", "creative_visionary", "business_mentor", "marketing_mentor", "perspective_mentor", "challenger_mentor", "design_thinking_mentor"],
  BUILD: ["strategist_mentor", "creative_visionary", "business_mentor", "discipline_mentor", "marketing_mentor", "problem_mentor", "design_thinking_mentor"],
};

function detectPhase(answers: Phase[]): Phase {
  const scores: Record<Phase, number> = { DISCOVER: 0, GROW: 0, BUILD: 0 };
  answers.forEach(p => { scores[p]++; });
  // Tie → prefer higher phase (BUILD > GROW > DISCOVER) to avoid under-promising
  if (scores.BUILD >= scores.GROW && scores.BUILD >= scores.DISCOVER) return "BUILD";
  if (scores.GROW >= scores.DISCOVER) return "GROW";
  return "DISCOVER";
}

const OnboardingStep2 = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("q1");
  const [answers, setAnswers] = useState<Phase[]>([]);
  const [detectedPhase, setDetectedPhase] = useState<Phase>("DISCOVER");
  const [revealedLines, setRevealedLines] = useState(0);
  const [showConfirmButtons, setShowConfirmButtons] = useState(false);
  const [manualSelected, setManualSelected] = useState<Phase | null>(null);
  const [saving, setSaving] = useState(false);

  const questionIndex = step === "q1" ? 0 : step === "q2" ? 1 : step === "q3" ? 2 : -1;

  // Animate phase reveal lines one by one, then show confirm buttons
  useEffect(() => {
    if (step !== "reveal") {
      setRevealedLines(0);
      setShowConfirmButtons(false);
      return;
    }
    const lineCount = PHASE_DATA[detectedPhase].lines.length;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < lineCount; i++) {
      timers.push(setTimeout(() => setRevealedLines(i + 1), i * 1100 + 400));
    }
    timers.push(setTimeout(() => setShowConfirmButtons(true), lineCount * 1100 + 600));
    return () => timers.forEach(clearTimeout);
  }, [step, detectedPhase]);

  const handleAnswer = (qIndex: number, phase: Phase) => {
    const newAnswers = [...answers, phase];
    setAnswers(newAnswers);

    if (qIndex < 2) {
      setStep(qIndex === 0 ? "q2" : "q3");
    } else {
      setStep("detecting");
      const detected = detectPhase(newAnswers);
      setDetectedPhase(detected);
      setTimeout(() => setStep("reveal"), 1600);
    }
  };

  const savePhase = async (phase: Phase) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("profiles").update({ entry_state: phase }).eq("id", user.id);
      const mentors = STAGE_MENTORS[phase];
      await supabase.from("user_mentors").delete().eq("user_id", user.id);
      await supabase.from("user_mentors").insert(
        mentors.map(mentorType => ({ user_id: user.id, mentor_type: mentorType as any }))
      );
    } catch (e) {
      console.error("Phase save failed (non-blocking):", e);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    await savePhase(detectedPhase);
    confetti({ particleCount: 70, spread: 55, origin: { y: 0.65 } });
    setStep("phase_card");
  };

  const handleManualConfirm = async () => {
    if (!manualSelected) return;
    setDetectedPhase(manualSelected);
    await savePhase(manualSelected);
    confetti({ particleCount: 70, spread: 55, origin: { y: 0.65 } });
    setStep("phase_card");
  };

  const phaseData = PHASE_DATA[detectedPhase];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <AnimatePresence mode="wait">

          {/* ── Questions ─────────────────────────────────── */}
          {questionIndex >= 0 && (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.32 }}
              className="space-y-8"
            >
              {/* Progress bar */}
              <div className="flex gap-1.5 justify-center">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 rounded-full flex-1 max-w-[60px] transition-colors duration-500",
                      i <= questionIndex ? "bg-primary" : "bg-border"
                    )}
                  />
                ))}
              </div>

              <div className="text-center space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">
                  {questionIndex + 1} of 3
                </p>
                <h2 className="text-xl font-semibold text-foreground leading-snug">
                  {QUESTIONS[questionIndex].prompt}
                </h2>
              </div>

              <div className="space-y-3">
                {QUESTIONS[questionIndex].options.map(opt => (
                  <button
                    key={opt.phase}
                    onClick={() => handleAnswer(questionIndex, opt.phase)}
                    className="w-full text-left rounded-xl border border-border/50 bg-card/70 hover:border-primary/60 hover:bg-card transition-all p-4 flex items-center gap-4 group active:scale-[0.98]"
                  >
                    <span className="text-2xl leading-none">{opt.emoji}</span>
                    <span className="text-sm text-foreground group-hover:text-primary transition-colors leading-snug">
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Detecting ─────────────────────────────────── */}
          {step === "detecting" && (
            <motion.div
              key="detecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-6 py-16"
            >
              <motion.div
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                className="text-5xl"
              >
                🧠
              </motion.div>
              <p className="text-base text-muted-foreground">Reading your answers...</p>
            </motion.div>
          )}

          {/* ── Reveal + Confirmation ─────────────────────── */}
          {step === "reveal" && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Animated lines */}
              <div className="space-y-5 py-4">
                {phaseData.lines.map((line, i) => (
                  revealedLines > i ? (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className={cn(
                        "text-center",
                        i === 0 && "text-base text-muted-foreground",
                        i === 1 && "text-2xl font-bold text-foreground",
                        i === 2 && "text-sm text-muted-foreground leading-relaxed"
                      )}
                    >
                      {line}
                    </motion.p>
                  ) : null
                ))}
              </div>

              {/* Confirmation buttons appear after reveal */}
              <AnimatePresence>
                {showConfirmButtons && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-3"
                  >
                    <Button
                      onClick={handleConfirm}
                      disabled={saving}
                      className="w-full h-11 text-sm gap-2"
                    >
                      ✅ Yes, that feels right
                    </Button>
                    <Button
                      onClick={() => setStep("manual")}
                      variant="ghost"
                      className="w-full text-muted-foreground text-sm"
                    >
                      🔁 Not really, let me choose
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── Manual Override ───────────────────────────── */}
          {step === "manual" && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center">
                <p className="text-muted-foreground">That's okay — which one fits best?</p>
              </div>

              <div className="space-y-3">
                {(["DISCOVER", "GROW", "BUILD"] as Phase[]).map(phase => {
                  const pd = PHASE_DATA[phase];
                  return (
                    <button
                      key={phase}
                      onClick={() => setManualSelected(phase)}
                      className={cn(
                        "w-full text-left rounded-xl border p-4 flex items-center gap-4 transition-all",
                        manualSelected === phase
                          ? `${pd.borderColor} ${pd.bgColor}`
                          : "border-border/50 bg-card/70 hover:border-primary/40"
                      )}
                    >
                      <span className="text-2xl leading-none">{pd.icon}</span>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{pd.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                          {pd.cardDescription}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={handleManualConfirm}
                disabled={!manualSelected || saving}
                className="w-full h-11"
              >
                {saving ? "Saving..." : "Continue →"}
              </Button>
            </motion.div>
          )}

          {/* ── Phase Card ────────────────────────────────── */}
          {step === "phase_card" && (
            <motion.div
              key="phase_card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="space-y-8 text-center"
            >
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                This is your phase
              </p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className={cn(
                  "rounded-2xl border p-10 space-y-5",
                  phaseData.borderColor,
                  phaseData.bgColor
                )}
              >
                <div className="text-6xl">{phaseData.icon}</div>
                <h2 className="text-3xl font-bold text-foreground">{phaseData.title}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                  {phaseData.cardDescription}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  onClick={() => navigate("/onboarding/quest")}
                  className="w-full h-11 text-base"
                >
                  Let's begin →
                </Button>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingStep2;
