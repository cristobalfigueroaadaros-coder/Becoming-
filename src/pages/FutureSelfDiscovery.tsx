import { FormEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Keyboard, Mic, RotateCcw, Sparkles, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { AtlasQuestInteraction } from "@/components/atlas/AtlasQuestInteraction";
import { AtlasWinningCard, ValidationMode } from "@/components/atlas/AtlasWinningCard";
import { ATLAS_QUESTS, DotInterpretation, QuestInteraction } from "@/data/atlasQuests";
import { DiscoveryMission } from "@/lib/discoveryMissions";
import {
  decideAfterDiscoveryInteraction,
  decideNextDiscoveryStep,
  DiscoveryDecision,
} from "@/lib/discoveryOrchestrator";
import { detectConnections } from "@/lib/atlasConnectionEngine";
import { AtlasDot, useAtlas } from "@/hooks/useAtlas";
import { useAtlasQuests } from "@/hooks/useAtlasQuests";
import { getFutureSelfOnboardingProgress } from "@/lib/journeyFlow";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { buildLifetimeCandidates } from "@/lib/lifetimeCandidates";

type ConversationMessage = {
  id: string;
  role: "future-self" | "user";
  content: string;
  savedDestinations?: Array<{ title: string; location: string; href: string }>;
};

type AtlasDotInsert = Database["public"]["Tables"]["atlas_dots"]["Insert"];
type AtlasQuestInsert = Database["public"]["Tables"]["atlas_quests"]["Insert"];
type AtlasSignalInsert = Database["public"]["Tables"]["atlas_signals"]["Insert"];
type AtlasConnectionInsert = Database["public"]["Tables"]["atlas_connections"]["Insert"];

type ImpactOptions = { audiences: string[]; needs: string[] };

type AiDiscoveryResponse = DiscoveryDecision & {
  candidateDots?: DotInterpretation[];
  impactOptions?: ImpactOptions;
};

type ConstellationMode = "idle" | "listening" | "thinking" | "speaking";
type DiscoveryQuestTheme = "origin" | "gifts" | "world" | "experiments" | "current";

const openingInvitation =
  "I want to start by getting to know you.\n\nTell me about yourself in whatever way feels natural.\n\nYou can talk about where you grew up, what you studied, things you've tried or built, places you've lived, things you love, people who influenced you, or anything that feels important.";

const impactBlueprintInteraction: QuestInteraction = {
  type: "impact_blueprint",
  prompt: "Make the change you want to create concrete.",
};

const experimentLearningInteraction: QuestInteraction = {
  type: "multi_select",
  prompt: "What did this experiment teach you to carry into your next creation?",
  options: [
    "Learn across disciplines before designing",
    "Test a small version early",
    "Use feedback without losing the original vision",
    "Design the experience around what people should feel",
    "Stay with the work through difficult days",
    "Ask better questions of the people involved",
  ],
  minSelect: 1,
  maxSelect: 3,
};

const createTurningPointLessonInteraction = (contextText = ""): QuestInteraction => {
  const normalized = contextText.toLowerCase();
  const isRecoveryMoment = /broke (my )?leg|surgery|covid|recover|couldn't walk|could not walk|injur/.test(normalized);
  const isCrossingIntoNewWorld = /left (chile|home)|moved|moving|berlin|germany|australia|new culture|travel/.test(normalized);
  const isCreationMoment = /family squad|festival|created|built|project|game|business|e-?commerce/.test(normalized);

  const lessonOptions = isRecoveryMoment
    ? [
        "I learned to trust myself when life changes unexpectedly",
        "I can turn a difficult pause into a chance to create",
        "I can keep learning and moving forward under pressure",
        "A positive perspective helps me find a way through",
        "I discovered resilience by doing the next possible thing",
      ]
    : isCrossingIntoNewWorld
      ? [
          "I can adapt without losing the parts of myself that matter",
          "Unfamiliar places can show me who I am becoming",
          "I can learn from difference and make a new beginning",
          "I can trust myself to find my way in a new environment",
          "Growth often begins when I leave what is familiar",
        ]
      : isCreationMoment
        ? [
            "I can bring an idea from my mind into reality",
            "Learning by doing is how I become more capable",
            "Feedback can make the creation stronger without losing its heart",
            "I can combine what I learn into something useful for people",
            "I can stay with meaningful work through uncertainty",
          ]
        : [
            "I learned to trust myself more",
            "I discovered a strength I can rely on",
            "I became more adaptable than I realized",
            "I learned what matters to me when things became difficult",
            "I can carry this experience into what I create next",
          ];

  const momentReference = isRecoveryMoment
    ? "the difficult moment and recovery you just described"
    : isCrossingIntoNewWorld
      ? "the change of place and identity you just described"
      : isCreationMoment
        ? "the experience you just described"
        : "the moment you just described";

  return {
    type: "turning_point_lesson",
    prompt: "Turn this moment into a lesson",
    detailHint: `I am holding ${momentReference}. You do not need to repeat the story; name what it changed in you and where that learning can serve you next.`,
    lessonOptions,
    futureUseOptions: [
      "A project I am building",
      "A difficult decision in front of me",
      "A relationship or community I care about",
      "A new chapter of my life",
      "The way I want to help other people",
    ],
  };
};

const questOpenings: Record<DiscoveryQuestTheme, string> = {
  origin: openingInvitation,
  gifts: "Think of something that comes naturally to you or a skill you had to work at. How did you discover you were good at it?",
  world: "When you think about what you could contribute, who would you most like to help? What would you want to change for them?",
  experiments: "Tell me about something you've already tried to create or make happen. What did you learn that you'd bring into whatever you try next?",
  current: "What's happening in your life right now that you'd like to think through together?",
};
const missionClusterSlugs: Record<DiscoveryMission, string> = {
  skills: "skills",
  natural_talents: "natural-talents",
  passions: "passions",
  experiments: "experiments",
  inspirations: "inspirations",
};

const interactionKeyFor = (interaction: QuestInteraction) =>
  `${interaction.type}:${interaction.prompt}`;

const getInteractionsForMission = (mission: DiscoveryMission, contextText = ""): QuestInteraction[] => {
  const normalized = contextText.toLowerCase();
  const missionSlug = missionClusterSlugs[mission];
  const slugs = new Set<string>();

  if (/\bhelp\b|\bserve\b|\bsociety\b|\bimpact\b|\bgift\b|\bpurpose\b|\bmission\b|\bpeople\b|\bworld\b/.test(normalized)) {
    slugs.add("who-i-serve");
    slugs.add("how-i-create-impact");
    slugs.add("vision-for-a-better-world");
  }

  slugs.add(missionSlug);

  if (mission === "inspirations") {
    slugs.add("values");
  }

  return Array.from(slugs).flatMap((slug) =>
    ATLAS_QUESTS
      .filter((item) => item.clusterSlug === slug)
      .flatMap((quest) => quest.interactions)
  );
};

const questThemeClusterSlugs: Record<DiscoveryQuestTheme, string[]> = {
  origin: ["life-events", "natural-talents", "aha-moments", "values"],
  gifts: ["skills", "natural-talents", "inspirations"],
  world: ["who-i-serve", "how-i-create-impact", "vision-for-a-better-world", "values"],
  experiments: ["experiments", "creative-evidence", "aha-moments", "skills"],
  current: ["personal-frustrations", "experiments", "values", "passions"],
};

const scoreInteractionForContext = (interaction: QuestInteraction, contextText: string) => {
  const normalized = contextText.toLowerCase();
  const prompt = interaction.prompt.toLowerCase();
  const serialized = JSON.stringify(interaction).toLowerCase();
  let score = 0;

  if (/\bgrandfather\b|\badmire\b|\binspired\b|\bshaped\b|\binfluenced\b/.test(normalized)) {
    if (/inspir|value|shaped|admire|person|people/.test(serialized)) score += 6;
  }
  if (/\bskill\b|\bgood at\b|\bnaturally\b|\bconnect(?:ing)?\b|\bcreate experiences\b|\bability\b/.test(normalized)) {
    if (/skill|naturally|ability|superpower|team|strength|confidence|pattern|connect/.test(serialized)) score += 8;
  }
  if (/\bhelp\b|\bserve\b|\bimpact\b|\bbetter world\b|\blost\b|\bcreator\b|\bparents?\b|\bfamilies\b|\bkids\b|\bcommunity\b/.test(normalized)) {
    if (/help|serve|impact|world|cause|people|community|values|pass on/.test(serialized)) score += 6;
  }
  if (/\bfestival\b|\bfamily squad\b|\bproject\b|\bproduct\b|\bgame\b|\be-?commerce\b|\bcreated\b|\bbuilt\b|\btested\b|\biterate\b|\bfeedback\b/.test(normalized)) {
    if (/built|created|tried|experiment|project|feedback|skill|ideas|work/.test(serialized)) score += 6;
  }
  if (/\bnow\b|\bnext\b|\bchallenge\b|\bstuck\b|\bdecision\b|\bgoal\b|\btoday\b/.test(normalized)) {
    if (/next|chapter|frustration|decision|challenge|fuel|action|work/.test(serialized)) score += 6;
  }

  if (/reflection|sentence|memory/i.test(interaction.type)) score += 1;
  if (/which|choose|tap|rank|order|select/i.test(prompt)) score += 2;
  return score;
};

const getInteractionForQuestTheme = (
  theme: DiscoveryQuestTheme,
  usedInteractionKeys: string[],
  contextText = ""
): QuestInteraction | null => {
  const slugs = questThemeClusterSlugs[theme] || questThemeClusterSlugs.origin;
  const interactions = slugs.flatMap((slug) =>
    ATLAS_QUESTS
      .filter((item) => item.clusterSlug === slug)
      .flatMap((quest) => quest.interactions)
  );
  const unused = interactions.filter((interaction) => !usedInteractionKeys.includes(interactionKeyFor(interaction)));
  const candidates = unused.length ? unused : interactions;

  return candidates
    .map((interaction) => ({
      interaction,
      score: scoreInteractionForContext(interaction, contextText),
    }))
    .sort((a, b) => b.score - a.score)[0]?.interaction ?? null;
};

const getInteractionForMission = (
  mission: DiscoveryMission,
  usedInteractionKeys: string[],
  contextText = ""
): QuestInteraction | null => {
  const interactions = getInteractionsForMission(mission, contextText);
  return interactions.find((interaction) => !usedInteractionKeys.includes(interactionKeyFor(interaction)))
    ?? interactions[0]
    ?? null;
};

const summarizeInteractionResponse = (response: unknown) => {
  if (!response || typeof response !== "object") return "I added a reflection.";
  const responseRecord = response as Record<string, unknown>;
  const lessons = Array.isArray(responseRecord.lessons)
    ? responseRecord.lessons.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const lessonInOwnWords = typeof responseRecord.lessonInOwnWords === "string"
    ? responseRecord.lessonInOwnWords.trim()
    : "";
  const futureUse = Array.isArray(responseRecord.futureUse)
    ? responseRecord.futureUse.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  if (lessons.length > 0 || lessonInOwnWords || futureUse.length > 0) {
    return [
      lessons.length > 0 ? `The lesson I chose: ${lessons.join("; ")}.` : "",
      lessonInOwnWords ? `In my own words: ${lessonInOwnWords}.` : "",
      futureUse.length > 0 ? `I can use it next in: ${futureUse.join(", ")}.` : "",
    ].filter(Boolean).join(" ");
  }

  const flattenValues = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.flatMap(flattenValues);
    if (value && typeof value === "object") return Object.values(value).flatMap(flattenValues);
    return typeof value === "string" && value.trim().length > 0 ? [value.trim()] : [];
  };
  const values = Object.values(response as Record<string, unknown>).flatMap(flattenValues);

  if (values.length === 0) return "I added a reflection.";
  return `I reflected on: ${values.slice(0, 8).join(", ")}.`;
};

const hasGenericDotTitle = (title: string) =>
  /^(builder evidence|admired quality|aspirational signal|value in motion|tried in reality|learning through action|possible signal|growth seeker|connection seeker|meaningful creator|passionate builder)$/i.test(title.trim());

const dotMatchesExistingEvidence = (dot: DotInterpretation, existingDots: AtlasDot[]) => {
  const normalizeWords = (value: string) => new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !["your", "this", "that", "with", "from", "into", "people", "something"].includes(word)),
  );

  const candidateTitle = dot.title.toLowerCase().trim();
  const candidateWords = normalizeWords(dot.title);

  return existingDots.some((existingDot) => {
    const existingTitle = existingDot.title.toLowerCase().trim();
    if (existingTitle === candidateTitle) return true;

    // Only reject a genuinely overlapping title. A shared project name such as
    // Family Squad is evidence for several different Dots, not a duplicate by itself.
    const existingWords = normalizeWords(existingDot.title);
    const overlap = Array.from(candidateWords).filter((word) => existingWords.has(word)).length;
    const smallerTitleSize = Math.min(candidateWords.size, existingWords.size);
    return smallerTitleSize >= 3 && overlap >= Math.max(3, Math.ceil(smallerTitleSize * 0.75));
  });
};

const keepNewDots = (dots: DotInterpretation[], existingDots: AtlasDot[]) =>
  dots.filter((dot) => !dotMatchesExistingEvidence(dot, existingDots));

const cleanTextForSpeech = (text: string) =>
  text
    .replace(/\*\*/g, "")
    .replace(/#{1,6}\s*/g, "")
    .replace(/[-*]\s+/g, "")
    .replace(/\s+/g, " ")
    .trim();

const splitTextForSpeech = (text: string) => {
  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) return [];

  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  sentences.forEach((sentence) => {
    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length > 190 && current) {
      chunks.push(current);
      current = sentence;
    } else {
      current = next;
    }
  });

  if (current) chunks.push(current);
  return chunks.length ? chunks : [cleaned];
};

const FutureSelfConstellation = ({
  mode,
  latestMessage,
}: {
  mode: ConstellationMode;
  latestMessage?: ConversationMessage;
}) => {
  const statusCopy: Record<ConstellationMode, { label: string; line: string }> = {
    idle: {
      label: "Future Self",
      line: "Ready to listen for the next signal.",
    },
    listening: {
      label: "Listening",
      line: "Your words are lighting possible Dots.",
    },
    thinking: {
      label: "Connecting",
      line: "Reading your story for the strongest pattern.",
    },
    speaking: {
      label: "Speaking",
      line: "Future Self is answering from the map.",
    },
  };
  const active = statusCopy[mode];
  const linePreview = latestMessage?.content.split("\n").find(Boolean) || active.line;
  const constellationActive = mode === "listening" || mode === "speaking" || mode === "thinking";
  const nodeAnimation = constellationActive ? "animate-[pulse_1.45s_ease-in-out_infinite]" : "";

  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/15 bg-[radial-gradient(circle_at_50%_25%,hsl(var(--primary)/0.18),transparent_34%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--background)/0.78))] px-5 py-8 shadow-sm sm:px-8">
      <div className="pointer-events-none absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <div className="relative flex h-56 w-56 items-center justify-center sm:h-72 sm:w-72">
          <div className="absolute inset-0 rounded-full bg-primary/5 blur-2xl" />
          <div className="absolute inset-8 rounded-full border border-primary/15 bg-background/70 shadow-[0_0_80px_hsl(var(--primary)/0.20)]" />
          <svg
            viewBox="0 0 220 220"
            className="relative h-full w-full transition-transform duration-700"
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="futureSelfCore" cx="50%" cy="45%" r="55%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.38" />
                <stop offset="58%" stopColor="hsl(222 88% 67%)" stopOpacity="0.16" />
                <stop offset="100%" stopColor="hsl(var(--background))" stopOpacity="0" />
              </radialGradient>
              <filter id="futureSelfGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle cx="110" cy="110" r="82" fill="url(#futureSelfCore)" />
            <g
              stroke="hsl(var(--primary))"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity={mode === "idle" ? "0.20" : mode === "thinking" ? "0.48" : "0.62"}
              filter={mode === "idle" ? undefined : "url(#futureSelfGlow)"}
            >
              <path className={constellationActive ? "animate-[pulse_1.9s_ease-in-out_infinite]" : ""} d="M62 92 L92 64 L126 82 L151 56 L171 94" />
              <path className={constellationActive ? "animate-[pulse_2.2s_ease-in-out_infinite]" : ""} d="M50 132 L84 118 L112 142 L146 128 L174 154" />
              <path className={constellationActive ? "animate-[pulse_2.45s_ease-in-out_infinite]" : ""} d="M78 166 L112 142 L126 82 L154 118" />
              <path className={mode === "thinking" ? "animate-[pulse_1.2s_ease-in-out_infinite]" : ""} d="M92 64 L84 118 L126 82 L146 128 L171 94" />
            </g>
            {[
              { cx: 62, cy: 92, r: 4.4, color: "hsl(145 82% 62%)" },
              { cx: 171, cy: 94, r: 4.4, color: "hsl(8 88% 68%)" },
              { cx: 78, cy: 166, r: 4.3, color: "hsl(272 92% 72%)" },
              { cx: 151, cy: 56, r: 4.6, color: "hsl(145 82% 62%)" },
              { cx: 50, cy: 132, r: 3.8, color: "hsl(190 92% 70%)" },
              { cx: 92, cy: 64, r: 4.5, color: "hsl(var(--primary))" },
              { cx: 126, cy: 82, r: 5, color: "hsl(318 88% 72%)" },
              { cx: 84, cy: 118, r: 5.2, color: "hsl(190 92% 70%)" },
              { cx: 112, cy: 142, r: 6, color: "hsl(var(--primary))" },
              { cx: 146, cy: 128, r: 4.7, color: "hsl(318 88% 72%)" },
              { cx: 174, cy: 154, r: 4.2, color: "hsl(145 82% 62%)" },
              { cx: 154, cy: 118, r: 3.8, color: "hsl(8 88% 68%)" },
            ].map((node, index) => (
              <circle
                key={`${node.cx}-${node.cy}`}
                cx={node.cx}
                cy={node.cy}
                r={node.r}
                fill={node.color}
                opacity={mode === "idle" ? "0.42" : "0.98"}
                filter="url(#futureSelfGlow)"
                className={nodeAnimation}
                style={{
                  animationDelay: `${index * 170}ms`,
                  transformOrigin: `${node.cx}px ${node.cy}px`,
                }}
              />
            ))}
            <circle
              cx="110"
              cy="110"
              r={mode === "listening" ? "13" : "9"}
              fill="hsl(var(--background))"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              filter="url(#futureSelfGlow)"
            />
          </svg>
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-primary">{active.label}</p>
          <p className="mx-auto max-w-xl text-lg font-semibold leading-7 text-foreground sm:text-xl">
            {active.line}
          </p>
          <p className="mx-auto line-clamp-2 max-w-xl text-sm leading-6 text-muted-foreground">
            {linePreview}
          </p>
        </div>
      </div>
    </section>
  );
};

const speechPauseFor = (chunk: string) => {
  if (/[?]$/.test(chunk)) return 520;
  if (/[.!]$/.test(chunk)) return 380;
  return 260;
};

const buildActivityDecision = (
  decision: DiscoveryDecision,
  theme?: DiscoveryQuestTheme,
): DiscoveryDecision => {
  const isImpactBlueprint = theme === "world" || decision.interactionKey === "impact_blueprint";
  const isExperimentLearning = theme === "experiments" || decision.interactionKey === "experiment_learning";
  const isTurningPointLesson = theme === "origin" || decision.interactionKey === "turning_point_lesson";

  return {
    ...decision,
    message: isTurningPointLesson
      ? "That moment matters. You did not only get through it; you learned something about who you can become when life changes. Let us name the lesson before we name the Dots."
      : isImpactBlueprint
      ? "Let’s make this specific. Who would you help first, and what would you want to change for them?"
      : isExperimentLearning
        ? "Choose the lessons from that experience you want to use in what you create next."
        : "That helps. I want to make this a little more concrete now, so I can understand this part of you with more precision. Choose the reflection that feels closest, and I will use it to keep the conversation moving.",
    action: "SHOW_INTERACTION",
    state: "INTERACTION",
    interactionKey: isTurningPointLesson
      ? "turning_point_lesson"
      : isImpactBlueprint
      ? "impact_blueprint"
      : isExperimentLearning
        ? "experiment_learning"
        : decision.interactionKey || "future_self_bridge",
    nextMove: {
      ...decision.nextMove,
      priority: "atlas_deepening",
      reason: isTurningPointLesson
        ? "The first discovery activity should turn the user's real life moment into a lesson, transferable capability, and future use rather than ask a generic values question."
        : isImpactBlueprint
        ? "A focused impact blueprint will separate the audience, need, and change the user wants to create before naming a Dot."
        : isExperimentLearning
          ? "A focused experiment reflection will separate the outcome, method, and impact of what the user built before naming three Dots."
          : "A structured reflection will help separate a nice label from a meaningful Dot.",
      suggestedQuestion: isTurningPointLesson
        ? "Name what this moment taught you and where you can use that lesson next."
        : isImpactBlueprint
        ? "Complete the three-part reflection so I can name the change you want to create."
        : isExperimentLearning
          ? "Choose the lessons you want to carry into your next creation."
          : "Choose the reflection that feels closest.",
    },
  };
};

const normalizeInteractionDecision = (decision: DiscoveryDecision): DiscoveryDecision => {
  if (decision.action !== "SHOW_INTERACTION") return decision;

  const isFocusedInteraction = decision.interactionKey === "impact_blueprint"
    || decision.interactionKey === "experiment_learning"
    || decision.interactionKey === "turning_point_lesson";
  const isImpactBlueprint = decision.interactionKey === "impact_blueprint";
  const isExperimentLearning = decision.interactionKey === "experiment_learning";
  const isTurningPointLesson = decision.interactionKey === "turning_point_lesson";

  return {
    ...decision,
    message: isFocusedInteraction
      ? decision.message
      : "Choose the reflection that comes closest to what you meant.",
    state: "INTERACTION",
    nextMove: {
      ...decision.nextMove,
      priority: "atlas_deepening",
      reason: isTurningPointLesson
        ? "The first discovery activity turns the user's real life moment into a lesson, transferable capability, and future use before naming three Dots."
        : isImpactBlueprint
        ? "A focused impact blueprint is the next step before naming a Dot about the user's intended audience and change."
        : isExperimentLearning
          ? "A focused experiment reflection is the next step before naming three Dots from the user's outcome, method, and impact."
          : "A structured reflection is the next step before asking another conversation question.",
      suggestedQuestion: isTurningPointLesson
        ? "Name what this moment taught you and where you can use that lesson next."
        : isImpactBlueprint
        ? "Complete the three-part reflection so I can name the change you want to create."
        : isExperimentLearning
          ? "Choose the lessons you want to carry into your next creation."
          : "Choose the reflection that feels closest.",
    },
  };
};

const hasAudienceDirection = (text: string) =>
  /\bpeople\b|\bperson\b|\bcreators?\b|\bparents?\b|\bfamilies\b|\bkids\b|\bchildren\b|\blost\b|\bfind themselves\b|\bgift\b|\bimpact\b|\bmovement\b|\bcommunity\b|\bconnect\b|\bcollective\b|\bhelp\b|\bserve\b/.test(text.toLowerCase());

const hasCreationSignal = (text: string) =>
  /\bfamily squad\b|\bfestival\b|\bcommunity\b|\bmovement\b|\bproject\b|\bproduct\b|\bgame\b|\be-?commerce\b|\bevent\b|\bexperience\b|\bcreated?\b|\bbuilt\b|\bdeveloped\b|\bbring .*life\b|\bmake .*real\b/.test(text.toLowerCase());

const hasStuckOrCompletionSignal = (text: string) =>
  /\bstuck\b|\bfinish(?:ing)?\b|\bcomplete\b|\bcompleted\b|\bwrap up\b|\bworking with ai\b|\bopen something new\b|\bmake more money\b|\blook for more opportunities\b/.test(text.toLowerCase());

const hasRelationshipSignal = (text: string) =>
  /\brelationship\b|\bmet a girl\b|\bmet someone\b|\blike her\b|\blike him\b|\bpartner\b/.test(text.toLowerCase());

const repeatsAudienceQuestion = (message: string) => {
  const normalized = message.toLowerCase();
  return normalized.includes("first small group") || normalized.includes("who would you feel called to help");
};

const repeatsOriginStoryQuestion = (message: string) => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("real arc") ||
    normalized.includes("what part of that journey marked you") ||
    normalized.includes("what did it teach you that you still carry")
  );
};

const buildThemedFollowUpDecision = (
  decision: DiscoveryDecision,
  theme: DiscoveryQuestTheme,
  sessionText: string
): DiscoveryDecision => {
  const normalized = sessionText.toLowerCase();
  const mentionsGrandfather = /\bgrandfather\b|\babuel/.test(normalized);
  const mentionsExperience = /\bexperience\b|\bfeel\b|\bevent\b|\bconnecting people\b|\bconnecting ideas\b|\bconnect dots\b|\bunique solution/.test(normalized);
  const mentionsLearning = /\blearn\b|\bskill\b|\bgood at\b|\bnaturally\b|\bbring .*reality\b|\bbuild whatever/.test(normalized);
  const mentionsExperimentLearning = /\blearn(?:ed|ing)?\b|\bpsychology\b|\bgame theory\b|\bgamification\b|\bgame design\b|\biterat\w*\b|\bfeedback\b|\btest(?:ed|ing)?\b|\bresilien\w*\b|\bimprov\w*\b/.test(normalized);

  const originMessage = /\bresilien(?:ce|t)\b|\badapt\b|\btrust myself\b|\bsolve difficult\b|\bbring .*mind\b|\bbring .*life\b|\bconnect dots\b|\bskill\b/.test(normalized)
    ? "Where did you have to put that ability into practice, and what did the experience teach you?"
    : "Which moment in your story changed the way you saw yourself, and what did you learn from it?";

  const giftsMessage = mentionsGrandfather || mentionsExperience || mentionsLearning
    ? "Where has the ability you described shown up most clearly in something you created, helped shape, or brought to life?"
    : "I want to stay with your gifts for one more layer. What is something you seem to do naturally that other people often need help doing, and where has that shown up in real life?";

  const worldMessage =
    hasAudienceDirection(normalized)
      ? "Think of the people you just described. What do you think they need most right now?"
      : "I want to understand the world you feel called to help create. When you imagine people becoming more whole, connected, or alive, who do you feel most called to help first, and what would you want them to experience?";

  const experimentsMessage =
    hasCreationSignal(normalized) && mentionsExperimentLearning
      ? "How could you use what you learned to help the people you want to serve now?"
      : hasCreationSignal(normalized)
        ? "Which of those experiments taught you something you could use in what you create next?"
          : "I want to ground this in what you have already tried. Tell me about one thing you created, tested, organized, built, or helped shape. What did reality teach you through that experiment?";

  const currentMessage = hasStuckOrCompletionSignal(normalized)
    ? "What feels like the biggest thing holding you back right now?"
    : hasRelationshipSignal(normalized)
      ? "What have you noticed about yourself in this relationship, and what would you like to understand better?"
      : /\bmeeting\b|\bopportunity\b|\bmovement\b|\bconscious creators?\b/.test(normalized)
        ? "I hear an opportunity taking shape in front of you. What is the next concrete decision you need to make about it, and what is the smallest version you could test before committing to the whole idea?"
        : "I want to connect this to your life now. What is one action, challenge, idea, or decision in front of you at the moment, and what is it teaching you?";

  const messageByTheme: Record<DiscoveryQuestTheme, string> = {
    origin: originMessage,
    gifts: giftsMessage,
    world: worldMessage,
    experiments: experimentsMessage,
    current: currentMessage,
  };
  const missionByTheme: Record<DiscoveryQuestTheme, DiscoveryMission> = {
    origin: decision.activeMission,
    gifts: "skills",
    world: "inspirations",
    experiments: "experiments",
    current: decision.activeMission,
  };
  const hasFocusedFollowUp = (theme === "world" || theme === "experiments")
    && decision.action === "ASK"
    && (decision.message.match(/\?/g)?.length || 0) === 1
    && !repeatsOriginStoryQuestion(decision.message)
    && !(theme === "world" && hasAudienceDirection(normalized) && repeatsAudienceQuestion(decision.message));
  const message = hasFocusedFollowUp ? decision.message : messageByTheme[theme];
  const mission = missionByTheme[theme] || decision.activeMission;

  return {
    ...decision,
    message,
    activeMission: mission,
    action: "ASK",
    state: "FOLLOW_UP",
    interactionKey: undefined,
    coverage: {
      ...decision.coverage,
      mission,
      score: Math.max(decision.coverage.score, 0.4),
      covered: Array.from(new Set([...decision.coverage.covered, theme])),
    },
    nextMove: {
      ...decision.nextMove,
      priority: theme === "world" ? "direction" : theme === "experiments" ? "creation" : "learning",
      reason: `Stay inside the active ${theme} discovery theme before moving to another Atlas layer.`,
      suggestedQuestion: message,
    },
  };
};

const missionForQuestTheme = (
  theme: DiscoveryQuestTheme,
  fallback: DiscoveryMission
): DiscoveryMission => {
  if (theme === "gifts") return "skills";
  if (theme === "world") return "inspirations";
  if (theme === "experiments") return "experiments";
  return fallback;
};

const applyQuestFlowContract = (
  body: Record<string, unknown>,
  decision: DiscoveryDecision,
  fromModel = false
): DiscoveryDecision => {
  const theme = typeof body.activeQuestTheme === "string" ? body.activeQuestTheme as DiscoveryQuestTheme : "origin";

  const mode = typeof body.mode === "string" ? body.mode : "conversation";
  const priorUserTurns = Number(body.priorUserTurns || 0);
  const interactionCount = Number(body.interactionCount || 0);
  const recentMessages = Array.isArray(body.recentMessages) ? body.recentMessages : [];
  const recentUserText = recentMessages
    .filter((message) => message && typeof message === "object" && (message as { role?: unknown }).role === "user")
    .map((message) => String((message as { content?: unknown }).content || ""))
    .join(" ");
  const userText = typeof body.userText === "string" ? body.userText : "";
  const interactionText = typeof body.interactionResponse === "undefined"
    ? ""
    : JSON.stringify(body.interactionResponse);
  const sessionText = [recentUserText, userText, interactionText].join(" ");
  const themedDecision: DiscoveryDecision = {
    ...decision,
    activeMission: missionForQuestTheme(theme, decision.activeMission),
    coverage: {
      ...decision.coverage,
      mission: missionForQuestTheme(theme, decision.activeMission),
      covered: Array.from(new Set([...decision.coverage.covered, theme])),
    },
  };

  if (mode === "interaction" || interactionCount >= 1) {
    return buildDotRewardDecision(themedDecision);
  }

  const hasOneFollowUp = fromModel
    && decision.action === "ASK"
    && (decision.message.match(/\?/g)?.length || 0) === 1
    && !repeatsOriginStoryQuestion(decision.message)
    && !(hasAudienceDirection(sessionText) && repeatsAudienceQuestion(decision.message));

  if (priorUserTurns < 2 && hasOneFollowUp) {
    return themedDecision;
  }

  if (priorUserTurns <= 0) {
    return buildThemedFollowUpDecision(themedDecision, theme, sessionText);
  }

  return buildActivityDecision(themedDecision, theme);
};

const buildDotRewardDecision = (decision: DiscoveryDecision): DiscoveryDecision => ({
  ...decision,
  message: "",
  action: "GENERATE_DOTS",
  state: "READY_FOR_DOTS",
  interactionKey: undefined,
  coverage: {
    ...decision.coverage,
    score: Math.max(decision.coverage.score, 0.68),
    covered: Array.from(new Set([...decision.coverage.covered, "learning", "future_use"])),
  },
  nextMove: {
    ...decision.nextMove,
    priority: "atlas_deepening",
    reason: "The user completed a short discovery loop, so the next useful reward is to let them validate a Dot and see the Atlas grow.",
    suggestedQuestion: "Choose only what feels true, or edit the words until they fit.",
  },
});

const FutureSelfDiscovery = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { clusters, dots: allExistingDots, isLoading: isAtlasLoading } = useAtlas();
  const { completedQuests, futureSelfProgress, isLoading: isProgressLoading, isFetching: isProgressFetching } = useAtlasQuests();
  const { nextTheme } = futureSelfProgress;
  const [input, setInput] = useState("");
  const [preparedSessionKey, setPreparedSessionKey] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [decision, setDecision] = useState<DiscoveryDecision | null>(null);
  const [activeInteraction, setActiveInteraction] = useState<QuestInteraction | null>(null);
  const [usedInteractionKeys, setUsedInteractionKeys] = useState<string[]>([]);
  const [interactionResponses, setInteractionResponses] = useState<unknown[]>([]);
  const [candidateDots, setCandidateDots] = useState<DotInterpretation[]>([]);
  const [candidateRevision, setCandidateRevision] = useState(0);
  const [selectedDots, setSelectedDots] = useState<DotInterpretation[]>([]);
  const [validationMode, setValidationMode] = useState<ValidationMode>("picking");
  const [isSavingDot, setIsSavingDot] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(true);
  const [voiceRepliesEnabled, setVoiceRepliesEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [preferredSpeechVoice, setPreferredSpeechVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [savedDotTitle, setSavedDotTitle] = useState<string | null>(null);
  const [autoSendSeconds, setAutoSendSeconds] = useState<number | null>(null);
  const [activeQuestTheme, setActiveQuestTheme] = useState<DiscoveryQuestTheme>("origin");
  const lastSpokenMessageIdRef = useRef("");
  const speechRunIdRef = useRef(0);
  const speechPauseTimerRef = useRef<number | null>(null);
  const autoSendTimerRef = useRef<number | null>(null);
  const autoSendIntervalRef = useRef<number | null>(null);
  const sessionKey = location.key;

  const canSubmit = input.trim().length > 0;
  const latestFutureSelfMessage = [...messages]
    .reverse()
    .find((message) => message.role === "future-self");
  const isSessionPreparing = preparedSessionKey !== sessionKey;
  const visibleLatestFutureSelfMessage = isSessionPreparing ? undefined : latestFutureSelfMessage;
  const constellationMode: ConstellationMode = isRecordingVoice
    ? "listening"
    : isThinking || isProcessingVoice
      ? "thinking"
      : isSpeaking
        ? "speaking"
        : "idle";

  useLayoutEffect(() => {
    cancelAutoSend();
    stopSpeaking();
  }, [sessionKey]);

  useEffect(() => {
    const resetDiscoverySession = () => {
      if (!isSessionPreparing || isAtlasLoading || isProgressLoading || isProgressFetching) return;

      const isNextQuest = nextTheme !== "origin";
      const priorInteractionKeys = completedQuests
        .filter((quest) => quest.quest_key?.startsWith("future_self_"))
        .map((quest) => (quest.interactions as { interactionKey?: unknown } | null)?.interactionKey)
        .filter((key): key is string => typeof key === "string" && key.length > 0);
      setInput("");
      setMessages([
        {
          id: isNextQuest ? "next-quest-opening" : "opening",
          role: "future-self",
          content: questOpenings[nextTheme],
        },
      ]);
      setDecision(null);
      setActiveInteraction(null);
      setUsedInteractionKeys(priorInteractionKeys);
      setInteractionResponses([]);
      setCandidateDots([]);
      setSelectedDots([]);
      setValidationMode("picking");
      setIsSavingDot(false);
      setIsThinking(false);
      setIsRecordingVoice(false);
      setIsProcessingVoice(false);
      setSavedDotTitle(null);
      setActiveQuestTheme(nextTheme);
      lastSpokenMessageIdRef.current = "";
      setPreparedSessionKey(sessionKey);
    };

    resetDiscoverySession();
  }, [sessionKey, isSessionPreparing, isAtlasLoading, isProgressLoading, isProgressFetching, nextTheme, completedQuests]);

  const speakFutureSelfMessage = (message?: ConversationMessage) => {
    if (!message || typeof window === "undefined" || !("speechSynthesis" in window)) return;

    speechRunIdRef.current += 1;
    const runId = speechRunIdRef.current;
    if (speechPauseTimerRef.current) {
      window.clearTimeout(speechPauseTimerRef.current);
      speechPauseTimerRef.current = null;
    }
    window.speechSynthesis.cancel();

    const chunks = splitTextForSpeech(message.content);
    if (!chunks.length) return;

    const speakChunk = (index: number) => {
      if (runId !== speechRunIdRef.current) return;
      const chunk = chunks[index];
      if (!chunk) {
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunk);
      if (preferredSpeechVoice) utterance.voice = preferredSpeechVoice;
      utterance.lang = preferredSpeechVoice?.lang || "en-US";
      utterance.rate = index === 0 ? 0.86 : 0.88;
      utterance.pitch = 1.04;
      utterance.volume = 0.92;
      utterance.onstart = () => {
        if (runId === speechRunIdRef.current) setIsSpeaking(true);
      };
      utterance.onend = () => {
        if (runId !== speechRunIdRef.current) return;
        speechPauseTimerRef.current = window.setTimeout(
          () => speakChunk(index + 1),
          speechPauseFor(chunk),
        );
      };
      utterance.onerror = () => {
        if (runId === speechRunIdRef.current) setIsSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
    };

    speakChunk(0);
    lastSpokenMessageIdRef.current = message.id;
  };

  const stopSpeaking = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    speechRunIdRef.current += 1;
    if (speechPauseTimerRef.current) {
      window.clearTimeout(speechPauseTimerRef.current);
      speechPauseTimerRef.current = null;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  useEffect(() => {
    if (!voiceRepliesEnabled || !visibleLatestFutureSelfMessage) return;
    if (visibleLatestFutureSelfMessage.id === lastSpokenMessageIdRef.current) return;

    speakFutureSelfMessage(visibleLatestFutureSelfMessage);
  }, [visibleLatestFutureSelfMessage, voiceRepliesEnabled]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const softVoiceNames = [
      "samantha",
      "jenny",
      "aria",
      "ava",
      "emma",
      "sonia",
      "zira",
      "susan",
      "serena",
      "moira",
      "karen",
      "tessa",
      "natasha",
      "google us english",
      "google uk english female",
      "microsoft",
    ];

    const chooseVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;

      const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
      const candidates = englishVoices.length ? englishVoices : voices;
      const matched = candidates.find((voice) => {
        const name = voice.name.toLowerCase();
        return softVoiceNames.some((preferredName) => name.includes(preferredName));
      });

      setPreferredSpeechVoice(matched || candidates[0] || null);
    };

    chooseVoice();
    window.speechSynthesis.onvoiceschanged = chooseVoice;

    return () => {
      if (window.speechSynthesis.onvoiceschanged === chooseVoice) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  useEffect(() => () => {
    stopSpeaking();
    cancelAutoSend();
  }, []);

  const applyDecision = (nextDecision: DiscoveryDecision, aiCandidateDots: DotInterpretation[] = []) => {
    setDecision(nextDecision);
    setValidationMode("picking");
    const candidates = keepNewDots(aiCandidateDots, allExistingDots)
      .filter((dot) => !hasGenericDotTitle(dot.title) && !!dot.sourceQuote && clusters.some((cluster) => cluster.slug === dot.clusterSlug));
    const distinct = new Map(candidates.map((dot) => [dot.title.trim().toLowerCase(), dot]));
    setCandidateDots(nextDecision.action === "GENERATE_DOTS" ? [...distinct.values()].slice(0, 3) : []);
    setCandidateRevision((current) => current + 1);
  };

  const activateInteraction = (nextDecision: DiscoveryDecision, contextText = "", impactOptions?: ImpactOptions) => {
    if (nextDecision.action !== "SHOW_INTERACTION") {
      setActiveInteraction(null);
      return;
    }

    const themeContext: Record<DiscoveryQuestTheme, string> = {
      origin: "",
      gifts: "skills natural talents gifts influenced shaped naturally good at connecting ideas creating experiences",
      world: "help serve impact better world people who feel lost conscious creators parents families clarity direction",
      experiments: "created tested built organized project experiment feedback iteration real life",
      current: "current action challenge decision learning next step",
    };
    const combinedContext = `${contextText} ${themeContext[activeQuestTheme] || ""}`;
    const shouldUseTurningPointLesson = nextDecision.interactionKey === "turning_point_lesson"
      || (activeQuestTheme === "origin" && interactionResponses.length === 0);
    const interaction = shouldUseTurningPointLesson
      ? createTurningPointLessonInteraction(contextText)
      : nextDecision.interactionKey === "impact_blueprint"
      ? {
        ...impactBlueprintInteraction,
        impactAudienceOptions: impactOptions?.audiences,
        impactNeedOptions: impactOptions?.needs,
      }
      : nextDecision.interactionKey === "experiment_learning"
        ? experimentLearningInteraction
      : getInteractionForQuestTheme(
        activeQuestTheme,
        usedInteractionKeys,
        combinedContext
      ) ?? getInteractionForMission(
        nextDecision.activeMission,
        usedInteractionKeys,
        combinedContext
      );
    setActiveInteraction(interaction);

    if (interaction) {
      const key = interactionKeyFor(interaction);
      setUsedInteractionKeys((current) => current.includes(key) ? current : [...current, key]);
    }
  };

  const recentMessages = messages.filter(({ id }) => id !== "opening" && id !== "next-quest-opening").slice(-8);

  const askFutureSelfDiscovery = async (
    body: Record<string, unknown>,
    fallback: () => DiscoveryDecision
  ): Promise<{ decision: DiscoveryDecision; candidateDots?: DotInterpretation[]; impactOptions?: ImpactOptions }> => {
    try {
      const { data, error } = await supabase.functions.invoke<AiDiscoveryResponse>(
        "future-self-discovery",
        { body: { ...body, availableClusterSlugs: clusters.map(({ slug }) => slug) } }
      );

      if (error || !data) throw error || new Error("No Future Self response");

      const decision = normalizeInteractionDecision(
        applyQuestFlowContract(body, data, true)
      );

      return {
        decision,
        candidateDots: decision.action === "GENERATE_DOTS" ? data.candidateDots : [],
        impactOptions: data.impactOptions,
      };
    } catch (error) {
      console.warn("Future Self discovery fallback:", error);
      return {
        decision: normalizeInteractionDecision(
          applyQuestFlowContract(body, fallback())
        ),
      };
    }
  };

  const cancelAutoSend = () => {
    if (autoSendTimerRef.current) {
      window.clearTimeout(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }
    if (autoSendIntervalRef.current) {
      window.clearInterval(autoSendIntervalRef.current);
      autoSendIntervalRef.current = null;
    }
    setAutoSendSeconds(null);
  };

  const submitUserText = async (userText: string) => {
    const trimmedText = userText.trim();
    if (!trimmedText || isThinking) return;

    cancelAutoSend();
    setIsThinking(true);
    try {
      const currentUserTurnCount = messages.filter((message) => message.role === "user").length;
      const currentParams = new URLSearchParams(window.location.search);
      const freshSession = currentParams.has("fresh") && currentParams.get("mode") !== "next";

      const { decision: nextDecision, candidateDots: aiCandidateDots, impactOptions } =
        await askFutureSelfDiscovery(
          {
            mode: "conversation",
            userText: trimmedText,
            priorUserTurns: currentUserTurnCount,
            interactionCount: interactionResponses.length,
            usedInteractionKeys,
            freshSession: freshSession || currentUserTurnCount === 0,
            activeQuestTheme,
            recentMessages,
          },
          () => decideNextDiscoveryStep({
            text: trimmedText,
            source: messages.length === 1 ? "initial introduction" : "conversation",
            priorUserTurns: currentUserTurnCount,
            interactionCount: interactionResponses.length,
          })
        );

      setMessages((current) => [
        ...current,
        {
          id: `user-${Date.now()}`,
          role: "user",
          content: trimmedText,
        },
        ...(nextDecision.message ? [{
          id: `future-self-${Date.now()}`,
          role: "future-self" as const,
          content: nextDecision.message,
        }] : []),
      ]);
      applyDecision(nextDecision, aiCandidateDots);
      activateInteraction(nextDecision, trimmedText, impactOptions);
      setInput("");
    } finally {
      setIsThinking(false);
    }
  };

  const startAutoSend = (text: string) => {
    cancelAutoSend();
    setAutoSendSeconds(3);
    autoSendIntervalRef.current = window.setInterval(() => {
      setAutoSendSeconds((current) => {
        if (current === null || current <= 1) return current;
        return current - 1;
      });
    }, 1000);
    autoSendTimerRef.current = window.setTimeout(() => {
      submitUserText(text);
    }, 3200);
  };

  const appendTranscription = (text: string) => {
    const nextText = input ? `${input.trim()} ${text}` : text;
    setInput(nextText);
    startAutoSend(nextText);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await submitUserText(input);
  };

  const handleInteractionSubmit = async (response: unknown) => {
    if (!decision) return;

    setIsThinking(true);
    const currentUserTurnCount = messages.filter((message) => message.role === "user").length;
    const currentParams = new URLSearchParams(window.location.search);
    const freshSession = currentParams.has("fresh") && currentParams.get("mode") !== "next";
    const { decision: nextDecision, candidateDots: aiCandidateDots, impactOptions } =
      await askFutureSelfDiscovery(
        {
          mode: "interaction",
          activeMission: decision.activeMission,
          interactionResponse: response,
          priorUserTurns: currentUserTurnCount,
          interactionCount: interactionResponses.length + 1,
          usedInteractionKeys,
          freshSession,
          activeQuestTheme,
          recentMessages,
        },
        () => decideAfterDiscoveryInteraction({
          activeMission: decision.activeMission,
          interactionKey: decision.interactionKey,
          response,
        })
      );

    setInteractionResponses((current) => [...current, response]);
    setMessages((current) => [
      ...current,
      {
        id: `interaction-${Date.now()}`,
        role: "user",
        content: summarizeInteractionResponse(response),
      },
      ...(nextDecision.message ? [{
        id: `future-self-${Date.now()}`,
        role: "future-self" as const,
        content: nextDecision.message,
      }] : []),
    ]);
    applyDecision(nextDecision, aiCandidateDots);
    activateInteraction(nextDecision, summarizeInteractionResponse(response), impactOptions);
    setIsThinking(false);
  };

  const handleCandidateConfirm = async (
    primary?: DotInterpretation,
    extras?: DotInterpretation[],
    userEdited?: boolean
  ) => {
    const confirmed = [primary, ...(extras || [])].filter((dot): dot is DotInterpretation => Boolean(dot));
    if (confirmed.length === 0 || isSavingDot) return;

    setSelectedDots(confirmed);
    setValidationMode("confirmed");
    await handleSaveToAtlas(confirmed, userEdited);
  };

  const handleSaveToAtlas = async (
    dotsToSave = selectedDots,
    userEdited = false,
  ) => {
    if (!decision || dotsToSave.length === 0 || isSavingDot || savedDotTitle) return;

    const primaryDot = dotsToSave[0];
    const targetClusters = dotsToSave.map((dot) => clusters.find((cluster) => cluster.slug === dot.clusterSlug));
    const targetCluster = targetClusters[0];

    if (!targetCluster || targetClusters.some((cluster) => !cluster)) {
      toast({
        title: "Atlas area not ready",
        description: "I couldn't find one of the matching Atlas clusters yet.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingDot(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: savedQuests, error: progressError } = await supabase
        .from("atlas_quests")
        .select("quest_key, status, interactions")
        .eq("user_id", user.id)
        .eq("status", "completed");
      if (progressError) throw progressError;

      const progressBeforeSave = getFutureSelfOnboardingProgress(savedQuests || []);
      if (activeQuestTheme !== progressBeforeSave.nextTheme) {
        navigate("/atlas", { replace: true });
        return;
      }
      const signalSources = [
        "future_self_conversation",
        decision.activeMission,
        ...decision.coverage.covered,
      ];
      const questKey = `future_self_${decision.activeMission}_${activeQuestTheme}`;
      const questEvidence = Array.from(new Set([
        ...messages
          .filter((message) => message.role === "user")
          .map((message) => message.content),
        ...interactionResponses.map((response) => summarizeInteractionResponse(response)),
      ]))
        .map((evidence) => evidence.replace(/\s+/g, " ").trim().slice(0, 520))
        .filter(Boolean)
        .slice(0, 20);
      const activityEvidence = interactionResponses.map((response) => summarizeInteractionResponse(response));
      const offeredDots = candidateDots.slice(0, 3).map((dot) => ({
        title: dot.title,
        description: dot.description,
        dotCategory: dot.dotCategory,
        clusterSlug: dot.clusterSlug,
        sourceQuote: dot.sourceQuote,
      }));

      const dotPayloads: AtlasDotInsert[] = dotsToSave.map((dot, index) => ({
        id: crypto.randomUUID(),
        user_id: user.id,
        cluster_id: targetClusters[index]!.id,
        title: dot.title,
        short_description: dot.description,
        dot_type: "future_self_discovery",
        dot_category: dot.dotCategory,
        signal_sources: signalSources,
        signal_strength: Math.max(1, decision.coverage.covered.length),
        source_system: "future_self_discovery",
        confidence_score: 0.72,
        user_validated: true,
        user_edited: userEdited || !candidateDots.some((candidate) => candidate.title === dot.title
          && candidate.description === dot.description && candidate.dotCategory === dot.dotCategory
          && candidate.clusterSlug === dot.clusterSlug),
        original_title: dot.title,
        original_description: dot.description,
        signal_tags: {
          activeMission: decision.activeMission,
          questTheme: activeQuestTheme,
          sourceQuestKey: questKey,
          targetClusterSlug: targetClusters[index]!.slug,
          deferredSignals: decision.deferredSignals.map((signal) => signal.topic),
          evidenceClass: decision.evidence.map((item) => item.evidenceClass),
          questEvidence,
          activityEvidence,
          dotOrigin: "current_quest_evidence",
          sourceQuote: dot.sourceQuote,
        },
      }));

      const { data: savedDots, error } = await supabase
        .from("atlas_dots")
        .insert(dotPayloads)
        .select("id,title,short_description,dot_category");

      if (error) throw error;
      const savedById = new Map((savedDots || []).map((dot) => [dot.id, dot]));
      const savedDotRows = dotPayloads.map(({ id }) => {
        const saved = id ? savedById.get(id) : undefined;
        if (!saved) throw new Error("The Atlas did not return every saved Dot.");
        return saved;
      });
      const primarySavedDot = savedDotRows[0];
      const validatedDotProvenance = dotsToSave.map((dot, index) => ({
        savedDotId: savedDotRows[index]?.id || null,
        title: dot.title,
        description: dot.description,
        dotCategory: dot.dotCategory,
        clusterSlug: targetClusters[index]!.slug,
        sourceQuote: dot.sourceQuote,
        sourceQuestKey: questKey,
        questTheme: activeQuestTheme,
        evidence: questEvidence,
        activityEvidence,
      }));

      const lifetimeEvidence = messages
        .filter(({ role, id }) => role === "user" && !id.startsWith("interaction-"))
        .map(({ content }) => content);
      const reflection = interactionResponses.at(-1);
      if (reflection && typeof reflection === "object" && "lessonInOwnWords" in reflection
        && typeof reflection.lessonInOwnWords === "string") {
        lifetimeEvidence.push(reflection.lessonInOwnWords);
      }
      const lifetimeSeeds = buildLifetimeCandidates(decision.lifetimeMoments || [], lifetimeEvidence, validatedDotProvenance);

      const questPayload: AtlasQuestInsert = {
        user_id: user.id,
        cluster_id: targetCluster.id,
        quest_key: questKey,
        interactions: JSON.parse(JSON.stringify({
          source: "future_self_discovery",
          privateSignalMap: {
            principle: "collect_more_than_reveal",
            privateSignals: decision.privateSignals || [],
            nextMove: decision.nextMove || null,
            timelineCandidates: lifetimeSeeds,
            mentorHandoff: {
              currentGoal: "Use the user's account of what happened and what they learned to guide one relevant next step. Confirm inferred skills and project ideas before acting on them.",
              questTheme: activeQuestTheme,
              sourceQuestKey: questKey,
              questEvidence,
              followUpAnswers: recentMessages.filter(({ role }) => role === "user").slice(1).map(({ content }) => content.trim().slice(0, 520)),
              activityEvidence,
              offeredDots,
              validatedDots: validatedDotProvenance,
              validatedDotClusters: dotsToSave.map((dot, index) => ({
                title: dot.title,
                clusterSlug: targetClusters[index]!.slug,
                savedDotId: savedDotRows[index]?.id || null,
              })),
              activeProjectSeed: (decision.privateSignals || []).filter((signal) => signal.type === "project_seed"),
              transferableSkills: (decision.privateSignals || []).filter((signal) => signal.type === "transferable_skill"),
              valueSignals: (decision.privateSignals || []).filter((signal) => signal.type === "value_signal" || signal.type === "audience_signal"),
              recommendedMentor: decision.nextMove?.recommendedMentor || null,
              suggestedNextAction: decision.nextMove?.suggestedQuestion || null,
            },
          },
          conversationEvidence: decision.evidence,
          questEvidence,
          coverage: decision.coverage,
          interactionResponses,
          activityEvidence,
          offeredDots,
          selectedDotIds: savedDotRows.map((dot) => dot.id).filter(Boolean),
          dotProvenance: validatedDotProvenance,
          conversationTranscript: messages
            .filter((message) => message.role === "user" || message.role === "future-self")
            .map((message) => ({ role: message.role, content: message.content })),
          interactionKey: activeInteraction ? interactionKeyFor(activeInteraction) : null,
          questTheme: activeQuestTheme,
          activeMission: decision.activeMission,
          selectedDot: primaryDot,
          selectedDots: dotsToSave,
          deferredSignals: decision.deferredSignals,
        })),
        status: "completed",
        generated_dot_id: primarySavedDot.id,
        completed_at: new Date().toISOString(),
        is_onboarding: false,
        onboarding_sequence: null,
      };

      const { data: savedQuest, error: questError } = await supabase
        .from("atlas_quests")
        .insert(questPayload)
        .select("id")
        .single();
      if (questError) throw questError;

      // Update the progress cache before any navigation. The Atlas can mount
      // in the same render turn as this save, so waiting for invalidation alone
      // can briefly (or incorrectly) leave the Council path one quest behind.
      queryClient.setQueryData<any[]>(["atlas-quests-completed", user.id], (current = []) => {
        if (current.some((quest) => quest.id === savedQuest.id)) return current;
        return [
          ...current,
          {
            ...questPayload,
            id: savedQuest.id,
            created_at: questPayload.completed_at,
          },
        ];
      });

      const signalPayloads: AtlasSignalInsert[] = [
        decision.activeMission,
        ...decision.coverage.covered.slice(0, 4),
      ].map((signalName, index) => ({
        user_id: user.id,
        cluster_id: targetClusters[Math.min(index, targetClusters.length - 1)]!.id,
        signal_name: signalName,
        signal_category: "future_self_discovery",
        strength: index === 0 ? 2 : 1,
        source_quest_key: questKey,
        source_interaction_index: index,
      }));

      const { error: signalError } = await supabase.from("atlas_signals").insert(signalPayloads);
      if (signalError) throw signalError;

      const savedDotsForConnections: AtlasDot[] = savedDotRows.map((dot, index) => {
        const originalDot = dotsToSave[index] || primaryDot;
        const originalCluster = targetClusters[index] || targetCluster;
        return {
          id: dot.id,
          user_id: user.id,
          cluster_id: originalCluster.id,
          title: dot.title || originalDot.title,
          short_description: dot.short_description || originalDot.description,
          confidence_score: 0.72,
          dot_type: "future_self_discovery",
          dot_category: originalDot.dotCategory,
          signal_sources: signalSources,
          signal_strength: Math.max(1, decision.coverage.covered.length),
          source_system: "future_self_discovery",
          created_at: new Date().toISOString(),
        };
      });
      const clusterSlugMap = clusters.reduce<Record<string, string>>((map, cluster) => {
        map[cluster.id] = cluster.slug;
        return map;
      }, {});
      const { data: existingConnections, error: existingConnectionsError } = await supabase
        .from("atlas_connections")
        .select("dot_id_a, dot_id_b")
        .eq("user_id", user.id);

      if (existingConnectionsError) throw existingConnectionsError;

      const existingPairs = new Set(
        (existingConnections || [])
          .map((connection) => [connection.dot_id_a, connection.dot_id_b].filter(Boolean).sort().join(":"))
          .filter(Boolean)
      );
      const connectionPayloads: AtlasConnectionInsert[] = detectConnections(
        [...allExistingDots, ...savedDotsForConnections],
        existingPairs,
        clusterSlugMap
      )
        .map((connection) => ({
          user_id: user.id,
          dot_id_a: connection.dotIdA,
          dot_id_b: connection.dotIdB,
          connection_type: connection.connectionType,
          shared_signals: connection.sharedSignals,
          strength: connection.strength,
          insight_text: connection.insightText,
          is_gold_moment: connection.isGoldMoment,
        }));

      if (connectionPayloads.length > 0) {
        const { error: connectionError } = await supabase
          .from("atlas_connections")
          .insert(connectionPayloads);

        if (connectionError) throw connectionError;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["atlas-dots"] }),
        queryClient.invalidateQueries({ queryKey: ["atlas-quests-completed"] }),
        queryClient.invalidateQueries({ queryKey: ["atlas-signals"] }),
        queryClient.invalidateQueries({ queryKey: ["atlas-connections"] }),
        queryClient.invalidateQueries({ queryKey: ["atlas-connections-map"] }),
        queryClient.invalidateQueries({ queryKey: ["atlas-patterns"] }),
      ]);

      setSavedDotTitle(primaryDot.title);
      toast({
        title: "Discovery added to Atlas",
        description: dotsToSave.length === 1 ? primaryDot.title : `${dotsToSave.length} Dots saved`,
      });

      const params = new URLSearchParams({
        highlight: targetCluster.slug,
        clusterId: targetCluster.id,
        newDot: primaryDot.title,
        source: "future-self",
      });
      const atlasUrl = `/atlas?${params.toString()}`;
      setMessages((current) => [
        ...current,
        {
          id: `future-self-atlas-saved-${savedQuest.id}`,
          role: "future-self",
          content: savedDotRows.length === 1 ? "Your Dot is saved." : "Your Dots are saved.",
          savedDestinations: savedDotRows.map((dot, index) => {
            const cluster = targetClusters[index]!;
            const query = new URLSearchParams({
              highlight: cluster.slug,
              clusterId: cluster.id,
              newDot: dot.title,
              source: "future-self",
              viewSaved: "1",
            });
            return { title: dot.title, location: `Atlas · ${cluster.name}`, href: `/atlas?${query}` };
          }),
        },
      ]);
      if (!progressBeforeSave.consoleUnlocked) {
        navigate(atlasUrl, { replace: true });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Try again in a moment.";
      toast({
        title: "Could not save Dot",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSavingDot(false);
    }
  };

  const handleCandidateRegenerate = async (feedback?: string) => {
    if (!decision || isThinking || isSavingDot || !interactionResponses.length) return;
    setIsThinking(true);
    try {
      const { decision: nextDecision, candidateDots: nextDots } = await askFutureSelfDiscovery({
        mode: "interaction",
        activeMission: decision.activeMission,
        interactionResponse: interactionResponses[interactionResponses.length - 1],
        interactionCount: interactionResponses.length,
        priorUserTurns: messages.filter(({ role }) => role === "user").length,
        activeQuestTheme,
        recentMessages,
        candidateFeedback: feedback?.trim().slice(0, 500),
      }, () => decision);
      if (nextDots?.length) {
        applyDecision(nextDecision, nextDots);
      } else {
        toast({ title: "Couldn’t refresh your Dots", description: "Try again when you’re ready." });
      }
    } finally {
      setIsThinking(false);
    }
  };

  const handleContinueDiscovery = () => {
    setDecision(null);
    setActiveInteraction(null);
    setCandidateDots([]);
    setSelectedDots([]);
    setInteractionResponses([]);
    setUsedInteractionKeys([]);
    setValidationMode("picking");
    setSavedDotTitle(null);
    setMessages((current) => [
      ...current,
      {
        id: `future-self-continue-${Date.now()}`,
        role: "future-self",
        content: "Let's keep going. Tell me another part of your story, a project you tried, someone who shaped you, or a pattern you keep noticing in yourself.",
      },
    ]);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between border-b border-border/70 pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Future Self</p>
            <h1 className="mt-1 text-2xl font-semibold">Discovery</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={voiceModeEnabled ? "secondary" : "outline"}
              size="icon"
              onClick={() => setVoiceModeEnabled((enabled) => !enabled)}
              title={voiceModeEnabled ? "Use text mode" : "Use voice mode"}
              aria-label={voiceModeEnabled ? "Use text mode" : "Use voice mode"}
            >
              {voiceModeEnabled ? (
                <Mic className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Keyboard className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
            <Button
              type="button"
              variant={voiceRepliesEnabled ? "secondary" : "outline"}
              size="icon"
              onClick={() => {
                if (voiceRepliesEnabled) stopSpeaking();
                setVoiceRepliesEnabled((enabled) => !enabled);
              }}
              title={voiceRepliesEnabled ? "Turn spoken replies off" : "Turn spoken replies on"}
              aria-label={voiceRepliesEnabled ? "Turn spoken replies off" : "Turn spoken replies on"}
            >
              {voiceRepliesEnabled ? (
                <Volume2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <VolumeX className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => speakFutureSelfMessage(visibleLatestFutureSelfMessage)}
              disabled={!visibleLatestFutureSelfMessage}
              title="Replay latest Future Self reply"
              aria-label="Replay latest Future Self reply"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
        </header>

        <div className="flex-1 space-y-4 py-6">
          <FutureSelfConstellation mode={constellationMode} latestMessage={visibleLatestFutureSelfMessage} />

          {isSessionPreparing ? (
            <article className="flex justify-start">
              <div className="max-w-[86%] rounded-lg border border-border bg-card px-4 py-3 text-sm leading-6 text-card-foreground shadow-sm">
                Future Self is opening this part of your story...
              </div>
            </article>
          ) : messages.map((message) => (
            <article
              key={message.id}
              className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  message.role === "user"
                    ? "max-w-[86%] rounded-lg bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground shadow-sm"
                    : "max-w-[86%] rounded-lg border border-border bg-card px-4 py-3 text-sm leading-6 text-card-foreground shadow-sm"
                }
              >
                {message.content.split("\n").map((line, index) => (
                  <p key={`${message.id}-${index}`} className={index > 0 ? "mt-3" : undefined}>
                    {line}
                  </p>
                ))}
                {message.savedDestinations && (
                  <ul className="mt-3 space-y-2" aria-label="Saved updates">
                    {message.savedDestinations.map((destination) => (
                      <li key={destination.href}>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-auto w-full justify-between gap-3 whitespace-normal py-2 text-left"
                          onClick={() => navigate(destination.href)}
                        >
                          <span>
                            <span className="block text-xs text-muted-foreground">{destination.location}</span>
                            <span className="block">{destination.title}</span>
                          </span>
                          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))}

          {activeInteraction && (
            <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="mb-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {activeInteraction.type === "turning_point_lesson" ? "Turn this moment into a lesson" : "Quick reflection"}
                </p>

              </div>
              <AtlasQuestInteraction
                interaction={activeInteraction}
                onSubmit={handleInteractionSubmit}
              />
            </section>
          )}

          {isThinking && (
            <article className="flex justify-start">
              <div className="max-w-[86%] rounded-lg border border-border bg-card px-4 py-3 text-sm leading-6 text-card-foreground shadow-sm">
                Future Self is reading for the strongest signal...
              </div>
            </article>
          )}

          {decision?.action === "GENERATE_DOTS" && candidateDots.length === 0 && !savedDotTitle && !isThinking && (
            <section className="space-y-3 rounded-lg border border-border bg-card p-4">
              <p role="status" className="text-sm text-card-foreground">
                I couldn’t prepare your Dots this time. You can try again with the answers you already shared.
              </p>
              <Button type="button" variant="outline" onClick={() => void handleCandidateRegenerate()}>
                Try again
              </Button>
            </section>
          )}

          {candidateDots.length > 0 && decision && validationMode !== "confirmed" && (
            <section className="rounded-lg border border-border bg-card py-5 shadow-sm">
              <AtlasWinningCard
                key={candidateRevision}
                editEachCandidate
                dot={candidateDots[0]}
                clusterName="Future Self Discovery"
                onConfirm={handleCandidateConfirm}
                onRegenerate={handleCandidateRegenerate}
                variations={candidateDots}
                validationMode={validationMode}
                onSetValidationMode={setValidationMode}
                isLoading={isSavingDot}
                confirmLabel={isSavingDot ? "Saving to Atlas" : "Save to Atlas"}
                mirrorFeedback="Here’s what I picked up from your answers. Choose or edit what feels true to you, then save it to your Atlas."
              />
            </section>
          )}

          {selectedDots.length > 0 && !savedDotTitle && (
            <section className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Validated candidate
              </p>
              <div className="mt-3 space-y-3">
                {selectedDots.map((dot) => (
                  <div key={dot.title}>
                    <p className="font-semibold text-foreground">{dot.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{dot.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  onClick={() => handleSaveToAtlas()}
                  disabled={isSavingDot}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  {isSavingDot ? "Saving..." : "Save to Atlas"}
                </Button>
              </div>
            </section>
          )}
          {savedDotTitle && (
            <Button type="button" variant="ghost" onClick={handleContinueDiscovery}>
              Continue discovery
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="sticky bottom-0 space-y-3 border-t border-border/70 bg-background py-4">
          {voiceModeEnabled && (
            <section className="rounded-lg border border-primary/25 bg-primary/5 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Talk to Future Self</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Speak naturally. I will place the transcript below so you can send it when it feels right.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <VoiceRecorder
                    onTranscription={appendTranscription}
                    disabled={isSessionPreparing || isThinking || isSpeaking}
                    idleLabel="Talk to Future Self"
                    onStateChange={({ isRecording, isProcessing }) => {
                      setIsRecordingVoice(isRecording);
                      setIsProcessingVoice(isProcessing);
                    }}
                  />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {voiceRepliesEnabled && (
                      <span>{isSpeaking ? "Future Self is speaking..." : "Spoken replies on"}</span>
                    )}
                    {latestFutureSelfMessage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => speakFutureSelfMessage(visibleLatestFutureSelfMessage)}
                      >
                        Replay
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
          <Textarea
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              if (autoSendSeconds !== null) cancelAutoSend();
            }}
            placeholder={voiceModeEnabled ? "Your spoken words will appear here. You can edit before sending." : "Write freely. A few paragraphs is welcome."}
            className={voiceModeEnabled ? "min-h-24 resize-y text-base leading-7" : "min-h-36 resize-y text-base leading-7"}
            disabled={isThinking}
          />
          {voiceModeEnabled && autoSendSeconds !== null && input.trim().length > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground">
                Sending in <span className="font-semibold text-foreground">{autoSendSeconds}</span>. Edit the transcript to pause.
              </p>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={cancelAutoSend}>
                  Edit first
                </Button>
                <Button type="button" size="sm" onClick={() => submitUserText(input)} disabled={isThinking}>
                  Send now
                </Button>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              {!voiceModeEnabled && (
                <>
                  <VoiceRecorder
                    onTranscription={appendTranscription}
                    disabled={isSessionPreparing || isThinking || isSpeaking}
                    onStateChange={({ isRecording, isProcessing }) => {
                      setIsRecordingVoice(isRecording);
                      setIsProcessingVoice(isProcessing);
                    }}
                  />
                  {voiceRepliesEnabled && (
                    <p className="text-xs text-muted-foreground">
                      {isSpeaking ? "Future Self is speaking..." : "Voice replies are on."}
                    </p>
                  )}
                </>
              )}
            </div>
            <Button type="submit" disabled={!canSubmit || isSessionPreparing || isThinking} className="gap-2 sm:min-w-32">
              {isThinking ? "Reading..." : "Send"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default FutureSelfDiscovery;
