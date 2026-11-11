import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Compass, MessageSquare, Target, Sparkles, Map, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { readAccountStorage, writeAccountStorage } from "@/lib/accountStorage";

type GuideMoment = "atlas" | "dot" | "lifetime" | "cris_map" | "council" | "project" | "creation";

const GUIDE_COPY: Record<GuideMoment, {
  icon: typeof Compass;
  eyebrow: string;
  title: string;
  body: string;
  bullets?: string[];
}> = {
  atlas: {
    icon: Compass,
    eyebrow: "Atlas",
    title: "This is where your life signals collect.",
    body: "Atlas stores the dots you create from skills, passions, life events, values, and patterns. The more honest signals you add, the better Becoming can connect what shaped you with what you may want to build.",
    bullets: ["Answer quests", "Create dots", "Watch patterns form"],
  },
  dot: {
    icon: CircleDot,
    eyebrow: "Atlas Dot",
    title: "A dot is one meaningful signal from your story.",
    body: "A dot can be a skill, memory, frustration, life moment, joy, value, or person you want to help. One dot does not explain everything. Many dots together start revealing your pattern.",
    bullets: ["Keep the ones that feel true", "Use real memories", "Let dots connect over time"],
  },
  lifetime: {
    icon: Map,
    eyebrow: "Lifetime",
    title: "Now place one moment from your real life.",
    body: "Your Atlas just created a dot from what you answered. Lifetime adds a grounded event, memory, or turning point so the system can connect what you say with what you have actually lived.",
    bullets: ["Add one real moment", "Keep it simple", "Return to Atlas after saving"],
  },
  cris_map: {
    icon: Map,
    eyebrow: "Cris's Map",
    title: "You have started your map. See how the pieces can connect.",
    body: "Cris's Map is an example of how life events, skills, pain, curiosity, and choices can connect into a project. It is not the answer for you. It is a reference so you can see how your own map will grow.",
    bullets: ["Example map", "Pattern preview", "Your map stays personal"],
  },
  council: {
    icon: MessageSquare,
    eyebrow: "Council",
    title: "This is where your dots become direction.",
    body: "The Council and mentors use your Atlas signals and story to ask better questions, reflect patterns, and help you find a possible next step. You do not need a perfect idea before talking to them.",
    bullets: ["Future Self guides the flow", "Mentors give different lenses", "Good insights can become projects"],
  },
  project: {
    icon: Target,
    eyebrow: "Project",
    title: "This is where insight turns into structure.",
    body: "A project is the first real container for what you are building. It turns a direction into blocks, activities, daily goals, and next actions so the idea can move from reflection into reality.",
    bullets: ["Project identity", "Core journey", "Daily next moves"],
  },
  creation: {
    icon: Sparkles,
    eyebrow: "Creation",
    title: "This is where the project becomes an experience.",
    body: "The Experience Team helps shape how people feel, what they do first, why they return, how to test it, and how to explain it. Their best insights can become visible project updates and daily actions.",
    bullets: ["UX shapes the journey", "Design Thinking creates tests", "Gamification builds return loops", "Marketing finds the hook"],
  },
};

interface ProgressiveGuideCardProps {
  moment: GuideMoment;
  className?: string;
  forceShow?: boolean;
  actionLabel?: string;
  onDismiss?: () => void;
  secondaryAction?: { label: string; onClick: () => void };
}

export const ProgressiveGuideCard = ({ moment, className, forceShow = false, actionLabel = "I understand", onDismiss, secondaryAction }: ProgressiveGuideCardProps) => {
  const storageKey = `progressive_guide_seen_${moment}`;
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(!forceShow);

  const copy = GUIDE_COPY[moment];
  const Icon = copy.icon;

  useEffect(() => {
    if (forceShow) {
      setDismissed(false);
      return;
    }

    let active = true;
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return;
      setCurrentUserId(user?.id ?? null);
      setDismissed(user ? Boolean(readAccountStorage(user.id, storageKey)) : false);
    });

    return () => {
      active = false;
    };
  }, [forceShow, storageKey]);

  useEffect(() => {
    if (dismissed) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [dismissed]);

  const dismiss = (action = onDismiss) => {
    if (currentUserId) writeAccountStorage(currentUserId, storageKey, "1");
    setDismissed(true);
    action?.();
  };

  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-[100] isolate flex items-center justify-center bg-background/98 px-5 py-8 backdrop-blur-lg">
      <motion.section
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
      className={cn(
          "max-h-[calc(100vh-3rem)] w-full max-w-sm overflow-y-auto rounded-3xl border border-primary/20 bg-card p-6 text-center shadow-[0_24px_80px_hsl(265_90%_20%/0.28)]",
        className
      )}
    >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div className="mt-5 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                {copy.eyebrow}
              </p>
          <h2 className="text-xl font-semibold leading-tight text-foreground">{copy.title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.body}</p>
          {copy.bullets?.length ? (
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {copy.bullets.map((bullet) => (
                <span
                  key={bullet}
                  className="rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-[11px] font-medium text-muted-foreground"
                >
                  {bullet}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <Button type="button" autoFocus onClick={() => dismiss()} className="mt-6 w-full rounded-2xl">
          {actionLabel}
        </Button>
        {secondaryAction && (
          <Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => dismiss(secondaryAction.onClick)}>
            {secondaryAction.label}
          </Button>
        )}
      </motion.section>
    </div>
  );
};
