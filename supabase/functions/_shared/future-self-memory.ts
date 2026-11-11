type SupabaseLike = {
  from: (table: string) => any;
};

export type FutureSelfMemoryOptions = {
  purpose?: "future_self" | "council" | "mentor";
  activeQuestTheme?: string;
  currentUserText?: string;
  recentMessages?: unknown[];
};

const COUNCIL_DIRECTION_START = "=== CURRENT DISCOVERY DIRECTION ===";
const COUNCIL_DIRECTION_END = "=== END CURRENT DISCOVERY DIRECTION ===";

export function readCouncilDirection(memory: string): string {
  const start = memory.indexOf(COUNCIL_DIRECTION_START);
  const end = memory.indexOf(COUNCIL_DIRECTION_END, start);
  return start >= 0 && end >= 0 ? memory.slice(start, end + COUNCIL_DIRECTION_END.length) : "";
}

const MEMORY_STOP_WORDS = new Set([
  "about", "after", "also", "because", "before", "being", "could", "from", "have", "into",
  "just", "more", "that", "their", "them", "there", "these", "they", "this", "want", "what",
  "when", "where", "which", "with", "would", "your", "you", "user", "future", "self",
]);

const QUEST_MEMORY_TERMS: Record<string, string[]> = {
  origin: ["background", "journey", "life", "place", "change", "moment"],
  gifts: ["skill", "talent", "learn", "influence", "create", "connect", "experience"],
  world: ["help", "serve", "impact", "people", "purpose", "audience", "creator", "community"],
  experiments: ["build", "built", "test", "project", "iterate", "feedback", "experiment", "created"],
  current: ["action", "decision", "challenge", "current", "next", "project", "move", "opportunity"],
};

function cleanText(value: unknown, max = 220): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function line(label: string, value: unknown, max = 220): string {
  const text = cleanText(value, max);
  return text ? `${label}: ${text}` : "";
}

function section(title: string, lines: string[]): string {
  const body = lines.filter(Boolean).join("\n");
  return body ? `\n${title}\n${body}` : "";
}

function uniqueLines(lines: string[], maxItems: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const line of lines) {
    const normalized = line.replace(/\s+/g, " ").trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(line);
    if (result.length >= maxItems) break;
  }

  return result;
}

function memoryTokens(value: unknown): string[] {
  return Array.from(new Set(
    String(value ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 4 && !MEMORY_STOP_WORDS.has(token)),
  ));
}

function compactLines(lines: string[], maxItems: number, maxChars: number, relevanceQuery = ""): string[] {
  const unique = uniqueLines(lines, 200);
  const queryTokens = memoryTokens(relevanceQuery);
  const ranked = unique
    .map((value, index) => {
      const normalized = value.toLowerCase();
      const relevance = queryTokens.reduce((score, token) => score + (normalized.includes(token) ? 1 : 0), 0);
      return { value, index, score: relevance * 10 + (unique.length - index) / 1000 };
    })
    .sort((a, b) => b.score - a.score);

  const selected: string[] = [];
  let usedChars = 0;
  for (const item of ranked) {
    if (selected.length >= maxItems) break;
    if (usedChars + item.value.length > maxChars && selected.length > 0) continue;
    selected.push(item.value);
    usedChars += item.value.length;
  }

  return selected;
}

function compactSection(
  title: string,
  lines: string[],
  maxItems: number,
  maxChars: number,
  relevanceQuery: string,
): string {
  return section(title, compactLines(lines, maxItems, maxChars, relevanceQuery));
}

export async function buildFutureSelfMemoryContext(
  supabaseClient: SupabaseLike,
  userId: string,
  options: FutureSelfMemoryOptions = {},
): Promise<string> {
  const purpose = options.purpose || "future_self";
  const questTheme = String(options.activeQuestTheme || "").toLowerCase();
  const recentMessageText = Array.isArray(options.recentMessages)
    ? options.recentMessages.map((message: any) => message?.content || "").join(" ")
    : "";
  const relevanceQuery = [
    questTheme,
    QUEST_MEMORY_TERMS[questTheme] || [],
    options.currentUserText || "",
    recentMessageText,
  ].flat().join(" ");
  const [
    dotsResult,
    lifetimeResult,
    projectsResult,
    consoleResult,
    privateMessagesResult,
    outreachResult,
    futureMessagesResult,
    futureSelfQuestsResult,
  ] = await Promise.allSettled([
    supabaseClient
      .from("atlas_dots")
      .select("title, short_description, original_description, dot_category, source_system, signal_tags, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(24),
    supabaseClient
      .from("lifetime_events")
      .select("id, event_label, event_description, event_type, time_period, gold_outcome, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(16),
    supabaseClient
      .from("integrator_projects")
      .select("id, project_title, project_description, project_type, status, current_phase, current_day, why_this_matters, weekly_focus_intent, project_canvas, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(8),
    supabaseClient
      .from("console_thread_messages")
      .select("role, content, mentor_type, phase, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabaseClient
      .from("mentor_private_messages")
      .select("mentor_type, message, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(12),
    supabaseClient
      .from("mentor_daily_outreach")
      .select("mentor_type, message, message_type, context_source, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(12),
    supabaseClient
      .from("future_self_messages")
      .select("message, trigger_reason, emotional_tone, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabaseClient
      .from("atlas_quests")
      .select("quest_key, interactions, completed_at")
      .eq("user_id", userId)
      .like("quest_key", "future_self_%")
      .eq("status", "completed")
      .order("completed_at", { ascending: true })
      .limit(16),
  ]);

  const rows = <T = any>(result: PromiseSettledResult<any>): T[] => {
    if (result.status !== "fulfilled") return [];
    return Array.isArray(result.value?.data) ? result.value.data : [];
  };

  const dots = rows(dotsResult)
    .map((dot: any) => {
      const description = dot.short_description || dot.original_description;
      const signalTags = dot.signal_tags && typeof dot.signal_tags === "object" ? dot.signal_tags : {};
      const questTheme = cleanText(signalTags.questTheme, 40);
      return `- ${cleanText(dot.title, 90)}${description ? ` — ${cleanText(description, 180)}` : ""}${dot.dot_category ? ` (${dot.dot_category})` : ""}${questTheme ? ` [quest: ${questTheme}]` : ""}`;
    })
    .filter(Boolean);

  const lifetime = rows(lifetimeResult)
    .map((event: any) => {
      const parts = [
        `event_id: ${event.id}`,
        cleanText(event.event_label, 100),
        event.time_period ? `time: ${cleanText(event.time_period, 40)}` : "",
        event.event_description ? cleanText(event.event_description, 180) : "",
        event.gold_outcome ? `gold: ${cleanText(event.gold_outcome, 120)}` : "",
        ...rows(dotsResult).filter((dot: any) => dot.signal_tags?.timeline_event_id === event.id && dot.source_system !== "life_timeline")
          .slice(0, 4).map((dot: any) => `connected insight: ${cleanText(dot.title, 90)} - ${cleanText(dot.short_description, 180)}`),
      ].filter(Boolean);
      return parts.length ? `- ${parts.join(" | ")}` : "";
    })
    .filter(Boolean);

  const projects = rows(projectsResult)
    .map((project: any) => {
      const parts = [
        cleanText(project.project_title, 100),
        project.status ? `status: ${cleanText(project.status, 40)}` : "",
        project.current_phase ? `phase: ${cleanText(project.current_phase, 60)}` : "",
        project.project_description ? cleanText(project.project_description, 180) : "",
        project.why_this_matters ? `why: ${cleanText(project.why_this_matters, 160)}` : "",
        project.weekly_focus_intent ? `focus: ${cleanText(project.weekly_focus_intent, 120)}` : "",
        project.project_canvas ? `confirmed project canvas (${project.id}): ${cleanText(JSON.stringify(project.project_canvas), 1500)}` : "",
      ].filter(Boolean);
      return parts.length ? `- ${parts.join(" | ")}` : "";
    })
    .filter(Boolean);

  const recentConversation = rows(consoleResult)
    .reverse()
    .map((message: any) => {
      const speaker = message.role === "user"
        ? "User"
        : message.mentor_type
          ? `Mentor:${message.mentor_type}`
          : "System";
      return `- ${speaker}: ${cleanText(message.content, 220)}`;
    })
    .filter(Boolean);

  const mentorSignals = [
    ...rows(privateMessagesResult).map((message: any) =>
      `- ${cleanText(message.mentor_type, 50)} private: ${cleanText(message.message, 180)}`),
    ...rows(outreachResult).map((message: any) =>
      `- ${cleanText(message.mentor_type, 50)} ${cleanText(message.message_type, 50)}: ${cleanText(message.message, 180)}`),
  ].filter(Boolean).slice(0, 10);

  const futureSelfMessages = rows(futureMessagesResult)
    .map((message: any) => {
      const reason = message.trigger_reason ? ` (${cleanText(message.trigger_reason, 60)})` : "";
      return `- ${cleanText(message.message, 220)}${reason}`;
    })
    .filter(Boolean);

  const futureSelfQuestMemory = rows(futureSelfQuestsResult)
    .map((quest: any) => {
      const interactions = quest?.interactions || {};
      const transcript = Array.isArray(interactions.conversationTranscript)
        ? interactions.conversationTranscript
        : [];
      const evidence = Array.isArray(interactions.conversationEvidence)
        ? interactions.conversationEvidence
        : [];
      const selectedDots = Array.isArray(interactions.selectedDots)
        ? interactions.selectedDots
        : interactions.selectedDot
          ? [interactions.selectedDot]
          : [];
      const offeredDots = Array.isArray(interactions.offeredDots)
        ? interactions.offeredDots
        : [];
      const dotProvenance = Array.isArray(interactions.dotProvenance)
        ? interactions.dotProvenance
        : selectedDots;
      const privateSignalMap = interactions.privateSignalMap || {};
      const mentorHandoff = privateSignalMap.mentorHandoff || {};
      const questEvidence = Array.isArray(interactions.questEvidence)
        ? interactions.questEvidence
        : Array.isArray(mentorHandoff.questEvidence)
          ? mentorHandoff.questEvidence
          : [];
      const transcriptLines = transcript
        .filter((message: any) => message && (message.role === "user" || message.role === "future-self"))
        .slice(-18)
        .map((message: any) => {
          const role = message.role === "user" ? "User" : "Future Self";
          return `  - ${role}: ${cleanText(message.content, message.role === "user" ? 360 : 240)}`;
        })
        .filter(Boolean);
      const evidenceLines = evidence
        .slice(0, 6)
        .map((item: any) => `  - ${cleanText(item?.evidenceClass, 40)}: ${cleanText(item?.text, 280)}`)
        .filter((line: string) => !line.endsWith(": "));
      const dotLines = selectedDots
        .slice(0, 4)
        .map((dot: any, index: number) => {
          const provenance = dotProvenance[index] || dot;
          const id = provenance?.savedDotId ? ` [saved: ${cleanText(provenance.savedDotId, 48)}]` : "";
          return `  - ${cleanText(dot?.title || provenance?.title, 100)} — ${cleanText(dot?.description || dot?.short_description || provenance?.description, 240)}${id}`;
        })
        .filter((line: string) => !line.startsWith("  -  —"));
      const offeredDotLines = offeredDots
        .slice(0, 3)
        .map((dot: any) => `  - ${cleanText(dot?.title, 100)} — ${cleanText(dot?.description || dot?.short_description, 220)}`)
        .filter((line: string) => !line.startsWith("  -  —"));
      const handoffLines = [
        Array.isArray(mentorHandoff.followUpAnswers) && mentorHandoff.followUpAnswers.length
          ? `  - User's answers to follow-up questions: ${mentorHandoff.followUpAnswers.map((answer: unknown) => cleanText(answer, 400)).filter(Boolean).join(" | ")}`
          : "",
        mentorHandoff.transferableSkills?.length
          ? `  - Transferable skills: ${mentorHandoff.transferableSkills.map((signal: any) => cleanText(signal?.summary, 180)).filter(Boolean).join(" | ")}`
          : "",
        mentorHandoff.valueSignals?.length
          ? `  - Values and audience: ${mentorHandoff.valueSignals.map((signal: any) => cleanText(signal?.summary, 180)).filter(Boolean).join(" | ")}`
          : "",
        mentorHandoff.activeProjectSeed?.length
          ? `  - Possible project directions to confirm with the user: ${mentorHandoff.activeProjectSeed.map((signal: any) => cleanText(signal?.summary, 180)).filter(Boolean).join(" | ")}`
          : "",
        mentorHandoff.validatedDotClusters?.length
          ? `  - Dot clusters: ${mentorHandoff.validatedDotClusters.map((cluster: any) => `${cleanText(cluster?.title, 100)} → ${cleanText(cluster?.clusterSlug, 80)}`).filter(Boolean).join(" | ")}`
          : "",
        questEvidence.length
          ? `  - Quest evidence: ${questEvidence.map((evidence: any) => cleanText(evidence, 300)).filter(Boolean).join(" | ").slice(0, 1200)}`
          : "",
        Array.isArray(mentorHandoff.activityEvidence) && mentorHandoff.activityEvidence.length
          ? `  - Activity evidence: ${mentorHandoff.activityEvidence.map((evidence: any) => cleanText(evidence, 260)).filter(Boolean).join(" | ").slice(0, 900)}`
          : "",
      ].filter(Boolean);

      const body = [
        `- Quest: ${cleanText(quest.quest_key, 100)}`,
        transcriptLines.length ? `  Conversation:\n${transcriptLines.join("\n")}` : "",
        evidenceLines.length ? `  Evidence:\n${evidenceLines.join("\n")}` : "",
        offeredDotLines.length ? `  Provisional Dots offered:\n${offeredDotLines.join("\n")}` : "",
        dotLines.length ? `  Dots: \n${dotLines.join("\n")}` : "",
        handoffLines.length ? `  Handoff signals:\n${handoffLines.join("\n")}` : "",
      ].filter(Boolean);
      return body.join("\n");
    })
    .filter(Boolean)
    .join("\n");

  const questRows = rows(futureSelfQuestsResult);
  const questSignals = questRows.flatMap((quest: any) => {
    const privateSignals = quest?.interactions?.privateSignalMap?.privateSignals;
    return Array.isArray(privateSignals) ? privateSignals : [];
  });

  const signalLines = (types: string[], maxItems: number): string[] => uniqueLines(
    questSignals
      .filter((signal: any) => types.includes(String(signal?.type || "")))
      .map((signal: any) => {
        const summary = cleanText(signal?.summary, 320);
        const mentorUse = cleanText(signal?.mentorUse, 180);
        return summary
          ? `- ${summary}${mentorUse ? ` | Guidance use: ${mentorUse}` : ""}`
          : "";
      })
      .filter(Boolean),
    maxItems,
  );

  const validatedDotLines = uniqueLines(
    questRows.flatMap((quest: any) => {
      const interactions = quest?.interactions || {};
      const selectedDots = Array.isArray(interactions.dotProvenance)
        ? interactions.dotProvenance
        : Array.isArray(interactions.selectedDots)
          ? interactions.selectedDots
          : interactions.selectedDot
            ? [interactions.selectedDot]
            : [];
      const clusters = interactions.privateSignalMap?.mentorHandoff?.validatedDotClusters || [];

      return selectedDots.map((dot: any, index: number) => {
        const title = cleanText(dot?.title, 110);
        const description = cleanText(dot?.description || dot?.short_description, 300);
        const cluster = cleanText(dot?.clusterSlug || clusters[index]?.clusterSlug, 80);
        return title
          ? `- ${title}${cluster ? ` [cluster: ${cluster}]` : ""}${description ? ` — ${description}` : ""}`
          : "";
      });
    }),
    24,
  );

  const activityLines = uniqueLines(
    questRows.flatMap((quest: any) => {
      const responses = quest?.interactions?.interactionResponses;
      if (!responses || typeof responses !== "object") return [];
      return Object.entries(responses).map(([key, value]) => {
        const response = cleanText(typeof value === "string" ? value : JSON.stringify(value), 420);
        return response ? `- ${cleanText(key, 100)}: ${response}` : "";
      });
    }),
    16,
  );

  const userEvidenceLines = uniqueLines(
    questRows.flatMap((quest: any) => {
      const questKey = cleanText(quest?.quest_key, 80);
      const transcript = Array.isArray(quest?.interactions?.conversationTranscript)
        ? quest.interactions.conversationTranscript
        : [];
      return transcript
        .filter((message: any) => message?.role === "user")
        .map((message: any) => {
          const content = cleanText(message.content, 520);
          return content ? `- [${questKey}] ${content}` : "";
        });
    }),
    28,
  );

  const timelineCandidates = uniqueLines(
    questRows.flatMap((quest: any) => {
      const candidates = quest?.interactions?.privateSignalMap?.timelineCandidates;
      if (!Array.isArray(candidates)) return [];
      return candidates.map((candidate: any) => {
        const text = cleanText(
          candidate?.summary || candidate?.title || candidate?.event_label || JSON.stringify(candidate),
          300,
        );
        return text ? `- ${text}` : "";
      });
    }),
    16,
  );

  const directionClusters = [
    ["who-i-serve", "Who I Serve"],
    ["how-i-create-impact", "How I Create Impact"],
    ["vision-for-a-better-world", "Vision for a Better World"],
  ];
  const latestWorldQuest = [...questRows].reverse().find((quest: any) =>
    quest?.interactions?.questTheme === "world" ||
    quest?.interactions?.privateSignalMap?.mentorHandoff?.questTheme === "world" ||
    /_world$/.test(String(quest?.quest_key || ""))
  );
  const worldTranscript = latestWorldQuest?.interactions?.conversationTranscript;
  const directWorldAnswers = Array.isArray(worldTranscript)
    ? uniqueLines(worldTranscript.filter((message: any) => message?.role === "user")
      .map((message: any) => cleanText(message.content, 650)), 4)
    : [];
  const worldReflection = Array.isArray(latestWorldQuest?.interactions?.activityEvidence)
    ? uniqueLines(latestWorldQuest.interactions.activityEvidence
      .map((answer: unknown) => cleanText(answer, 420)), 3)
    : [];
  const directionDotLines = directionClusters.flatMap(([slug, label]) =>
    validatedDotLines.filter((line) => line.includes("[cluster: " + slug + "]"))
      .slice(-2).map((line) => label + ": " + line)
  );
  const audienceSignals = signalLines(["audience_signal"], 6);
  const councilDirection = [
    COUNCIL_DIRECTION_START,
    "The user's latest explicit choice takes priority. Future Self world answers describe what they want to do next. A past project and the people it served are evidence of capability; they do not establish the current audience.",
    compactSection("User's own words about who and what they want to change", directWorldAnswers, 4, 2700),
    compactSection("User's choices from the World reflection", worldReflection, 3, 1300),
    compactSection("Validated audience, impact and vision Dots", directionDotLines, 6, 2400),
    compactSection("Additional audience signals", audienceSignals, 6, 1500),
    "If there is no explicit audience or impact, treat it as open. Keep distinct audiences distinct until the user chooses.",
    COUNCIL_DIRECTION_END,
  ].join("\n");

  const councilBriefing = [
    "\n=== FUTURE SELF COUNCIL BRIEFING — SOURCE OF TRUTH ===",
    "This briefing is built from the user's completed Future Self conversations. Treat explicit user-stated audiences, desired impact, lived experiences, skills, and projects as authoritative.",
    "Do not replace a named audience with a generic 'community', 'users', or 'people with digital problems'. If the user named two audiences, preserve both and explain how they connect.",
    "Every mentor should connect at least one lived anchor or experiment with one skill, value, audience, or desired outcome. The advice must feel possible only for this person.",
    compactSection("User-stated audiences and desired impact", signalLines(["audience_signal", "value_signal"], 16), purpose === "council" ? 12 : 8, 2600, relevanceQuery),
    compactSection("Transferable skills and ways of creating", signalLines(["transferable_skill"], 16), purpose === "council" ? 12 : 8, 2600, relevanceQuery),
    compactSection("Project seeds and possible connections", signalLines(["project_seed", "possible_connection", "mentor_handoff_context"], 16), purpose === "council" ? 12 : 8, 2600, relevanceQuery),
    compactSection("Lived moments to use as evidence", signalLines(["timeline_moment"], 16).concat(timelineCandidates), purpose === "council" ? 10 : 6, 2400, relevanceQuery),
    compactSection("Validated Dots and their clusters", validatedDotLines, purpose === "council" ? 12 : 8, 3200, relevanceQuery),
    compactSection("Structured reflection and activity responses", activityLines, purpose === "council" ? 10 : 6, 2800, relevanceQuery),
    compactSection("User's own Future Self words", userEvidenceLines, purpose === "council" ? 14 : 8, 5200, relevanceQuery),
    "Before proposing a next move, combine the strongest audience, value, skill, and lived experiment. Do not ask the user to rediscover information already present here.",
    "=== END FUTURE SELF COUNCIL BRIEFING ===",
  ].join("\n");

  const contextSections = [
    purpose === "council" ? councilDirection : "",
    councilBriefing,
    compactSection("Validated Atlas dots", dots, purpose === "council" ? 14 : 10, 3800, relevanceQuery),
    compactSection("Life moments and anchors", lifetime, purpose === "council" ? 10 : 7, 2400, relevanceQuery),
    compactSection("Current projects and action context", projects, purpose === "council" ? 7 : 5, 2400, relevanceQuery),
    compactSection("Recent Council / Future Self conversation", recentConversation, purpose === "council" ? 10 : 7, 3000, relevanceQuery),
    compactSection("Mentor signals and follow-ups", mentorSignals, purpose === "council" ? 8 : 5, 2200, relevanceQuery),
    compactSection("Recent Future Self messages", futureSelfMessages, purpose === "council" ? 7 : 4, 1800, relevanceQuery),
    compactSection("Future Self discovery detail", futureSelfQuestMemory.split("\n"), purpose === "council" ? 48 : 28, purpose === "council" ? 9000 : 5600, relevanceQuery),
  ];
  const maxContextChars = purpose === "council" ? 26000 : 19000;
  const rawContext = contextSections.join("");
  const context = rawContext.length <= maxContextChars
    ? rawContext
    : `${rawContext.slice(0, maxContextChars)}\n- Older supporting details omitted from this response; they remain stored for later retrieval.`;

  if (!context.trim()) return "";

  return `
=== FUTURE SELF OMNIPRESENT MEMORY SNAPSHOT ===
Use this silently as continuity. It is not a script and not all of it should be revealed.
Future Self should act like a trusted partner who remembers the user's Atlas, life moments, mentor conversations, and project momentum.
Use it to:
- avoid repeating questions already answered,
- ask the next best question,
- connect old dots with current action,
- suggest the right mentor or team,
- reveal only one meaningful insight at a time.
Priority order:
- The current user message and current quest are strongest.
- Explicitly validated Dots, life moments, and project facts are supporting anchors.
- Older mentor interpretations are hypotheses, not facts; never let them override the user's newer words.
The full history remains stored, but this snapshot is intentionally ranked and compact for the current response.
Do not say "I see in the database" or expose table/source names.
${context}
=== END FUTURE SELF OMNIPRESENT MEMORY SNAPSHOT ===
`;
}
