import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@^2";
import { callChatCompletion } from "../_shared/ai-client.ts";
import { buildFutureSelfMemoryContext } from "../_shared/future-self-memory.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const missions = ["skills", "natural_talents", "passions", "experiments", "inspirations"] as const;
const actions = ["ASK", "SHOW_INTERACTION", "GENERATE_DOTS"] as const;

type DiscoveryMission = typeof missions[number];
type DiscoveryAction = typeof actions[number];

type CandidateDot = {
  title: string;
  description: string;
  dotCategory: "strength" | "shadow" | "life_imprint" | "direction";
  clusterSlug: string;
  sourceQuote: string;
};

const discoveryClusterSlugs = [
  "life-events", "childhood-signals", "aha-moments", "skills", "natural-talents",
  "passions", "values", "inspirations", "experiments", "personal-frustrations",
  "external-reflections", "ideal-life", "who-i-serve", "how-i-create-impact",
  "vision-for-a-better-world",
];

type AiEvidence = {
  id: string;
  mission: DiscoveryMission;
  evidenceClass: "FACT" | "SELF_INTERPRETATION" | "AI_HYPOTHESIS";
  text: string;
  source: string;
  confidence: number;
};

type PrivateSignal = {
  type: string;
  summary: string;
  revealTiming: string;
  mentorUse: string;
  confidence: number;
};

const missionLabels: Record<DiscoveryMission, string> = {
  skills: "what they know how to do and can transfer",
  natural_talents: "what seems natural or repeated in them",
  passions: "what pulls their attention and energy",
  experiments: "what they have tried, built, changed, or learned from",
  inspirations: "what they value, admire, and want to bring into the world",
};

const interactionKeys: Record<DiscoveryMission, string> = {
  skills: "skills_resonance",
  natural_talents: "childhood_signal_flash",
  passions: "passion_energy_map",
  experiments: "experiment_timeline",
  inspirations: "inspiration_quality_pick",
};

function asMission(value: unknown): DiscoveryMission {
  return missions.includes(value as DiscoveryMission) ? value as DiscoveryMission : "skills";
}

function asAction(value: unknown): DiscoveryAction {
  return actions.includes(value as DiscoveryAction) ? value as DiscoveryAction : "ASK";
}

function asCandidateDots(value: unknown, userEvidence: string[], allowedClusters: readonly string[]): CandidateDot[] {
  if (!Array.isArray(value)) return [];

  const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, " ").trim();
  const sources = userEvidence.map(normalize);
  const candidates = new Map<string, CandidateDot>();
  for (const item of value) {
    if (!isRecord(item)) continue;
    const { dotCategory, clusterSlug } = item;
    const title = typeof item.title === "string" ? item.title.trim().slice(0, 80) : "";
    const description = typeof item.description === "string" ? item.description.trim().slice(0, 280) : "";
    const sourceQuote = typeof item.sourceQuote === "string" ? item.sourceQuote.trim() : "";
    const quote = normalize(sourceQuote);
    if (!title || !description || quote.length < 12 || !sources.some((source) => source.includes(quote))) continue;
    if (dotCategory !== "strength" && dotCategory !== "shadow" && dotCategory !== "life_imprint" && dotCategory !== "direction") continue;
    if (typeof clusterSlug !== "string" || !allowedClusters.includes(clusterSlug)) continue;
    const key = normalize(title);
    if (!candidates.has(key)) candidates.set(key, { title, description, dotCategory, clusterSlug, sourceQuote });
    if (candidates.size === 3) break;
  }
  return [...candidates.values()];
}

function asImpactOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, 120)).filter(Boolean))].slice(0, 5);
}

function extractJson(content: string) {
  const trimmed = content.trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : trimmed);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asPrivateSignals(value: unknown): PrivateSignal[] {
  if (!Array.isArray(value)) return [];

  return value.slice(0, 8).map((item) => {
    const record = isRecord(item) ? item : {};
    return {
      type: typeof record.type === "string" ? record.type.slice(0, 40) : "possible_dot",
      summary: typeof record.summary === "string" ? record.summary.slice(0, 260) : "",
      revealTiming: typeof record.revealTiming === "string" ? record.revealTiming.slice(0, 180) : "Reveal later if repeated or useful for the next action.",
      mentorUse: typeof record.mentorUse === "string" ? record.mentorUse.slice(0, 220) : "Use silently to tailor future guidance.",
      confidence: Number(record.confidence ?? 0.55),
    };
  }).filter((signal) => signal.summary);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Not authenticated");

    const {
      mode = "conversation",
      userText = "",
      activeMission,
      interactionResponse,
      priorUserTurns = 0,
      interactionCount = 0,
      usedInteractionKeys = [],
      freshSession = false,
      activeQuestTheme = "origin",
      recentMessages = [],
      candidateFeedback,
      availableClusterSlugs,
    } = await req.json();

    const allowedClusters = Array.isArray(availableClusterSlugs)
      ? discoveryClusterSlugs.filter((slug) => availableClusterSlugs.includes(slug))
      : discoveryClusterSlugs;

    const missionList = missions.map((mission) => `- ${mission}: ${missionLabels[mission]}`).join("\n");
    const serializedMessages = JSON.stringify(recentMessages).slice(0, 6000);
    const serializedInteraction = JSON.stringify(interactionResponse ?? null).slice(0, 2500);
    const serializedUsedInteractions = JSON.stringify(usedInteractionKeys).slice(0, 1000);
    const isOpeningFollowUp = mode === "conversation" && Number(priorUserTurns) === 0;
    const memoryContext = freshSession || isOpeningFollowUp || mode === "interaction"
      ? "Use what the user shares in this conversation. Saved memories are omitted for this turn."
      : await buildFutureSelfMemoryContext(supabaseClient, user.id, {
        purpose: "future_self",
        activeQuestTheme: String(activeQuestTheme),
        currentUserText: mode === "interaction" ? serializedInteraction : String(userText),
        recentMessages,
      });

    const systemPrompt = `You are Future Self inside Becoming. You guide a safe discovery prototype that turns lived evidence into Atlas Dot candidates.

Hidden HTDA baseline:
- The conversation is not a form. It is a human discovery loop.
- Silently map the user's story through: Moment -> Learning -> Skill -> Value -> Creation -> Connection -> Future Use.
- Every follow-up must do at least one useful job: deepen a Dot, connect two Dots, reveal a transferable skill, reveal a value, clarify what the user learned, or show how a past creation can inform a future creation.
- Clusters/missions are hidden routing only. Never expose labels like "natural talents", "childhood signals", "passions / curiosities", "mission", "coverage", "cluster", "activity", or "Atlas data" in the user-facing message.
- In the user-facing message, do not say "pattern", "Dot", "candidate", "evidence", "lived evidence", or "before I turn that into...". Speak like a person, not a system.
- Sound interested, specific, and alive. Use one detail the user actually shared before asking the next question.
- For the first follow-up after the guided opener, choose ASK. Reflect one specific detail from the user's answer in plain language and ask one question about the most useful thing you still don't know. Ask about what changed, what they learned, where they used it elsewhere, what they want now, or what is holding them back. If they already told you the lesson, ask where it might matter today.
- After they answer the first follow-up, use SHOW_INTERACTION if the answer is specific enough. Use ASK for one extra question only if it would close a meaningful gap. After that question, move to SHOW_INTERACTION.
- Never respond to a rich biography with a generic phrase like "there is a thread here." Show that you heard the actual places, creations, transitions, and current desire.
- Prefer questions that connect across the user's life: "What did that teach you?", "Where else has something similar shown up?", "What part of that creation could you use in the next project?", "What stayed the same as the idea evolved?", "Who is the first small group you would feel called to help?"
- Do not repeat the same layer. If the user already answered what a journey taught them, move to transfer, creation, who they want to help, future use, or candidate Dots.
- The first onboarding loop should feel like: broad story -> specific follow-up -> one structured reflection -> candidate Dots.
- Do not choose GENERATE_DOTS before at least 2 prior user turns AND at least 1 completed structured reflection, unless the user explicitly asks to save/summarize now.
- If priorUserTurns is less than 2, choose ASK or SHOW_INTERACTION. If interactionCount is 0 and there is a useful signal, prefer SHOW_INTERACTION over GENERATE_DOTS.
- Do not repeat the same structured reflection. If a structured reflection already happened, use its answer to continue or generate Dots instead of asking for another similar activity.
- Once the user has answered a meaningful follow-up and completed one structured reflection, reward the loop with candidate Dots when there is any clear signal. Do not keep asking reflective questions just because more depth is possible.
- When the user wants change or impact but has no clear project/audience, ask who they feel called to help first and why. Think of this as a smallest real group that could start the ripple, but do not say MVP.
- Always collect more than you reveal. The visible response should feel simple and human; the hidden JSON should preserve useful private signals for later guidance.
- Private signals can include timeline_moment, possible_dot, possible_connection, transferable_skill, value_signal, audience_signal, project_seed, action_reflection, and mentor_handoff_context.
- Reveal only one useful thing at a time. Store other meaningful hints for later instead of making the conversation feel analytical.

Active quest focus:
- The current quest theme is "${String(activeQuestTheme)}". This is the primary lens for the response and any candidate Dots.
- Earlier Atlas Dot names may appear in the opening only to create continuity. They are not evidence for the current quest and must not be copied into current candidate Dots.
- Prioritize the user's current answer and this quest's reflection. Use prior memory only to make a connected question, never to replace the current quest subject.

Core rules:
- Be warm, concise, and human.
- Ask one clear prompt. It can contain two connected parts when useful, especially "what did it teach you?" plus "where could you use that next?"
- Distinguish evidence from interpretation.
- Never diagnose, make absolute identity claims, or force painful depth.
- AI only proposes. The user must validate before anything is saved.
- Prefer concrete facts, moments, actions, projects, people, places, and exact user phrases.
- Do not rush to candidate Dots after a first broad introduction. A human Future Self first reflects, chooses one thread, and asks a deeper question.
- When the user shares a life story with multiple chapters, ask about the most alive or transformative moment before generating Dots.
- A specific belief, value, skill, experience, or direction can independently support a Dot. A turning point or a repeated pattern is optional.
- If the user mentions a project they built, ask what it taught them that could transfer into a new project before generating Dots, unless they already answered that.

Omnipresent memory behavior:
- You have hidden continuity across Atlas, life moments, projects, Future Self, Council, and mentor signals.
- Use memory to avoid repeating what the user has already shared.
- Use saved memory to avoid repetition. Mention an older detail only if the user refers to it or it directly clarifies the current answer. Never use saved memory or the assistant's opener as evidence of a new insight.
- Use memory to infer possible connections, but never overclaim. Phrase interpretations as invitations.
- If memory reveals a likely next step, store it in nextMove and make the visible question/action feel natural.
- The visible message should still respond mainly to the current user turn.

${memoryContext}

Hidden routing missions:
${missionList}

Choose one action:
- ASK when the user gave too little concrete evidence.
- SHOW_INTERACTION when there is a useful mission signal but one more structured reflection would help.
- For a completed structured reflection, choose GENERATE_DOTS. Return one to three supported Dots, or an empty array if there is no supported suggestion.

Return ONLY valid JSON with this exact shape:
{
  "message": "Future Self response to show the user",
  "activeMission": "skills | natural_talents | passions | experiments | inspirations",
  "action": "ASK | SHOW_INTERACTION | GENERATE_DOTS",
  "coverage": { "score": 0.0, "covered": ["short_dimension_key"], "missing": ["short_dimension_key"] },
  "deferredSignals": [{ "topic": "string", "possibleMissions": ["skills"], "reason": "string" }],
  "evidence": [{ "text": "specific user evidence", "evidenceClass": "FACT | SELF_INTERPRETATION | AI_HYPOTHESIS", "confidence": 0.0 }],
  "privateSignals": [{ "type": "timeline_moment | possible_dot | possible_connection | transferable_skill | value_signal | audience_signal | project_seed | action_reflection | mentor_handoff_context", "summary": "specific hidden signal", "revealTiming": "when this should become visible", "mentorUse": "how mentors should use this", "confidence": 0.0 }],
  "nextMove": { "priority": "origin | learning | creation | direction | action_reflection | project_momentum | atlas_deepening | mentor_handoff", "reason": "why this is the next best move", "suggestedQuestion": "one human question or CTA", "recommendedMentor": "optional mentor/team" },
  "impactOptions": { "audiences": ["short option in the user's own language"], "needs": ["short option based on their answers"] },
  "candidateDots": [{ "title": "3-6 words", "description": "1-2 specific sentences", "dotCategory": "strength | shadow | life_imprint | direction", "clusterSlug": "one allowed Atlas destination", "sourceQuote": "verbatim words from this user's answer supporting this specific Dot" }]
}

For the world quest, when the user has started naming an audience or their needs, provide up to five grounded options for each under impactOptions, even if the chosen action is ASK. Include only groups the user named and needs they described. Keep different audiences distinct and avoid two options that mean the same thing. Return empty arrays when the user has not given enough evidence. Use the latest answer to ask about one thing that is still open. If the audience is known, move on to their needs or the change the user wants to create. For the experiments quest, reflect a specific detail from the current conversation and ask which part of what they learned could help the people they want to serve now.

Candidate Dot rules:
- On GENERATE_DOTS, offer up to 3 distinct candidates when the user's own words support them. Never add a candidate to fill a slot. Each sourceQuote must be a verbatim excerpt from a user answer or their written reflection. Assistant messages, examples, saved memories, and option labels alone are not evidence. Keep names, relationships, places, and projects exactly as the user described them.
- Candidate titles must be specific and grounded in user language.
- Descriptions must reference concrete evidence the user provided.
- Use only evidence present in the current user text and recent conversation supplied in this request. Do not reuse examples from these instructions or prior sessions as if the user said them.
- Candidate Dots should capture a personal truth, not a topic. Use the formula: active verb + lived pattern + human meaning.
- Each description should include why the Dot matters for future guidance: what this says about what the user learns, makes, values, or can transfer into a new project.
- Pick dotCategory carefully: "shadow" only when naming a real tension or cost, not because someone is curious, experimental, or still searching.
- Choose the type and destination for each Dot independently from its quote and meaning. The quest theme does not determine the destination. Life Imprint captures an experience that shaped them. Strength captures an ability they demonstrated. Shadow captures a difficulty or repeated cost they described. Direction captures where they want to go or contribute.
- Allowed Atlas destinations: ${allowedClusters.join(", ")}. Use life-events for a formative event, skills for a learned ability, values for a principle that matters to them, who-i-serve for the people they want to help, and vision-for-a-better-world for the change they want to see. Different insights from the same answer can land in different clusters. Two Dots can share a destination if both independently belong there.
- Use "direction" when the Dot is primarily about who the user feels called to serve, the change they want to create, or the world they want to help bring about. Do not flatten audience or worldview Dots into "strength".
- Never use scaffold labels like "Admired Quality", "Aspirational Signal", "Value in Motion", "Builder Evidence", "Tried in Reality", or "Learning Through Action".
- Titles should sound like meaningful Atlas Dots, but they must be created from the current conversation.
- Prefer transformation, service, resilience, creation, and lived anchors over generic personality labels.
- If action is ASK or SHOW_INTERACTION, candidateDots must be an empty array.`;

    const userPrompt = mode === "interaction"
      ? `The user completed a focused reflection for hidden route "${activeMission}". Interaction response: ${serializedInteraction}\n\nActive quest theme: ${String(activeQuestTheme)}\n\nRecent conversation: ${serializedMessages}\n\nChoose GENERATE_DOTS. Look across the user's own conversation answers and any written reflection for distinct insights. The selected options can help prioritize insights grounded in those answers. A single supported insight is enough. Use an exact excerpt from the user's own words for each sourceQuote.`
      : `The user said:\n"${String(userText).slice(0, 6000)}"\n\nActive quest theme: ${String(activeQuestTheme)}\nPrior user turns before this message: ${Number(priorUserTurns) || 0}\nCompleted structured reflections in this session: ${Number(interactionCount) || 0}\nUsed structured reflections: ${serializedUsedInteractions}\nFresh test session: ${Boolean(freshSession)}\n\nRecent conversation: ${serializedMessages}\n\nUse the user's latest answer to choose the next step. Let the quest theme guide the topic when it fits their story. On the first reply, choose ASK and follow one specific detail from their answer. On the next reply, choose SHOW_INTERACTION when there is enough to work with, or ASK one focused question to fill a meaningful gap. After that, choose SHOW_INTERACTION if the reflection is still pending.`;

    const response = await callChatCompletion({
      model: "gpt-4o-mini",
      temperature: 0.35,
      max_tokens: mode === "interaction" ? 1600 : 900,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: typeof candidateFeedback === "string" && candidateFeedback.trim()
          ? `${userPrompt}\n\nFeedback on earlier suggestions: ${candidateFeedback.trim().slice(0, 500)}. Use it to refine the wording while grounding each Dot in a quoted answer.`
          : userPrompt },
      ],
    }, {
      usage: { userId: user.id, feature: "future-self-discovery" },
    });

    if (!response.ok) throw new Error("Future Self discovery AI is unavailable.");

    const completion = await response.json();
    const rawContent = completion?.choices?.[0]?.message?.content;
    if (typeof rawContent !== "string") throw new Error("Future Self returned an empty response.");

    const parsed = extractJson(rawContent);
    const mission = asMission(parsed.activeMission);
    const action = mode === "interaction" ? "GENERATE_DOTS" : asAction(parsed.action);
    const userEvidence = (Array.isArray(recentMessages) ? recentMessages : [])
      .filter((message) => message?.role === "user" && typeof message.content === "string"
        && !(typeof message.id === "string" && message.id.startsWith("interaction-")))
      .map((message) => message.content);
    if (mode === "conversation" && typeof userText === "string") userEvidence.push(userText);
    if (mode === "interaction" && isRecord(interactionResponse) && typeof interactionResponse.lessonInOwnWords === "string") {
      userEvidence.push(interactionResponse.lessonInOwnWords);
    }
    const candidateDots = action === "GENERATE_DOTS" ? asCandidateDots(parsed.candidateDots, userEvidence, allowedClusters) : [];

    return new Response(JSON.stringify({
      message: typeof parsed.message === "string"
        ? parsed.message
        : "I am hearing a useful signal. Let's stay close to the evidence before turning it into a Dot.",
      activeMission: mission,
      action,
      state: action === "ASK" ? "FOLLOW_UP" : action === "SHOW_INTERACTION" ? "INTERACTION" : "READY_FOR_DOTS",
      coverage: {
        mission,
        score: Number(parsed.coverage?.score ?? 0.4),
        covered: Array.isArray(parsed.coverage?.covered) ? parsed.coverage.covered.slice(0, 5) : [],
        missing: Array.isArray(parsed.coverage?.missing) ? parsed.coverage.missing.slice(0, 5) : [],
      },
      interactionKey: action === "SHOW_INTERACTION" ? interactionKeys[mission] : undefined,
      deferredSignals: Array.isArray(parsed.deferredSignals) ? parsed.deferredSignals.slice(0, 3).map((signal: unknown) => {
        const signalRecord = isRecord(signal) ? signal : {};
        return {
          topic: typeof signalRecord.topic === "string" ? signalRecord.topic : "related signal",
          possibleMissions: Array.isArray(signalRecord.possibleMissions)
            ? signalRecord.possibleMissions.map(asMission).slice(0, 3)
            : [mission],
          reason: typeof signalRecord.reason === "string" ? signalRecord.reason : "This may be useful later.",
          explored: false,
        };
      }) : [],
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence.slice(0, 4).map((item: unknown, index: number): AiEvidence => {
        const itemRecord = isRecord(item) ? item : {};
        const evidenceClass = itemRecord.evidenceClass;
        return {
          id: `${mission}-ai-${index + 1}`,
          mission,
          evidenceClass: ["FACT", "SELF_INTERPRETATION", "AI_HYPOTHESIS"].includes(String(evidenceClass))
            ? evidenceClass as AiEvidence["evidenceClass"]
            : "AI_HYPOTHESIS",
          text: typeof itemRecord.text === "string" ? itemRecord.text : "",
          source: mode === "interaction" ? "selected Atlas interaction" : "AI-guided discovery",
          confidence: Number(itemRecord.confidence ?? 0.6),
        };
      }).filter((item) => item.text) : [],
      privateSignals: asPrivateSignals(parsed.privateSignals),
      nextMove: isRecord(parsed.nextMove) ? {
        priority: typeof parsed.nextMove.priority === "string" ? parsed.nextMove.priority : "atlas_deepening",
        reason: typeof parsed.nextMove.reason === "string" ? parsed.nextMove.reason : "Continue the discovery with one grounded follow-up.",
        suggestedQuestion: typeof parsed.nextMove.suggestedQuestion === "string" ? parsed.nextMove.suggestedQuestion : "",
        recommendedMentor: typeof parsed.nextMove.recommendedMentor === "string" ? parsed.nextMove.recommendedMentor : undefined,
      } : undefined,
      impactOptions: activeQuestTheme === "world" ? {
        audiences: asImpactOptions(parsed.impactOptions?.audiences),
        needs: asImpactOptions(parsed.impactOptions?.needs),
      } : undefined,
      candidateDots,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
