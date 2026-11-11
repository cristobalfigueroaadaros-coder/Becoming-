import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Keyboard, Mic, RotateCcw, Sparkles, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { AtlasQuestInteraction } from "@/components/atlas/AtlasQuestInteraction";
import { AtlasWinningCard, ValidationMode } from "@/components/atlas/AtlasWinningCard";
import { LifetimeEventEditModal } from "@/components/lifetime-map";
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
import { EventType, LifetimeEventInput, TIME_PERIOD_LABELS, TimePeriod, useLifetimeEvents } from "@/hooks/useLifetimeEvents";
import type { LifetimeEventCandidate } from "@/hooks/useLifetimeEvents";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { extractLifetimeCandidates } from "@/lib/lifetimeCandidates";

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

type CouncilHandoff = {
  atlasUrl: string;
  councilUrl: string;
};

type LifetimeAnchorInvite = CouncilHandoff & {
  suggestedLabel: string;
  suggestedDescription: string;
  suggestedTimePeriod: TimePeriod;
  suggestedEventType: EventType;
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

const QUEST_OPENING_KEYWORDS: Record<Exclude<DiscoveryQuestTheme, "origin">, string[]> = {
  gifts: ["skill", "learn", "connect", "create", "experience", "influence", "talent", "curious"],
  world: ["help", "serve", "impact", "people", "gift", "purpose", "creator", "community"],
  experiments: ["build", "built", "test", "create", "project", "iterate", "feedback", "family", "festival"],
  current: ["action", "decision", "challenge", "project", "future", "move", "create", "experiment"],
};

const joinOpeningReferences = (references: string[]) => {
  if (references.length <= 1) return references[0] || "what you have already shared";
  if (references.length === 2) return `${references[0]} and ${references[1]}`;
  return `${references.slice(0, -1).join(", ")}, and ${references[references.length - 1]}`;
};

const openingDotReferences = (
  dots: AtlasDot[],
  theme: Exclude<DiscoveryQuestTheme, "origin">,
) => {
  const keywords = QUEST_OPENING_KEYWORDS[theme];
  const uniqueDots = dots.filter((dot, index, allDots) =>
    Boolean(dot.title) && allDots.findIndex((candidate) => candidate.title === dot.title) === index,
  );
  const selected = uniqueDots
    .map((dot, index) => {
      const searchableText = `${dot.title} ${dot.short_description || ""}`.toLowerCase();
      const relevance = keywords.reduce((score, keyword) => score + (searchableText.includes(keyword) ? 1 : 0), 0);
      return { dot, score: relevance * 10 + index };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(({ dot }) => {
      const description = dot.short_description?.replace(/\s+/g, " ").trim();
      const shortDescription = description && description.length > 96
        ? `${description.slice(0, 93).trimEnd()}...`
        : description;
      return shortDescription ? `${dot.title} — ${shortDescription}` : dot.title;
    });

  return selected.length > 0 ? joinOpeningReferences(selected) : "what you have already shared";
};

const buildNextQuestInvitation = (dots: AtlasDot[], completedFutureSelfQuests = 0) => {
  if (completedFutureSelfQuests <= 1) {
    const context = openingDotReferences(dots, "gifts");
    return `I'm carrying forward ${context}. I don't want you to start from zero.\n\nThis time, I want to understand the person and the abilities underneath those experiences: who shaped the way you work, what comes naturally to you, and what you had to learn.\n\nTell me about someone who influenced you, a skill you had to learn, or something you feel naturally good at. What did it teach you about yourself?`;
  }

  if (completedFutureSelfQuests === 2) {
    const context = openingDotReferences(dots, "world");
    return `I'm carrying forward ${context}. You have begun to show me what matters to you; now I want to follow that care outward.\n\nThis part is about the people who could genuinely benefit from what you are learning and creating, not an abstract mission.\n\nWhen you imagine a better world, who do you feel called to help first, and why them?`;
  }

  if (completedFutureSelfQuests === 3) {
    const context = openingDotReferences(dots, "experiments");
    return `I'm carrying forward ${context}. You have named the people and change you care about; now I want to ground that vision in what you have actually put into the world.\n\nTell me about something you created, tested, organized, built, helped with, or attempted. What did that experiment teach you that you could use again?`;
  }

  const context = openingDotReferences(dots, "current");
  return `I'm carrying forward ${context}. We have explored where you came from, what you can do, who you want to help, and what you have already tried.\n\nNow I want to connect that learning with the edge of your life today.\n\nTell me about a recent action, challenge, relationship, idea, or decision that feels important right now. What are you learning from it?`;
};

const questThemeForProgress = (completedFutureSelfQuests: number): DiscoveryQuestTheme => {
  if (completedFutureSelfQuests <= 1) return "gifts";
  if (completedFutureSelfQuests === 2) return "world";
  if (completedFutureSelfQuests === 3) return "experiments";
  return "current";
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

const dotCategoryByMission: Record<DiscoveryMission, DotInterpretation["dotCategory"]> = {
  skills: "strength",
  natural_talents: "life_imprint",
  passions: "strength",
  experiments: "strength",
  inspirations: "strength",
};

const fallbackDotsByMission: Record<DiscoveryMission, DotInterpretation[]> = {
  skills: [
    { title: "Turns Ideas Into Reality", description: "You keep moving from idea to built thing, using business, travel, and product work as your proving ground.", dotCategory: "strength", clusterSlug: "skills" },
    { title: "Learns by Building", description: "Your evidence comes from doing: launching, testing, refining, and learning through contact with real life.", dotCategory: "strength", clusterSlug: "skills" },
    { title: "Connects Through Creation", description: "Your work points toward building things that help people relate, learn, and spend more meaningful time together.", dotCategory: "strength", clusterSlug: "how-i-create-impact" },
  ],
  natural_talents: [
    { title: "Sees What Could Exist", description: "You naturally notice the gap between what people experience now and what could help them grow or connect.", dotCategory: "life_imprint", clusterSlug: "natural-talents" },
    { title: "Follows Inner Signals", description: "You seem pulled by an internal sense of direction, especially when an idea feels connected to service or impact.", dotCategory: "life_imprint", clusterSlug: "natural-talents" },
    { title: "Finds Meaning in Pressure", description: "Hard moments become places where you look for purpose, direction, and the next thing to create.", dotCategory: "life_imprint", clusterSlug: "life-events" },
  ],
  passions: [
    { title: "Drawn to Human Connection", description: "Your energy gathers around bringing people closer, especially families, parents, and children.", dotCategory: "strength", clusterSlug: "passions" },
    { title: "Loves Transformative Play", description: "Family Squad shows a passion for using play as a way to build emotional intelligence and deeper bonds.", dotCategory: "strength", clusterSlug: "passions" },
    { title: "Curious About Human Growth", description: "You keep returning to how people become better, express their gifts, and give something useful back.", dotCategory: "direction", clusterSlug: "vision-for-a-better-world" },
  ],
  experiments: [
    { title: "Built Family Squad for Connection", description: "Family Squad is not just a game; it is evidence that you build experiences where parents and children can open up, share, and feel safe together.", dotCategory: "strength", clusterSlug: "experiments" },
    { title: "Creates Experiences People Feel", description: "The e-commerce, Family Squad, and Bali festival all point to a repeatable instinct: you shape environments where people feel connected to something.", dotCategory: "strength", clusterSlug: "how-i-create-impact" },
    { title: "Tests Ideas in Real Life", description: "You learn by putting ideas into the world: selling online, designing cards, creating events, seeing how people respond, and refining from there.", dotCategory: "strength", clusterSlug: "skills" },
  ],
  inspirations: [
    { title: "Serves Through His Gift", description: "You return to the belief that each person has a gift and that the meaningful move is to turn it into something useful for society.", dotCategory: "strength", clusterSlug: "values" },
    { title: "Called to Conscious Creators", description: "You named people finding themselves and conscious creators as the people you want to help and connect.", dotCategory: "direction", clusterSlug: "who-i-serve" },
    { title: "Builds for Human Betterment", description: "Your future direction is not just to build another project; it is to help people become clearer, more connected, and more able to give their gift back.", dotCategory: "direction", clusterSlug: "vision-for-a-better-world" },
  ],
};

const dotIncludes = (text: string, terms: string[]) => terms.some((term) => text.includes(term));

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

const directionClusterSlugs = new Set([
  "who-i-serve",
  "vision-for-a-better-world",
]);

const normalizeDotClassification = (dot: DotInterpretation): DotInterpretation => {
  if ((!dot.dotCategory || dot.dotCategory === "strength") && directionClusterSlugs.has(dot.clusterSlug || "")) {
    return { ...dot, dotCategory: "direction" };
  }
  return dot;
};

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

const buildWorldImpactDots = (evidenceText: string): DotInterpretation[] => {
  const normalized = evidenceText.toLowerCase();
  const dots: DotInterpretation[] = [];
  const namesPeopleFindingThemselves = /feel(?:ing)? lost|finding themselves|find themselves|find their gift|gift and direction|understand who they are|purpose/.test(normalized);
  const namesCreators = /conscious creator|conscious creators|connect creators|connect .*people|collaborat|platform|unify|movement/.test(normalized);
  const namesCollectiveImpact = /collective|society|positive impact|change the world|help each other|serve|contribut/.test(normalized);
  const namesNeeds = /clarity|courage|connection|structure|belief|belong|unify|time and effort|scary|insecurit|fear/.test(normalized);

  if (namesPeopleFindingThemselves) {
    dots.push({
      title: "Guides People From Lost to Contribution",
      description: "You want to help people who are trying to find themselves recognize their gift, turn it into something real, and offer it back to society.",
      dotCategory: "direction",
      clusterSlug: "who-i-serve",
    });
  }

  if (namesCreators && namesCollectiveImpact) {
    dots.push({
      title: "Connects Conscious Creators for Collective Impact",
      description: "You imagine a platform or movement where conscious creators can find one another, collaborate, and make a wider contribution together.",
      dotCategory: "direction",
      clusterSlug: "vision-for-a-better-world",
    });
  }

  if (namesNeeds) {
    dots.push({
      title: "Builds Belonging for Difficult Beginnings",
      description: "You understand that finding a gift can be slow and frightening, so the help you want to create needs to offer clarity, courage, connection, and a reason to keep moving.",
      dotCategory: "direction",
      clusterSlug: "how-i-create-impact",
    });
  }

  return dots;
};

const buildOriginDots = (evidenceText: string): DotInterpretation[] => {
  const normalized = evidenceText.toLowerCase();
  const dots: DotInterpretation[] = [];

  if ((normalized.includes("chile") || normalized.includes("home")) && (normalized.includes("germany") || normalized.includes("berlin") || normalized.includes("australia") || normalized.includes("melbourne"))) {
    dots.push({
      title: "Rebuilt Through New Worlds",
      description: "Moving between Chile, Germany, and Australia made adaptation part of your identity. You learned to meet unfamiliar places and keep becoming through the difference.",
      dotCategory: "life_imprint",
      clusterSlug: "life-events",
    });
  }

  if (/resilien|adapt|trust myself|trust in myself|bring .*reality|solve difficult/.test(normalized)) {
    dots.push({
      title: "Trusts Learning Under Pressure",
      description: "You described resilience as the ability to adapt, learn quickly, solve difficult problems, and bring an idea from your mind into reality.",
      dotCategory: "strength",
      clusterSlug: "natural-talents",
    });
  }

  if (/aha|realization|family squad|festival|e-commerce|built|created|developed/.test(normalized)) {
    dots.push({
      title: "Turns Insight Into Creation",
      description: "Your story moves from a lived realization into something tangible: a business, a festival, or a creation designed to change how people experience life together.",
      dotCategory: "strength",
      clusterSlug: "aha-moments",
    });
  }

  return dots;
};

const buildGiftsDots = (evidenceText: string): DotInterpretation[] => {
  const normalized = evidenceText.toLowerCase();
  const dots: DotInterpretation[] = [];

  if (/grandfather|father|influenced|inspiration|vocation|serve society/.test(normalized)) {
    dots.push({
      title: "Learns Service Through Example",
      description: "The people who shaped you showed that a skill or vocation becomes more powerful when it is used to give people hope and help them around you.",
      dotCategory: "life_imprint",
      clusterSlug: "inspirations",
    });
  }

  if (/connect(?:ing)? people|connect(?:ing)? ideas|connect dots|patterns|different perspectives|break down/.test(normalized)) {
    dots.push({
      title: "Connects People, Ideas, and Patterns",
      description: "You naturally break complex things into parts, learn from different perspectives, and reconnect them into a clearer idea or a more original experience.",
      dotCategory: "strength",
      clusterSlug: "natural-talents",
    });
  }

  if (/experience|feel|emotion|event|game|family squad|festival/.test(normalized)) {
    dots.push({
      title: "Designs What People Remember",
      description: "You pay attention to what people feel, not only what they do, and use that understanding to create experiences that stay with them.",
      dotCategory: "strength",
      clusterSlug: "how-i-create-impact",
    });
  }

  return dots;
};

const buildCurrentDots = (evidenceText: string): DotInterpretation[] => {
  const normalized = evidenceText.toLowerCase();
  const dots: DotInterpretation[] = [];

  if (/meeting|opportunity|festival|movement|conscious creator/.test(normalized)) {
    dots.push({
      title: "Turns Openings Into Experiments",
      description: "You treat a meeting or opportunity as a doorway to test whether an idea can become a real experience and eventually a wider movement.",
      dotCategory: "strength",
      clusterSlug: "experiments",
    });
  }

  if (/stuck|finish|complete|working with ai|next chapter|new opportunity/.test(normalized)) {
    dots.push({
      title: "Finishes One Chapter to Open Another",
      description: "You are noticing the tension between finishing what is in front of you and making room for the next opportunity, which gives your next move a real constraint.",
      dotCategory: "shadow",
      clusterSlug: "personal-frustrations",
    });
  }

  if (/learn|feedback|iterate|test|improv|try again|decision|challenge/.test(normalized)) {
    dots.push({
      title: "Uses Action to Find Clarity",
      description: "You tend to learn what is true by making a move, seeing what reality teaches you, and using that information to choose the next version.",
      dotCategory: "strength",
      clusterSlug: "experiments",
    });
  }

  return dots;
};

const buildQuestThemeDots = (
  questTheme: DiscoveryQuestTheme,
  evidenceText: string,
): DotInterpretation[] => {
  const specificDots = questTheme === "origin"
    ? buildOriginDots(evidenceText)
    : questTheme === "gifts"
      ? buildGiftsDots(evidenceText)
      : questTheme === "world"
        ? buildWorldImpactDots(evidenceText)
        : questTheme === "experiments"
          ? buildExperimentDots(evidenceText)
          : buildCurrentDots(evidenceText);

  const fallbackDots: Record<DiscoveryQuestTheme, DotInterpretation[]> = {
    origin: [
      { title: "Names the Chapters That Shaped Them", description: "This first story is becoming a record of the places, changes, and experiences that shaped how they see themselves now.", dotCategory: "life_imprint", clusterSlug: "life-events" },
      { title: "Turns Change Into Learning", description: "The way they describe change already carries a lesson they can bring into the next chapter of life and creation.", dotCategory: "strength", clusterSlug: "aha-moments" },
      { title: "Carries Experience Into Creation", description: "Their story links what they have lived with what they feel capable of making next.", dotCategory: "strength", clusterSlug: "natural-talents" },
      { title: "Makes a Home in Motion", description: "Even when the setting changes, they keep building a sense of self through what they notice, learn, and make next.", dotCategory: "life_imprint", clusterSlug: "life-events" },
      { title: "Learns Who They Are Through Difference", description: "New cultures and unfamiliar situations became mirrors that helped them discover which qualities were truly theirs.", dotCategory: "life_imprint", clusterSlug: "values" },
      { title: "Carries Courage Into the Next Chapter", description: "The first story is not only about where they have been; it shows the courage they carry into whatever they create next.", dotCategory: "strength", clusterSlug: "natural-talents" },
    ],
    gifts: [
      { title: "Learns From the People Around Them", description: "Their gifts have been shaped through close observation, influence, and a willingness to learn from people who know something valuable.", dotCategory: "life_imprint", clusterSlug: "inspirations" },
      { title: "Makes Connections Others Miss", description: "Their natural contribution may be the ability to join ideas, people, and perspectives into something clearer and more useful.", dotCategory: "strength", clusterSlug: "natural-talents" },
      { title: "Creates Experiences With Feeling", description: "Their strengths are not only technical; they include shaping the emotional experience people have while taking part.", dotCategory: "strength", clusterSlug: "how-i-create-impact" },
      { title: "Turns Curiosity Into Capability", description: "They do not admire a skill from a distance; they study it, learn it, and make it part of what they can offer.", dotCategory: "strength", clusterSlug: "skills" },
      { title: "Makes Complexity Usable", description: "They can break a difficult idea into parts, understand what matters, and reconnect it in a form people can use.", dotCategory: "strength", clusterSlug: "natural-talents" },
      { title: "Builds Feeling Into Form", description: "They translate an intention about connection or emotion into the details of an experience people can actually enter.", dotCategory: "strength", clusterSlug: "how-i-create-impact" },
    ],
    world: [
      { title: "Guides People Toward Their Gift", description: "The change they want to create begins with helping people understand what makes them unique and turn that understanding into contribution.", dotCategory: "direction", clusterSlug: "who-i-serve" },
      { title: "Connects Creators Who Can Help Each Other", description: "They see conscious creators as a second audience: people whose combined gifts could create more impact together.", dotCategory: "direction", clusterSlug: "vision-for-a-better-world" },
      { title: "Makes Belonging Part of Growth", description: "They want people to feel less alone while they find direction, build something, and become part of a wider human effort.", dotCategory: "direction", clusterSlug: "how-i-create-impact" },
      { title: "Makes Self-Discovery a Shared Practice", description: "They imagine finding a gift as something people can do with support, connection, and other creators rather than in isolation.", dotCategory: "direction", clusterSlug: "who-i-serve" },
      { title: "Builds a Bridge Between Lost People and Creators", description: "Their vision joins two groups they named: people searching for direction and conscious creators who can help one another act on their gifts.", dotCategory: "direction", clusterSlug: "vision-for-a-better-world" },
      { title: "Turns Personal Gifts Into Collective Work", description: "They believe individual purpose becomes more powerful when people connect their different gifts to serve something larger together.", dotCategory: "direction", clusterSlug: "how-i-create-impact" },
    ],
    experiments: [
      ...buildExperimentDots(evidenceText),
      { title: "Builds Toward a Human Moment", description: "They begin with the feeling or connection they want people to experience, then shape the mechanics and details around that moment.", dotCategory: "strength", clusterSlug: "how-i-create-impact" },
      { title: "Combines Many Fields Into One Experience", description: "They gather ideas from different subjects and turn them into one experience that could not have come from a single discipline.", dotCategory: "strength", clusterSlug: "skills" },
      { title: "Improves Until People Respond", description: "They use real reactions, feedback, and repeated attempts to move an idea from what they imagined toward what people can actually feel.", dotCategory: "strength", clusterSlug: "experiments" },
    ],
    current: [
      { title: "Turns Openings Into Experiments", description: "They learn what an opportunity can become by giving it a concrete next step and watching what reality says.", dotCategory: "strength", clusterSlug: "experiments" },
      { title: "Finishes What Makes the Next Move Possible", description: "They are learning how completion, focus, and the next opportunity are connected in this moment.", dotCategory: "shadow", clusterSlug: "personal-frustrations" },
      { title: "Uses Action to Find Clarity", description: "They understand themselves and their direction more clearly after making a real move and reflecting on what happened.", dotCategory: "strength", clusterSlug: "values" },
      { title: "Uses This Opening to Learn", description: "They do not need to know the whole future before moving; a real conversation or test can reveal what deserves to grow.", dotCategory: "strength", clusterSlug: "experiments" },
      { title: "Completes the Work That Unlocks the Next Chapter", description: "They are using the unfinished work in front of them as a practical doorway into the opportunity they want next.", dotCategory: "shadow", clusterSlug: "personal-frustrations" },
      { title: "Turns Uncertainty Into a Small Test", description: "When the direction is not fully clear, they can make the next decision concrete enough for reality to answer.", dotCategory: "strength", clusterSlug: "experiments" },
    ],
  };

  const unique = new Map<string, DotInterpretation>();
  [...specificDots, ...fallbackDots[questTheme]].forEach((dot) => {
    if (!dot.title || !dot.description || hasGenericDotTitle(dot.title)) return;
    const key = dot.title.trim().toLowerCase();
    if (!unique.has(key)) unique.set(key, dot);
  });
  return Array.from(unique.values());
};

const buildExperimentDots = (evidenceText: string): DotInterpretation[] => {
  const normalized = evidenceText.toLowerCase();
  const mentionsFamilySquad = normalized.includes("family squad");

  if (mentionsFamilySquad) {
    return [
      {
        title: "Designed Mechanics for a Family Hug",
        description: "With Family Squad, you combined cards and game mechanics until a child hugging a parent could happen naturally. You were designing toward a human moment, not simply completing a game.",
        dotCategory: "strength",
        clusterSlug: "experiments",
      },
      {
        title: "Learns Across Fields to Build",
        description: "You learned psychology, game theory, gamification, parenting, game design, and visual design because one creation required all of them. You turn cross-disciplinary learning into something people can actually use.",
        dotCategory: "strength",
        clusterSlug: "skills",
      },
      {
        title: "Iterates Until Connection Happens",
        description: "You test, listen to feedback, improve, and keep going through difficult days until the experience creates the connection you intended. Iteration became a way to turn resilience into a result people can feel.",
        dotCategory: "strength",
        clusterSlug: "how-i-create-impact",
      },
    ];
  }

  return [
    {
      title: "Learns Across Fields to Build",
      description: "You pull knowledge from different subjects and perspectives, then combine it into a creation that could not have come from one discipline alone.",
      dotCategory: "strength",
      clusterSlug: "skills",
    },
    {
      title: "Turns Feedback Into the Next Version",
      description: "You put an idea into reality, listen to what happens, and use the feedback to make the next version more useful and more alive.",
      dotCategory: "strength",
      clusterSlug: "experiments",
    },
    {
      title: "Designs Toward a Felt Outcome",
      description: "You begin with the feeling or human change you want to create, then shape the experience and its details until people can actually feel that shift.",
      dotCategory: "strength",
      clusterSlug: "how-i-create-impact",
    },
  ];
};

const ensureThreeDistinctDots = (
  dots: DotInterpretation[],
  evidenceText: string,
  activeMission: DiscoveryMission,
  questTheme: DiscoveryQuestTheme,
  existingDots: AtlasDot[],
): DotInterpretation[] => {
  const questSpecificDots = buildQuestThemeDots(questTheme, evidenceText);
  const fallbackDots = fallbackDotsByMission[activeMission] || [];
  const unique = new Map<string, DotInterpretation>();

  // Theme-grounded candidates come first. AI candidates can enrich the set,
  // but they must not displace the current quest's actual subject.
  [...questSpecificDots, ...dots, ...fallbackDots].map(normalizeDotClassification).forEach((dot) => {
    if (!dot.title || !dot.description || hasGenericDotTitle(dot.title)) return;
    if (dotMatchesExistingEvidence(dot, existingDots)) return;
    const key = dot.title.trim().toLowerCase();
    if (!unique.has(key)) unique.set(key, dot);
  });

  const candidates = Array.from(unique.values());
  if (candidates.length >= 3) return candidates.slice(0, 3);

  // Keep the three-choice reward stable even when older Dots overlap. These
  // are still tied to the current quest theme and are never copied verbatim.
  // The theme pool contains evidence-grounded alternatives beyond the first
  // three. Use them before reusing an older Dot so the reward remains fresh.
  buildQuestThemeDots(questTheme, evidenceText).forEach((dot) => {
    if (candidates.length >= 3 || !dot.title || !dot.description) return;
    if (dotMatchesExistingEvidence(dot, existingDots)) return;
    const key = dot.title.trim().toLowerCase();
    if (unique.has(key)) return;
    unique.set(key, dot);
    candidates.push(dot);
  });

  return candidates.slice(0, 3);
};

const enrichDotsFromEvidence = (
  dots: DotInterpretation[],
  evidenceText: string,
  activeMission: DiscoveryMission,
  questTheme?: DiscoveryQuestTheme,
): DotInterpretation[] => {
  const normalized = evidenceText.toLowerCase();

  // The World quest needs to reveal the user's intended audience and change,
  // not recycle older creation or gift signals from the opening.
  if (questTheme === "world") {
    const worldDots = buildWorldImpactDots(evidenceText);
    if (worldDots.length > 0) return worldDots.slice(0, 3);
  }

  if (questTheme === "experiments") {
    return buildExperimentDots(evidenceText);
  }

  const specificDots: DotInterpretation[] = [];
  const hasIterationEvidence = /\b(iterat|test|feedback|improv|refin|try again|consistent|handle my emotions|manage my emotions|expectations|confidence|bring .*reality)\w*/.test(normalized);
  const hasCrossDisciplinaryLearning = /different (topics|angles|perspectives|subjects)|many (topics|different)|game design|game theory|psychology|parenting|gamification|learn a lot/.test(normalized);
  const hasEmotionalExperienceDesign = /people forget.*felt|emotions involved|transmutation of emotions|higher frequency|everything .*experience/.test(normalized);
  const prefersFreshExperimentDots = hasIterationEvidence && (
    hasCrossDisciplinaryLearning || normalized.includes("feedback") || normalized.includes("confidence")
  );

  if (normalized.includes("chile") && (normalized.includes("berlin") || normalized.includes("germany")) && (normalized.includes("australia") || normalized.includes("melbourne"))) {
    specificDots.push({
      title: "Rebuilt Himself Across Cultures",
      description: "Moving from Chile through Germany and Australia gave you repeated chances to adapt, learn from difference, and become someone you could trust in unfamiliar places.",
      dotCategory: "life_imprint",
      clusterSlug: "life-events",
    });
  }

  if ((normalized.includes("resilien") || normalized.includes("adapt")) && (normalized.includes("trust myself") || normalized.includes("bring .*reality") || normalized.includes("bring what"))) {
    specificDots.push({
      title: "Trusts Himself to Build",
      description: "Your resilience is practical: when circumstances change, you learn what is needed and keep moving until the idea in your mind becomes something real.",
      dotCategory: "strength",
      clusterSlug: "natural-talents",
    });
  }

  if (normalized.includes("gift") && normalized.includes("society") && (normalized.includes("people") || normalized.includes("help"))) {
    specificDots.push({
      title: "Helps Gifts Become Contribution",
      description: "You want people to understand what makes them unique, create something from it, and give that contribution back to society.",
      dotCategory: "direction",
      clusterSlug: "vision-for-a-better-world",
    });
  }

  if (hasIterationEvidence) {
    specificDots.push({
      title: "Turns Feedback Into Progress",
      description: "You move an idea forward by testing it early, facing what did not work, managing your expectations, and improving from what reality teaches you.",
      dotCategory: "strength",
      clusterSlug: "experiments",
    });
  }

  if (hasCrossDisciplinaryLearning) {
    specificDots.push({
      title: "Learns Across Disciplines to Create",
      description: "You combine learning from gamification, game design, psychology, parenting, design, and other fields to shape experiences that could not come from one subject alone.",
      dotCategory: "strength",
      clusterSlug: "skills",
    });
  }

  if (hasEmotionalExperienceDesign) {
    specificDots.push({
      title: "Designs Experiences That Shift Emotion",
      description: "You design the journey around what people feel, aiming to move them from one emotional state to another through the interactions and atmosphere you create.",
      dotCategory: "strength",
      clusterSlug: "how-i-create-impact",
    });
  }

  if ((normalized.includes("built the confidence") || normalized.includes("bring what is in my mind") || normalized.includes("bring what is an idea in my mind")) && hasIterationEvidence) {
    specificDots.push({
      title: "Builds Confidence by Making Ideas Real",
      description: "Repeatedly turning ideas into tested, improving creations has given you evidence that you can learn what is needed and bring something real into the world.",
      dotCategory: "strength",
      clusterSlug: "natural-talents",
    });
  }

  if ((normalized.includes("professional skills thief") || normalized.includes("learn skills from") || normalized.includes("learn skills from different people")) && (normalized.includes("father") || normalized.includes("fast learner"))) {
    specificDots.push({
      title: "Learns Skills by Studying People",
      description: "You deliberately observe people who do something well, learn the skill from them, and carry it into your own work. That makes curiosity a practical way you grow.",
      dotCategory: "strength",
      clusterSlug: "skills",
    });
  }

  if ((normalized.includes("patterns") || normalized.includes("break down")) && (normalized.includes("connect") || normalized.includes("different perspectives") || normalized.includes("nature"))) {
    specificDots.push({
      title: "Sees Patterns Across Worlds",
      description: "You break complex situations into parts, then reconnect ideas from business, nature, and people into something useful and new.",
      dotCategory: "strength",
      clusterSlug: "natural-talents",
    });
  }

  if ((normalized.includes("coach") || normalized.includes("coaching")) && (normalized.includes("gift") || normalized.includes("purpose"))) {
    specificDots.push({
      title: "Turns Gifts Into Guidance",
      description: "You are already helping people understand their gifts and shape them into something they can offer back to society.",
      dotCategory: "direction",
      clusterSlug: "who-i-serve",
    });
  }

  if (normalized.includes("social housing") || normalized.includes("built a lot of social housing")) {
    specificDots.push({
      title: "Builds Hope Through Human Spaces",
      description: "Your grandfather's work showed you that creating a place for people can also create dignity, hope, and belonging.",
      dotCategory: "life_imprint",
      clusterSlug: "inspirations",
    });
  }

  if (normalized.includes("family squad")) {
    specificDots.push({
      title: "Built Family Squad for Connection",
      description: "Family Squad shows your instinct for turning emotional intelligence into a shared experience parents and children can actually play through together.",
      dotCategory: "strength",
      clusterSlug: "experiments",
    });
  }

  if (normalized.includes("conscious creator") || normalized.includes("finding themselves") || normalized.includes("find themselves")) {
    specificDots.push({
      title: "Guides People Toward Their Gift",
      description: "You keep naming the same audience: people trying to find themselves and turn their uniqueness into something useful for society.",
      dotCategory: "direction",
      clusterSlug: "who-i-serve",
    });
  }

  if (normalized.includes("festival") || normalized.includes("experience") || normalized.includes("people feel") || normalized.includes("safe environment")) {
    specificDots.push({
      title: "Creates Environments People Feel",
      description: "From the Bali festival to Family Squad, your creations are designed around atmosphere, safety, emotion, and shared connection.",
      dotCategory: "strength",
      clusterSlug: "how-i-create-impact",
    });
  }

  if (normalized.includes("movement") && normalized.includes("conscious creator")) {
    specificDots.push({
      title: "Starts Movements for Conscious Creators",
      description: "The festival idea is not only an event; you described it as a movement where conscious creators can collaborate, connect, and build something together.",
      dotCategory: "direction",
      clusterSlug: "vision-for-a-better-world",
    });
  }

  if (normalized.includes("meeting") && normalized.includes("opportunity")) {
    specificDots.push({
      title: "Turns Opportunities Into Experiments",
      description: "You are approaching the upcoming meeting as a real-world opening to test whether the conscious creators festival can become something bigger.",
      dotCategory: "strength",
      clusterSlug: "experiments",
    });
  }

  if (normalized.includes("e-commerce") || normalized.includes("social media") || normalized.includes("selling")) {
    specificDots.push({
      title: "Learned Digital Demand Early",
      description: "The e-commerce in Chile gives you real evidence of selling online, growing attention through social media, and learning from a market.",
      dotCategory: "strength",
      clusterSlug: "experiments",
    });
  }

  if (normalized.includes("grandfather")) {
    specificDots.push({
      title: "Inherited Service as Vocation",
      description: "Your grandfather gave you a living model of using vocation to help people around you and create a positive impact.",
      dotCategory: "life_imprint",
      clusterSlug: "inspirations",
    });
  }

  const merged = [...specificDots, ...dots]
    .filter((dot) => dot.title && dot.description)
    .filter((dot) => !prefersFreshExperimentDots || !/^(built family squad for connection|creates environments people feel|creates experiences people feel|tests ideas in real life)$/i.test(dot.title.trim()))
    .map((dot) => normalizeDotClassification({
      ...dot,
      clusterSlug: dot.clusterSlug || inferClusterSlugForDot(dot, activeMission, evidenceText),
    }));
  const unique = new Map<string, DotInterpretation>();
  merged.forEach((dot) => {
    const key = dot.title.toLowerCase();
    if (!unique.has(key) && !hasGenericDotTitle(dot.title)) unique.set(key, dot);
  });

  return Array.from(unique.values()).slice(0, 3);
};

const inferClusterSlugForDot = (
  dot: DotInterpretation,
  mission: DiscoveryMission,
  evidenceText = ""
) => {
  const text = `${dot.title} ${dot.description} ${evidenceText}`.toLowerCase();
  if (/\bwho\b|\bpeople\b|\bparents?\b|\bfamilies\b|\bkids\b|\bchildren\b|\blost\b|\bconscious creators?\b|\bfinding themselves\b|\bfind themselves\b/.test(text)) return "who-i-serve";
  if (/\bimpact\b|\bconnect\b|\bexperience\b|\bsafe environment\b|\bfeel\b|\bguide\b|\bhelp .* find\b|\bquality time\b/.test(text)) return "how-i-create-impact";
  if (/\bfamily squad\b|\be-?commerce\b|\bfestival\b|\bbuilt\b|\bcreated\b|\btested\b|\borganized\b|\bstarted\b/.test(text)) return "experiments";
  if (/\bskill\b|\blearn\b|\biterate\b|\bfeedback\b|\bsell\b|\bsocial media\b|\bconnect ideas\b|\bbring .* reality\b/.test(text)) return "skills";
  if (/\bgrandfather\b|\badmire\b|\binspired\b|\bvocation\b/.test(text)) return "inspirations";
  if (/\bgift\b|\bpurpose\b|\bsociety\b|\bservice\b|\bmission\b/.test(text)) return "values";
  return missionClusterSlugs[mission];
};

const buildCandidateDots = (
  decision: DiscoveryDecision,
  scopedEvidenceText?: string,
  questTheme?: DiscoveryQuestTheme,
): DotInterpretation[] => {
  const evidenceText = scopedEvidenceText?.trim() || decision.evidence.map((item) => item.text).join(" ");
  const normalized = evidenceText.toLowerCase();
  const fromFallback = (dots: DotInterpretation[]) => enrichDotsFromEvidence(dots, evidenceText, decision.activeMission, questTheme);

  if (dotIncludes(normalized, ["festival", "events", "parties", "experience", "experiences", "gamification", "human behavior", "game theory", "feedback", "iterate", "testing"])) {
    return fromFallback(fallbackDotsByMission.experiments);
  }

  if (dotIncludes(normalized, ["gift", "society", "serve", "help others", "positive impact"])) {
    return fromFallback(fallbackDotsByMission.inspirations);
  }

  if (dotIncludes(normalized, ["broke my leg", "surgery", "covid", "couldn't walk", "finish the game"])) {
    return fromFallback(fallbackDotsByMission.experiments);
  }

  if (dotIncludes(normalized, ["family", "parents", "children", "kids", "quality time"])) {
    return fromFallback(fallbackDotsByMission.passions);
  }

  return fromFallback(fallbackDotsByMission[decision.activeMission].map((dot) => ({
    ...dot,
    dotCategory: dot.dotCategory || dotCategoryByMission[decision.activeMission],
  })));
};

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

const buildBridgeQuestionDecision = (decision: DiscoveryDecision, userText: string): DiscoveryDecision => {
  const normalized = userText.toLowerCase();
  const isChangeSeeking =
    /\bchange\b|\bdifferent\b|\bmeaningful\b|\bimpact\b|\bhelp\b|\bserve\b|\bbetter world\b|\b9\s*to\s*5\b|\bjob\b/.test(normalized);
  const isCreatorSignal =
    /\bfamily squad\b|\bproject\b|\bproduct\b|\bgame\b|\bfestival\b|\bevent\b|\bcreated\b|\bbuilt\b|\bdeveloped\b|\bstarted\b/.test(normalized);

  const message = isCreatorSignal
    ? "I want to hold this before turning it into a Dot, because there is a useful bridge here. What did that creation teach you about people, and what part of that learning could you use in something you create next?"
    : isChangeSeeking
      ? "I hear that you are looking for something more meaningful, not just another task. If the change you imagine had to start with one small group of people, who would you feel called to help first, and why them?"
      : "I am hearing something important, and I want one more layer before we name it. What did that experience teach you that you still carry into how you choose, build, or help people now?";

  return {
    ...decision,
    message,
    action: "ASK",
    state: "FOLLOW_UP",
    interactionKey: undefined,
    nextMove: {
      ...decision.nextMove,
      priority: isChangeSeeking ? "direction" : "learning",
      reason: "The user has useful evidence, but Future Self needs one more connected layer before revealing Dots.",
      suggestedQuestion: message,
    },
  };
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

const hasLearningSignal = (text: string) =>
  /\blearn(?:ed|t|ing)?\b|\btaught\b|\btrust\b|\bresilien(?:ce|t)\b|\badapt\b|\brealization\b|\baha\b|\bcarry\b|\bskill\b|\biterate\b|\bfeedback\b|\btest\b/.test(text.toLowerCase());

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
    ? "I hear the part that feels most alive right now: you want to finish the AI project so you can open the next chapter, while also feeling a little stuck and looking for more opportunity. What is the one unfinished piece that is actually holding you back, and what would ‘finished enough’ look like for you this week?"
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

const normalizeToQuestTheme = (
  body: Record<string, unknown>,
  decision: DiscoveryDecision,
  sessionText: string,
  interactionCount: number,
  priorUserTurns: number
): DiscoveryDecision => {
  const theme = typeof body.activeQuestTheme === "string" ? body.activeQuestTheme as DiscoveryQuestTheme : "origin";

  const messageRepeatsAudience = repeatsAudienceQuestion(decision.message);
  const messageRepeatsOrigin = repeatsOriginStoryQuestion(decision.message);
  const themeMission: Partial<Record<DiscoveryQuestTheme, DiscoveryMission>> = {
    origin: decision.activeMission,
    gifts: "skills",
    world: "inspirations",
    experiments: "experiments",
  };

  if (messageRepeatsOrigin && theme !== "origin") {
    return buildThemedFollowUpDecision(decision, theme, sessionText);
  }

  if (theme === "world" && messageRepeatsAudience && hasAudienceDirection(sessionText)) {
    return buildActivityDecision({
      ...decision,
      activeMission: "inspirations",
      coverage: {
        ...decision.coverage,
        mission: "inspirations",
        score: Math.max(decision.coverage.score, 0.55),
        covered: Array.from(new Set([...decision.coverage.covered, "world", "audience"])),
      },
    }, "world");
  }

  if (interactionCount === 0 && priorUserTurns <= 1) {
    if (theme === "gifts" && (messageRepeatsAudience || decision.activeMission !== "skills" || decision.action === "SHOW_INTERACTION")) {
      return buildThemedFollowUpDecision(decision, theme, sessionText);
    }
    if (theme === "world" && (decision.action === "SHOW_INTERACTION" || !hasAudienceDirection(sessionText))) {
      return buildThemedFollowUpDecision(decision, theme, sessionText);
    }
    if (theme === "experiments" && (decision.action === "SHOW_INTERACTION" || decision.activeMission !== "experiments")) {
      return buildThemedFollowUpDecision(decision, theme, sessionText);
    }
  }

  const expectedMission = themeMission[theme];
  if (expectedMission && decision.action === "SHOW_INTERACTION") {
    return {
      ...decision,
      activeMission: expectedMission,
      coverage: { ...decision.coverage, mission: expectedMission },
    };
  }

  return decision;
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
  decision: DiscoveryDecision
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

  if (priorUserTurns <= 0) {
    return buildThemedFollowUpDecision(themedDecision, theme, sessionText);
  }

  return buildActivityDecision(themedDecision, theme);
};

const buildDotRewardDecision = (decision: DiscoveryDecision): DiscoveryDecision => ({
  ...decision,
  message: "I have enough now to offer a few possible Dots from what you shared. Treat them as mirrors, not conclusions. Choose only what feels true.",
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

const suggestLifetimeAnchor = (
  decision: DiscoveryDecision | null,
  messages: ConversationMessage[],
  selectedDots: DotInterpretation[]
): Pick<LifetimeAnchorInvite, "suggestedLabel" | "suggestedDescription" | "suggestedTimePeriod" | "suggestedEventType"> => {
  const evidenceText = [
    ...(decision?.evidence || []).map((item) => item.text),
    ...messages.map((message) => message.content),
    ...selectedDots.map((dot) => `${dot.title}. ${dot.description}`),
  ].join(" ");
  const normalized = evidenceText.toLowerCase();

  if (normalized.includes("broke") || normalized.includes("injury") || normalized.includes("surgery")) {
    return {
      suggestedLabel: "The recovery period that helped me create",
      suggestedDescription: "A difficult health moment became a place where I focused, learned, and moved a meaningful creation forward.",
      suggestedTimePeriod: "current",
      suggestedEventType: "health",
    };
  }

  if (normalized.includes("berlin") || normalized.includes("germany") || normalized.includes("moved") || normalized.includes("travel")) {
    return {
      suggestedLabel: "Leaving home and growing through a new culture",
      suggestedDescription: "A move into a different culture challenged me, stretched my identity, and helped shape who I became.",
      suggestedTimePeriod: "mid_20s",
      suggestedEventType: "change",
    };
  }

  if (normalized.includes("family squad") || normalized.includes("game") || normalized.includes("project") || normalized.includes("built") || normalized.includes("created")) {
    return {
      suggestedLabel: "Creating something from my lived experience",
      suggestedDescription: "A project or creation became evidence of what I care about, what I can build, and who I want to help.",
      suggestedTimePeriod: "current",
      suggestedEventType: "work",
    };
  }

  return {
    suggestedLabel: "A moment that shaped who I am becoming",
    suggestedDescription: "This moment gives my Atlas a real-life anchor, so the system can connect my Dots to something I have actually lived.",
    suggestedTimePeriod: "current",
    suggestedEventType: "identity",
  };
};

const enforceDiscoveryLoop = (body: Record<string, unknown>, decision: DiscoveryDecision): DiscoveryDecision => {
  const recentMessages = Array.isArray(body.recentMessages) ? body.recentMessages : [];
  const recentUserTurns = recentMessages.filter((message) => {
    if (!message || typeof message !== "object") return false;
    return (message as { role?: unknown }).role === "user";
  }).length;
  const recentUserText = recentMessages
    .filter((message) => message && typeof message === "object" && (message as { role?: unknown }).role === "user")
    .map((message) => String((message as { content?: unknown }).content || ""))
    .join(" ");
  const priorUserTurns = Math.max(Number(body.priorUserTurns || 0), recentUserTurns);
  const userText = typeof body.userText === "string" ? body.userText : "";
  const interactionText = typeof body.interactionResponse === "undefined"
    ? ""
    : JSON.stringify(body.interactionResponse);
  const sessionText = [recentUserText, userText, interactionText].join(" ");
  const interactionCount = Number(body.interactionCount || 0);
  const theme = typeof body.activeQuestTheme === "string"
    ? body.activeQuestTheme as DiscoveryQuestTheme
    : "origin";
  const repeatedAudienceLayer = repeatsAudienceQuestion(decision.message) && hasAudienceDirection(sessionText);
  const hasEnoughDiscoveryShape =
    priorUserTurns >= 2 &&
    interactionCount >= 1 &&
    hasAudienceDirection(sessionText) &&
    hasCreationSignal(sessionText) &&
    hasLearningSignal(sessionText);
  const themedDecision = normalizeToQuestTheme(body, decision, sessionText, interactionCount, priorUserTurns);

  if (themedDecision !== decision) {
    return themedDecision;
  }

  if (decision.action !== "GENERATE_DOTS") {
    if (hasEnoughDiscoveryShape || repeatedAudienceLayer || (priorUserTurns >= 2 && interactionCount >= 1 && decision.coverage.score >= 0.35)) {
      return buildDotRewardDecision(decision);
    }
    if (interactionCount === 0 && (repeatedAudienceLayer || priorUserTurns >= 3)) {
      return buildActivityDecision(decision, theme);
    }
    return decision;
  }

  if (priorUserTurns < 2) return buildBridgeQuestionDecision(decision, userText);
  if (interactionCount < 1) return buildActivityDecision(decision, theme);

  return buildDotRewardDecision(decision);
};

const FutureSelfDiscovery = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { clusters, dots: allExistingDots, isLoading: isAtlasLoading } = useAtlas();
  const { preCouncilComplete, preCouncilSlugsForPhase } = useAtlasQuests();
  const {
    events: lifetimeEvents,
    candidates: lifetimeCandidates,
    createEvent: createLifetimeEvent,
    markCandidateAdded,
    upsertCandidates: upsertLifetimeCandidates,
    reload: reloadLifetimeEvents,
  } = useLifetimeEvents();
  const hasFreshRequest = new URLSearchParams(location.search).has("fresh");
  const [input, setInput] = useState("");
  const [isSessionReady, setIsSessionReady] = useState(!hasFreshRequest);
  const [messages, setMessages] = useState<ConversationMessage[]>([
    {
      id: "opening",
      role: "future-self",
      content: openingInvitation,
    },
  ]);
  const [decision, setDecision] = useState<DiscoveryDecision | null>(null);
  const [activeInteraction, setActiveInteraction] = useState<QuestInteraction | null>(null);
  const [usedInteractionKeys, setUsedInteractionKeys] = useState<string[]>([]);
  const [interactionResponses, setInteractionResponses] = useState<unknown[]>([]);
  const [candidateDots, setCandidateDots] = useState<DotInterpretation[]>([]);
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
  const [councilHandoff, setCouncilHandoff] = useState<CouncilHandoff | null>(null);
  const [lifetimeAnchorInvite, setLifetimeAnchorInvite] = useState<LifetimeAnchorInvite | null>(null);
  const [showLifetimeCandidateBridge, setShowLifetimeCandidateBridge] = useState(false);
  const [selectedLifetimeCandidate, setSelectedLifetimeCandidate] = useState<LifetimeEventCandidate | null>(null);
  const [showLifetimeAnchorModal, setShowLifetimeAnchorModal] = useState(false);
  const [autoSendSeconds, setAutoSendSeconds] = useState<number | null>(null);
  const [activeQuestTheme, setActiveQuestTheme] = useState<DiscoveryQuestTheme>("origin");
  const lastSpokenMessageIdRef = useRef("");
  const speechRunIdRef = useRef(0);
  const speechPauseTimerRef = useRef<number | null>(null);
  const autoSendTimerRef = useRef<number | null>(null);
  const autoSendIntervalRef = useRef<number | null>(null);
  const freshResetKeyRef = useRef("");

  const canSubmit = input.trim().length > 0;
  const latestFutureSelfMessage = [...messages]
    .reverse()
    .find((message) => message.role === "future-self");
  const isSessionPreparing = hasFreshRequest && (freshResetKeyRef.current !== location.search || !isSessionReady);
  const visibleLatestFutureSelfMessage = isSessionPreparing ? undefined : latestFutureSelfMessage;
  const constellationMode: ConstellationMode = isRecordingVoice
    ? "listening"
    : isThinking || isProcessingVoice
      ? "thinking"
      : isSpeaking
        ? "speaking"
        : "idle";

  useEffect(() => {
    let cancelled = false;

    const resetDiscoverySession = async () => {
      const params = new URLSearchParams(location.search);
      if (!params.has("fresh")) {
        setIsSessionReady(true);
        return;
      }
      setIsSessionReady(false);
      if (isAtlasLoading) return;
      if (freshResetKeyRef.current === location.search) {
        setIsSessionReady(true);
        return;
      }
      freshResetKeyRef.current = location.search;
      const isNextQuest = params.get("mode") === "next" && allExistingDots.length > 0;
      let completedFutureSelfQuests = 0;
      let priorInteractionKeys: string[] = [];

      if (isNextQuest) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: completedQuests } = await supabase
            .from("atlas_quests")
            .select("interactions")
            .eq("user_id", user.id)
            .like("quest_key", "future_self_%");
          completedFutureSelfQuests = completedQuests?.length || 0;
          priorInteractionKeys = (completedQuests || [])
            .map((quest) => (quest.interactions as { interactionKey?: unknown } | null)?.interactionKey)
            .filter((key): key is string => typeof key === "string" && key.length > 0);
        }
      }

      if (cancelled) return;
      const nextTheme = isNextQuest ? questThemeForProgress(completedFutureSelfQuests) : "origin";

      cancelAutoSend();
      stopSpeaking();
      setInput("");
      setMessages([
        {
          id: isNextQuest ? "next-quest-opening" : "opening",
          role: "future-self",
          content: isNextQuest ? buildNextQuestInvitation(allExistingDots, completedFutureSelfQuests) : openingInvitation,
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
      setCouncilHandoff(null);
      setLifetimeAnchorInvite(null);
      setShowLifetimeCandidateBridge(false);
      setSelectedLifetimeCandidate(null);
      setShowLifetimeAnchorModal(false);
      setActiveQuestTheme(nextTheme);
      lastSpokenMessageIdRef.current = "";
      setIsSessionReady(true);
    };

    resetDiscoverySession();
    return () => {
      cancelled = true;
    };
  }, [location.search, allExistingDots, isAtlasLoading]);

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
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        if (runId !== speechRunIdRef.current) return;
        speechPauseTimerRef.current = window.setTimeout(
          () => speakChunk(index + 1),
          speechPauseFor(chunk),
        );
      };
      utterance.onerror = () => setIsSpeaking(false);
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
    if (!isSessionReady || isSessionPreparing || !voiceRepliesEnabled || !latestFutureSelfMessage) return;
    if (latestFutureSelfMessage.id === lastSpokenMessageIdRef.current) return;

    speakFutureSelfMessage(latestFutureSelfMessage);
  }, [isSessionPreparing, isSessionReady, latestFutureSelfMessage, voiceRepliesEnabled]);

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

  const applyDecision = (
    nextDecision: DiscoveryDecision,
    aiCandidateDots?: DotInterpretation[],
    freshContextText = ""
  ) => {
    // The opening for a later quest names earlier Dots for continuity. Those
    // labels are context, not new evidence for the current quest.
    const questUserEvidence = messages
      .filter((message) => message.role === "user")
      .map((message) => message.content);
    const evidenceText = [
      ...questUserEvidence,
      freshContextText,
    ].filter(Boolean).join(" ");
    const decisionEvidenceText = nextDecision.evidence
      .map((item) => item.text)
      .filter((text) => !/already have some signals|including .*(dot|built|learned|creates|guides)/i.test(text))
      .join(" ");
    const scopedEvidence = [evidenceText, decisionEvidenceText].filter(Boolean).join(" ");
    const prepareCandidateDots = (dots: DotInterpretation[]) => ensureThreeDistinctDots(
      keepNewDots(dots, allExistingDots),
      scopedEvidence,
      nextDecision.activeMission,
      activeQuestTheme,
      allExistingDots,
    );
    const upgradedDots = nextDecision.action === "GENERATE_DOTS"
      ? prepareCandidateDots(enrichDotsFromEvidence(
        aiCandidateDots && aiCandidateDots.length > 0 ? aiCandidateDots : [],
        scopedEvidence,
        nextDecision.activeMission,
        activeQuestTheme,
      ))
      : [];
    const fallbackDots = nextDecision.action === "GENERATE_DOTS"
      ? prepareCandidateDots(enrichDotsFromEvidence(
        buildCandidateDots(nextDecision, scopedEvidence, activeQuestTheme),
        scopedEvidence,
        nextDecision.activeMission,
        activeQuestTheme,
      ))
      : [];

    setDecision(nextDecision);
    setValidationMode("picking");
    setCandidateDots(
      nextDecision.action === "GENERATE_DOTS"
        ? upgradedDots.length === 3
          ? upgradedDots
          : fallbackDots
        : []
    );
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

  const askFutureSelfDiscovery = async (
    body: Record<string, unknown>,
    fallback: () => DiscoveryDecision
  ): Promise<{ decision: DiscoveryDecision; candidateDots?: DotInterpretation[]; impactOptions?: ImpactOptions }> => {
    try {
      const { data, error } = await supabase.functions.invoke<AiDiscoveryResponse>(
        "future-self-discovery",
        { body }
      );

      if (error || !data) throw error || new Error("No Future Self response");

      const decision = normalizeInteractionDecision(
        applyQuestFlowContract(body, enforceDiscoveryLoop(body, data))
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
            freshSession,
            activeQuestTheme,
            recentMessages: messages.slice(-8),
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
        {
          id: `future-self-${Date.now()}`,
          role: "future-self",
          content: nextDecision.message,
        },
      ]);
      applyDecision(nextDecision, aiCandidateDots, trimmedText);
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
          recentMessages: messages.slice(-8),
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
      {
        id: `future-self-${Date.now()}`,
        role: "future-self",
        content: nextDecision.message,
      },
    ]);
    applyDecision(nextDecision, aiCandidateDots, summarizeInteractionResponse(response));
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
    userEdited = validationMode === "confirmed",
  ) => {
    if (!decision || dotsToSave.length === 0 || isSavingDot || savedDotTitle) return;

    const primaryDot = dotsToSave[0];
    const dotClusterSlugs = dotsToSave.map((dot) =>
      dot.clusterSlug || inferClusterSlugForDot(dot, decision.activeMission, decision.evidence.map((item) => item.text).join(" "))
    );
    const targetClusters = dotClusterSlugs.map((slug) =>
      clusters.find((cluster) => cluster.slug === slug) ||
      clusters.find((cluster) => cluster.slug === missionClusterSlugs[decision.activeMission])
    );
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

      const { count: previousFutureSelfQuestCount } = await supabase
        .from("atlas_quests")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed")
        .like("quest_key", "future_self_%");

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
        ...decision.evidence.map((item) => item.text),
      ]))
        .map((evidence) => evidence.replace(/\s+/g, " ").trim().slice(0, 520))
        .filter(Boolean)
        .slice(0, 20);
      const activityEvidence = interactionResponses.map((response) => summarizeInteractionResponse(response));
      const offeredDots = candidateDots.slice(0, 3).map((dot) => ({
        title: dot.title,
        description: dot.description,
        dotCategory: dot.dotCategory || "strength",
        clusterSlug: dot.clusterSlug || inferClusterSlugForDot(dot, decision.activeMission, questEvidence.join(" ")),
      }));

      const dotPayloads: AtlasDotInsert[] = dotsToSave.map((dot, index) => ({
        user_id: user.id,
        cluster_id: targetClusters[index]!.id,
        title: dot.title,
        short_description: dot.description,
        dot_type: "future_self_discovery",
        dot_category: dot.dotCategory || "strength",
        signal_sources: signalSources,
        signal_strength: Math.max(1, decision.coverage.covered.length),
        source_system: "future_self_discovery",
        confidence_score: 0.72,
        user_validated: true,
        user_edited: userEdited,
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
        },
      }));

      const { data: savedDots, error } = await supabase
        .from("atlas_dots")
        .insert(dotPayloads)
        .select("id,title,short_description,dot_category");

      if (error) throw error;
      const primarySavedDot = savedDots?.[0];
      if (!primarySavedDot) throw new Error("The Atlas did not return the saved Dot.");
      const savedDotRows = savedDots || [];
      const validatedDotProvenance = dotsToSave.map((dot, index) => ({
        savedDotId: savedDotRows[index]?.id || null,
        title: dot.title,
        description: dot.description,
        dotCategory: dot.dotCategory || "strength",
        clusterSlug: targetClusters[index]!.slug,
        sourceQuestKey: questKey,
        questTheme: activeQuestTheme,
        evidence: questEvidence,
        activityEvidence,
      }));

      const { data: previousFutureSelfHistory } = await supabase
        .from("atlas_quests")
        .select("interactions")
        .eq("user_id", user.id)
        .like("quest_key", "future_self_%")
        .order("completed_at", { ascending: true });
      const lifetimeEvidence = [
        ...(previousFutureSelfHistory || []).map((quest) => JSON.stringify(quest.interactions || "")),
        ...messages.map((message) => message.content),
        ...decision.evidence.map((item) => item.text),
        ...dotsToSave.map((dot) => `${dot.title}. ${dot.description}`),
      ].join(" ");
      const lifetimeSeeds = extractLifetimeCandidates(lifetimeEvidence);

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
              currentGoal: "Understand the user through story and guide them toward a meaningful next action.",
              questTheme: activeQuestTheme,
              sourceQuestKey: questKey,
              questEvidence,
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
          dot_category: originalDot.dotCategory || "strength",
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

      const persistedLifetimeCandidates = await upsertLifetimeCandidates(lifetimeSeeds, savedQuest?.id);

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
      const councilUrl = "/council?view=intake";
      const hasLifetimeAnchor = lifetimeEvents.length > 0;

      // Offer a real life moment only after the third saved conversation.
      const shouldPauseForLifetimeAlbum =
        !hasLifetimeAnchor &&
        persistedLifetimeCandidates.length > 0 &&
        (previousFutureSelfQuestCount || 0) >= 2;

      if (shouldPauseForLifetimeAlbum) {
        setLifetimeAnchorInvite(null);
        setCouncilHandoff(null);
        setShowLifetimeCandidateBridge(true);
        setMessages((current) => [
          ...current,
          {
            id: `future-self-lifetime-bridge-${Date.now()}`,
            role: "future-self",
            content:
              "We have reached a meaningful pause in your story. I found several moments that could become part of your Lifetime album. Choose one to place on the map now; the others will stay here as locked possibilities until you are ready.",
          },
        ]);
        return;
      }

      const savedTargetClusterSlugs = new Set(
        targetClusters.map((cluster) => cluster?.slug).filter(Boolean) as string[]
      );
      const projectedPreCouncilComplete =
        preCouncilComplete ||
        preCouncilSlugsForPhase.every((slug) => {
          const cluster = clusters.find((item) => item.slug === slug);
          return savedTargetClusterSlugs.has(slug) || (cluster?.dotCount || 0) > 0;
        });
      const isCouncilReady = hasLifetimeAnchor && projectedPreCouncilComplete;

      if (isCouncilReady) {
        setLifetimeAnchorInvite(null);
        setCouncilHandoff({ atlasUrl, councilUrl });
        setMessages((current) => [
          ...current,
          {
            id: `future-self-council-ready-${Date.now()}`,
            role: "future-self",
            content:
              "I think we have enough now.\n\nYour Atlas has enough real signals, and it has a life anchor, so the next step is to bring this to your Council. They can use what we collected here to help shape a more personal direction with you.",
          },
        ]);
        return;
      }

      if (projectedPreCouncilComplete && !hasLifetimeAnchor && (previousFutureSelfQuestCount || 0) >= 2 && lifetimeSeeds.length > 0) {
        const suggestedAnchor = suggestLifetimeAnchor(decision, messages, dotsToSave);
        setCouncilHandoff(null);
        setLifetimeAnchorInvite({ ...suggestedAnchor, atlasUrl, councilUrl });
        setMessages((current) => [
          ...current,
          {
            id: `future-self-lifetime-anchor-${Date.now()}`,
            role: "future-self",
            content:
              "We have enough Atlas signal now, but I want to ground it in one real moment from your life before we bring it to the Council.\n\nI am going to suggest a Lifetime anchor from what you shared. You can edit it, save it, and then we can keep going from here.",
          },
        ]);
        return;
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

  const handleCandidateRegenerate = (feedback?: string) => {
    if (!decision) return;

    const currentEvidence = [
      ...messages.filter((message) => message.role === "user").map((message) => message.content),
      ...decision.evidence.map((item) => item.text),
    ].join(" ");
    const regeneratedEvidenceDots = enrichDotsFromEvidence(
        buildCandidateDots(decision, currentEvidence, activeQuestTheme),
        currentEvidence,
        decision.activeMission,
        activeQuestTheme,
      );
    const baseCandidates = ensureThreeDistinctDots(
      keepNewDots(regeneratedEvidenceDots, allExistingDots),
      currentEvidence,
      decision.activeMission,
      activeQuestTheme,
      allExistingDots,
    );
    const regenerated = baseCandidates.map((candidate, index) => ({
      ...candidate,
      title: index === 0 && feedback ? "Closer Signal" : candidate.title,
      description: feedback
        ? `Reframed with your feedback: "${feedback.slice(0, 120)}${feedback.length > 120 ? "..." : ""}"`
        : candidate.description,
    }));

    setCandidateDots(regenerated);
    setValidationMode("picking");
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
    setCouncilHandoff(null);
    setLifetimeAnchorInvite(null);
    setShowLifetimeCandidateBridge(false);
    setSelectedLifetimeCandidate(null);
    setMessages((current) => [
      ...current,
      {
        id: `future-self-continue-${Date.now()}`,
        role: "future-self",
        content: "Let's keep going. Tell me another part of your story, a project you tried, someone who shaped you, or a pattern you keep noticing in yourself.",
      },
    ]);
  };

  const handleLifetimeCandidateSave = async (data: LifetimeEventInput) => {
    if (!selectedLifetimeCandidate) return;

    const savedEvent = await createLifetimeEvent(data);
    if (!savedEvent) return;

    await markCandidateAdded(selectedLifetimeCandidate.id);
    setShowLifetimeAnchorModal(false);
    setSelectedLifetimeCandidate(null);
    setMessages((current) => [
      ...current,
      {
        id: `future-self-lifetime-candidate-saved-${Date.now()}`,
        role: "future-self",
        content:
          `That moment is now part of your Lifetime album, placed in your ${TIME_PERIOD_LABELS[data.time_period]} chapter. The other moments I noticed are still waiting for you when you want to add another chapter.`,
        savedDestinations: [{
          title: savedEvent.event_label,
          location: `Life Timeline · ${TIME_PERIOD_LABELS[savedEvent.time_period]}`,
          href: `/life-timeline?event=${encodeURIComponent(savedEvent.id)}`,
        }],
      },
    ]);
    toast({
      title: "Lifetime moment added",
      description: savedEvent.event_label,
    });
  };

  const handleLifetimeAnchorSave = async (data: LifetimeEventInput) => {
    const savedEvent = await createLifetimeEvent(data);
    if (!savedEvent || !lifetimeAnchorInvite) return;

    await Promise.all([
      reloadLifetimeEvents(),
      queryClient.invalidateQueries({ queryKey: ["atlas-dots"] }),
      queryClient.invalidateQueries({ queryKey: ["atlas-quests-completed"] }),
    ]);

    setShowLifetimeAnchorModal(false);
    setLifetimeAnchorInvite(null);
    setCouncilHandoff({
      atlasUrl: lifetimeAnchorInvite.atlasUrl,
      councilUrl: lifetimeAnchorInvite.councilUrl,
    });
    setMessages((current) => [
      ...current,
      {
        id: `future-self-lifetime-saved-${Date.now()}`,
        role: "future-self",
        content:
          `Good. That gives your Atlas a real anchor, not just ideas. It now sits in your ${TIME_PERIOD_LABELS[data.time_period]} chapter.\n\nNow we can bring your Dots and this life moment to the Council, or you can review how the map changed first.`,
        savedDestinations: [{
          title: savedEvent.event_label,
          location: `Life Timeline · ${TIME_PERIOD_LABELS[savedEvent.time_period]}`,
          href: `/life-timeline?event=${encodeURIComponent(savedEvent.id)}`,
        }],
      },
    ]);
    toast({
      title: "Lifetime anchor saved",
      description: savedEvent.event_label,
    });
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

          {candidateDots.length > 0 && decision && validationMode !== "confirmed" && (
            <section className="rounded-lg border border-border bg-card py-5 shadow-sm">
              <AtlasWinningCard
                dot={candidateDots[0]}
                clusterName="Future Self Discovery"
                fallbackClusterSlug={missionClusterSlugs[decision.activeMission]}
                onConfirm={handleCandidateConfirm}
                onRegenerate={handleCandidateRegenerate}
                variations={candidateDots}
                validationMode={validationMode}
                onSetValidationMode={setValidationMode}
                isLoading={isSavingDot}
                confirmLabel={isSavingDot ? "Saving to Atlas" : "Save to Atlas"}
                mirrorFeedback="These are provisional. Pick or edit only what feels true; when you save, I will add them to your Atlas."
              />
            </section>
          )}

          {councilHandoff && (
            <section className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Council ready
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Future Self has enough to hand your story, Dots, and signals to the Council intake.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button type="button" className="gap-2" onClick={() => navigate(councilHandoff.councilUrl)}>
                  Go to Council
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate(councilHandoff.atlasUrl)}>
                  Review Atlas first
                </Button>
              </div>
            </section>
          )}

          {showLifetimeCandidateBridge && !councilHandoff && (
            <section className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-primary">
                Your Lifetime album
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Future Self noticed these moments in your story. Add one now; the others stay visible for later.
              </p>
              <div className="mt-4 space-y-2">
                {lifetimeCandidates
                  .filter((candidate) => candidate.status !== "dismissed")
                  .map((candidate) => {
                    const isAvailable = candidate.status === "available";
                    const isAdded = candidate.status === "added";
                    return (
                      <div
                        key={candidate.id}
                        className={`rounded-lg border p-3 ${isAvailable ? "border-primary/40 bg-background/70" : "border-border/60 bg-background/30 opacity-75"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{candidate.event_label}</p>
                            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-primary">
                              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                              {TIME_PERIOD_LABELS[candidate.suggested_time_period]}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">{candidate.event_description}</p>
                          </div>
                          {isAdded ? (
                            <span className="shrink-0 text-xs text-primary">Added</span>
                          ) : isAvailable ? (
                            <Button
                              type="button"
                              size="sm"
                              className="shrink-0"
                              onClick={() => {
                                setSelectedLifetimeCandidate(candidate);
                                setShowLifetimeAnchorModal(true);
                              }}
                            >
                              Add
                            </Button>
                          ) : (
                            <span className="shrink-0 text-xs text-muted-foreground">Locked</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  className="gap-2"
                  onClick={() => navigate(`/future-self/discovery?mode=next&fresh=${Date.now()}`)}
                >
                  Continue discovery
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/life-timeline")}>
                  Open Lifetime
                </Button>
              </div>
            </section>
          )}

          {lifetimeAnchorInvite && (
            <section className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Lifetime anchor
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Suggested from your conversation:
              </p>
              <div className="mt-3 rounded-lg border border-border/70 bg-background/60 p-3">
                <p className="font-semibold text-foreground">{lifetimeAnchorInvite.suggestedLabel}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-primary">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  {TIME_PERIOD_LABELS[lifetimeAnchorInvite.suggestedTimePeriod]}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{lifetimeAnchorInvite.suggestedDescription}</p>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button type="button" className="gap-2" onClick={() => setShowLifetimeAnchorModal(true)}>
                  Add Lifetime anchor
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate(lifetimeAnchorInvite.atlasUrl)}>
                  Go to Atlas
                </Button>
                <Button type="button" variant="ghost" onClick={handleContinueDiscovery}>
                  Continue talking
                </Button>
              </div>
            </section>
          )}

          {selectedDots.length > 0 && !councilHandoff && !lifetimeAnchorInvite && !showLifetimeCandidateBridge && !savedDotTitle && (
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
          {savedDotTitle && !councilHandoff && !lifetimeAnchorInvite && !showLifetimeCandidateBridge && (
            <Button type="button" variant="ghost" onClick={handleContinueDiscovery}>
              Continue discovery
            </Button>
          )}
        </div>

        <LifetimeEventEditModal
          open={showLifetimeAnchorModal}
          onClose={() => {
            setShowLifetimeAnchorModal(false);
            setSelectedLifetimeCandidate(null);
          }}
          defaultTimePeriod={selectedLifetimeCandidate?.suggested_time_period || lifetimeAnchorInvite?.suggestedTimePeriod || "current"}
          defaultEventType={selectedLifetimeCandidate?.suggested_event_type || lifetimeAnchorInvite?.suggestedEventType}
          defaultEventLabel={selectedLifetimeCandidate?.event_label || lifetimeAnchorInvite?.suggestedLabel}
          defaultEventDescription={selectedLifetimeCandidate?.event_description || lifetimeAnchorInvite?.suggestedDescription || undefined}
          momentKindOverride="event"
          onSave={async (data) => {
            if (selectedLifetimeCandidate) {
              await handleLifetimeCandidateSave(data);
              return;
            }
            await handleLifetimeAnchorSave({
              ...data,
              event_label: data.event_label || lifetimeAnchorInvite?.suggestedLabel || "A moment that shaped me",
              event_description: data.event_description || lifetimeAnchorInvite?.suggestedDescription,
            });
          }}
        />

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
                        onClick={() => speakFutureSelfMessage(latestFutureSelfMessage)}
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
