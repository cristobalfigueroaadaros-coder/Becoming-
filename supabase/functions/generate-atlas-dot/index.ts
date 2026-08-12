import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callChatCompletion } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CLUSTER_INTELLIGENCE: Record<string, {
  signal: string;
  correctExamples: string[];
  wrongExamples: string[];
  dotStyle: string;
  slug: string;
  formatRule: string;
}> = {
  "Life Events": {
    slug: "life-events",
    signal: "Objective facts. A significant moment the user can name and date.",
    correctExamples: ["Built First Business in Chile", "Moved to Germany Alone", "Left Stability to Explore the World"],
    wrongExamples: ["Resilient Navigator (interpretation)", "Turning Point Experience (too abstract)"],
    dotStyle: "Name the fact of what happened. No interpretation. 3-6 words.",
    formatRule: "Must describe a real past event that happened. Not a capability, emotion, or identity label.",
  },
  "Natural Talents": {
    slug: "natural-talents",
    signal: "What the user can do effortlessly that others find difficult.",
    correctExamples: ["Understands How Systems Work", "Learns Fast by Doing", "Reads a Room Instantly"],
    wrongExamples: ["Smart Thinker (too vague)", "Natural Leader (generic)"],
    dotStyle: "Name the specific ability, not a generic label.",
    formatRule: "Must describe an effortless natural ability. Must NOT duplicate skills. Not an emotion or life event.",
  },
  "Childhood Signals": {
    slug: "childhood-signals",
    signal: "Early indicators of the user's nature before the world shaped them.",
    correctExamples: ["Loved Sport as a Kid", "Always Asked Why", "Grew Up Feeling Loved"],
    wrongExamples: ["Active Child (too generic)", "Curious Kid (meaningless)"],
    dotStyle: "Name the childhood signal specifically.",
    formatRule: "Must describe a childhood memory or early life signal. Not a current skill or adult experience.",
  },
  "Passions": {
    slug: "passions",
    signal: "What the user loves doing, not what they are good at.",
    correctExamples: ["Love Creating Experiences", "Driven by Curiosity", "Enjoys Learning Everything"],
    wrongExamples: ["Explorer Mindset (cognitive style)", "Growth Seeker (too abstract)"],
    dotStyle: "Name the passion using active language.",
    formatRule: "Must describe what energizes the user. Not a skill, solution, or identity label.",
  },
  "Values": {
    slug: "values",
    signal: "What matters deeply to the user regardless of circumstance.",
    correctExamples: ["Family First", "Connection Over Everything", "Acts with Honesty"],
    wrongExamples: ["Integrity (too abstract)", "Strong Principles (not personal)"],
    dotStyle: "Name the specific value and how it shows up.",
    formatRule: "Must describe a deeply held value. Not a skill, passion, or identity label.",
  },
  "Skills": {
    slug: "skills",
    signal: "What the user has built through practice and experience.",
    correctExamples: ["Turns Ideas into Reality", "Connects People Naturally", "Sells Through Story"],
    wrongExamples: ["Smart (not a skill)", "Creative (passion, not skill)"],
    dotStyle: "Name the specific skill, not a trait.",
    formatRule: "Must describe a repeatable capability the user can DO. Not an emotion, life event, or identity label.",
  },
  "Experiments": {
    slug: "experiments",
    signal: "Things the user actively tried or built.",
    correctExamples: ["Built E-commerce from Scratch", "Left Stability to Start Over"],
    wrongExamples: ["Tried Things (too vague)", "Risk Taker (interpretation)"],
    dotStyle: "Name the experiment specifically.",
    formatRule: "Must describe a real action the user has taken or built. Not an idea, trait, or emotion.",
  },
  "Aha Moments": {
    slug: "aha-moments",
    signal: "Specific moments of realization that changed direction.",
    correctExamples: ["Stopped Judging by Appearance in Berlin", "Realized AI Could Simulate Mentorship"],
    wrongExamples: ["Confidence Boost (not a moment)", "Changed Perspective (too generic)"],
    dotStyle: "Name the specific realization.",
    formatRule: "Must describe a specific realization moment. Not a skill, strength, or general trait.",
  },
  "Personal Frustrations": {
    slug: "personal-frustrations",
    signal: "What frustrates the user points to what matters most.",
    correctExamples: ["Hates Wasted Potential", "Can't Stand Superficial Connection"],
    wrongExamples: ["Anger Issues (clinical label)", "Frustrated Person (too generic)"],
    dotStyle: "Name the frustration specifically. Use the user's own words.",
    formatRule: "Must describe something that bothers or frustrates the user. Not a solution, identity, or positive strength.",
  },
  "Inspirations": {
    slug: "inspirations",
    signal: "Who and what inspires the user.",
    correctExamples: ["Inspired by Quiet Courage", "Drawn to People Who Build from Nothing"],
    wrongExamples: ["Inspired Person (meaningless)", "Deep Thinker (generic)"],
    dotStyle: "Name what specifically inspires them.",
    formatRule: "Must name a person, source, or quality that inspires the user. Not a strength or identity label.",
  },
  "Vision for a Better World": {
    slug: "vision-for-a-better-world",
    signal: "What the user wants to change in the world.",
    correctExamples: ["Everyone Deserves a Mentor", "Creative Education for All"],
    wrongExamples: ["World Changer (too vague)", "Visionary (label)"],
    dotStyle: "Name the specific vision or change.",
    formatRule: "Must describe a desired future or world the user wants to create. Not a skill or identity.",
  },
  "Ideal Life": {
    slug: "ideal-life",
    signal: "What the user's ideal day, environment, and relationships look like.",
    correctExamples: ["Morning Creative Time by the Ocean", "Freedom to Work from Anywhere"],
    wrongExamples: ["Happy Life (meaningless)", "Balance (too abstract)"],
    dotStyle: "Name the specific element of their ideal life.",
    formatRule: "Must describe a desired life element — environment, rhythm, or relationship. Not a skill or identity.",
  },
  "External Reflections": {
    slug: "external-reflections",
    signal: "What others have told the user about themselves.",
    correctExamples: ["Others See Me as a Leader", "Known for Bringing People Together"],
    wrongExamples: ["Wisdom Seeker (internal)", "Strong Person (too vague)"],
    dotStyle: "Name what others see.",
    formatRule: "Must describe what other people have said or noticed about the user. Not an internal feeling.",
  },
  "Who I Serve": {
    slug: "who-i-serve",
    signal: "The specific people or group the user feels most called to help.",
    correctExamples: ["Feels Called to Help Families Reconnect", "Wants to Help People Who Feel Lost", "Drawn to Supporting Creators with Purpose"],
    wrongExamples: ["Helping Others (too vague)", "Service Oriented (label)"],
    dotStyle: "Name the specific audience and emotional connection.",
    formatRule: "Must name a specific group of people the user wants to help. Not a method, skill, or identity label.",
  },
  "How I Create Impact": {
    slug: "how-i-create-impact",
    signal: "How the user naturally expresses value and creates change in the world.",
    correctExamples: ["Creates Experiences That Help People Feel Connected", "Uses Conversation to Help People Find Clarity", "Builds Systems That Guide People Step by Step"],
    wrongExamples: ["Makes an Impact (meaningless)", "Change Maker (generic label)"],
    dotStyle: "Name the specific action and its effect on others.",
    formatRule: "Must describe the mechanism or method through which the user helps. Not an audience or identity label.",
  },
};

function formatResponses(responses: any[]): string {
  return responses.map((r: any, i: number) => {
    if (typeof r === "string") return `Response ${i + 1}: "${r}"`;
    if (Array.isArray(r)) return `Response ${i + 1}: ${r.join(", ")}`;
    if (typeof r === "number") return `Response ${i + 1}: option ${r}`;
    if (typeof r === "object" && r !== null) {
      if (r.then && r.now) return `Response ${i + 1}: Then: "${r.then}" / Now: "${r.now}"`;
      return `Response ${i + 1}: ${JSON.stringify(r)}`;
    }
    return `Response ${i + 1}: ${JSON.stringify(r)}`;
  }).join("\n");
}

function getReflectionText(responses: any[]): string {
  const lastResponse = responses[responses.length - 1];
  if (typeof lastResponse === "string") return lastResponse;
  if (lastResponse?.then && lastResponse?.now) return `Then: ${lastResponse.then}. Now: ${lastResponse.now}`;
  return "";
}

function getClusterContext(clusterName: string): string {
  const clusterIntel = CLUSTER_INTELLIGENCE[clusterName];
  if (!clusterIntel) return `CLUSTER: "${clusterName}"`;
  return `CLUSTER: "${clusterName}"
SIGNAL THIS CLUSTER HUNTS FOR: ${clusterIntel.signal}
DOT NAMING STYLE: ${clusterIntel.dotStyle}
FORMAT RULE: ${clusterIntel.formatRule}

CORRECT DOT EXAMPLES:
${clusterIntel.correctExamples.map(e => `- "${e}"`).join("\n")}

WRONG DOT EXAMPLES (NEVER generate like these):
${clusterIntel.wrongExamples.map(e => `- ${e}`).join("\n")}`;
}

const BASE_RULES = `CRITICAL RULES FOR TITLE:
- 3-6 words. Must feel like something the user would say about themselves.
- Must echo the user's own language — extract key words from their answer.
- Must be specific enough that the user recognizes their own life in it.
- If the dot could apply to anyone, it is WRONG. Regenerate.
- Use simple, concrete language. No psychological labels. No poetic abstractions.

CRITICAL RULES FOR DESCRIPTION:
- 1-2 sentences maximum.
- MUST reference something specific the user actually said.
- Sound like a friend reflecting back, not an AI analyzing.
- Never use generic phrases like "Discovered through Atlas quest exploration."

PRIMARY SIGNAL RULE:
- The open reflection answer (final response) is the PRIMARY input for the dot title.
- If you cannot generate a meaningful dot from it, use the next most specific response.

LANGUAGE ECHO RULE:
- Extract the user's own key words, phrases, or emotional signals.
- Use those words in the dot title.`;

const CLUSTER_INTEGRITY_RULE = `CLUSTER INTEGRITY RULE (CRITICAL):
The dot MUST match the type of truth this cluster represents.
- Do NOT generate a skill in a life-events cluster.
- Do NOT generate an emotion in a skills cluster.
- Do NOT generate a solution in a frustrations cluster.
- Do NOT generate an identity label in any cluster.
- The dot stays in THIS cluster. Do NOT suggest a different cluster.
- Read the FORMAT RULE above and follow it strictly.`;

const EMOTIONAL_TONE_RULES = `STEP 1 — EMOTIONAL TONE DETECTION (do this BEFORE naming):
Classify the user's answers into one of these 6 emotional tones:
- "positive_outward" — User describes strengths, abilities, things they do well, or positive qualities about themselves
- "vision_values" — User describes what they want for the world, what matters to them, ideals, or frustration about OTHER PEOPLE or THE WORLD (NOT about themselves)
- "personal_struggle" — User describes their OWN fears, insecurities, internal tensions, or self-doubt
- "factual_event" — User describes an event, fact, or life experience objectively
- "passion_enjoyment" — User describes what they love, enjoy, or feel energized by
- "transformation" — User describes change, growth, or a shift in their perspective

CRITICAL DISTINCTION: If the user says "I'm frustrated by people who waste potential" — that is "vision_values" (about the world), NOT "personal_struggle" (about themselves).`;

const SHADOW_BLACKLIST_RULES = `SHADOW DOT BLACKLIST — READ CAREFULLY:
A shadow dot (dotCategory = "shadow") can ONLY be generated when:
- The user's answer expresses PERSONAL struggle, tension, fear, or self-doubt about THEMSELVES
- The emotional tone is "personal_struggle"

A shadow dot must NEVER be generated when:
- The answer describes someone else's problem or the world's problem (that is "vision_values" → strength dot)
- The answer is positive, outward-facing, or about abilities
- The answer expresses passion, enjoyment, or inspiration

BLACKLISTED shadow names for non-struggle answers:
- Fear of Failure, Perfectionism Loop, Overthinking Pattern, Avoidance Behavior, Self Doubt
- These names may ONLY appear if the user explicitly expressed that specific personal struggle.

If the user says "I hate when people waste their potential" → this is a STRENGTH signal about what matters to them, NOT a shadow. Generate a strength dot like "Hates Wasted Potential" in the frustrations or values cluster.`;

const DOT_SUBTYPE_RULES = `STEP 2 — DOT SUB-TYPE CLASSIFICATION:
After determining emotional tone, classify the dot as one of:
- "behavioral" — Describes what the user DOES (action-oriented). Naming formula: Action + Impact. Example: "Turns Ideas into Reality"
- "motivational" — Describes WHY the user does what they do (drive/purpose). Naming formula: Drive + Direction. Example: "Driven by Curiosity"  
- "identity" — Describes WHO the user is becoming (self-concept). Naming formula: Identity Statement. Example: "The One Who Builds"`;

const SIGNAL_TAG_RULES = `STEP 3 — SIGNAL TAGGING:
For each dot option, also classify these internal tags:
- signalType: one of "skill", "value", "experience", "identity", "audience", "action", "emotional_insight"
- actionType: one of "create", "connect", "guide", "build", "teach", "support", "express", "organize"

These tags help Atlas build cross-cluster intelligence.`;

const DUPLICATE_PREVENTION_RULES = `DUPLICATE PREVENTION (CRITICAL):
- Each of the 3 dot options must be meaningfully different from each other.
- Do NOT generate variations that mean the same thing with different words (e.g., "Problem Solver" and "Debugger" are the same concept).
- Each option must highlight a genuinely different aspect of what the user said.
- If you cannot find 3 genuinely different aspects, make the differences in scope: one specific, one broader, one about the underlying drive.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { mode = "generate", responses, clusterName, patternTitle, feedbackText, dotA, dotB, recentDots, questIndex, isIdentityMoment } = body;
    let systemPrompt = "";
    let userPrompt = "";
    let tools: any[] = [];
    let toolChoice: any = {};

    if (mode === "generate" || mode === "regenerate") {
      const allResponses = formatResponses(responses);
      const reflectionText = getReflectionText(responses);
      const clusterContext = getClusterContext(clusterName);

      systemPrompt = `You are Atlas, a personal discovery mirror. You help people see patterns in their life by reflecting their own words back to them.

${clusterContext}

${CLUSTER_INTEGRITY_RULE}

${EMOTIONAL_TONE_RULES}

${SHADOW_BLACKLIST_RULES}

${DOT_SUBTYPE_RULES}

${SIGNAL_TAG_RULES}

${DUPLICATE_PREVENTION_RULES}

${BASE_RULES}

MIRROR FEEDBACK RULE:
- Also generate a single observational sentence (mirrorFeedback) that reflects what this discovery reveals about the user.
- Use direct, confident language: "You consistently...", "This is how you operate.", "You do this because..." — never "you seem to" or "this suggests".
- Example: "You consistently choose connection over comfort. That is who you are."

CRITICAL: You must generate exactly 3 distinct Atlas Dot options. Each option should have a different angle or interpretation of the user's answers. All 3 should be valid but emphasize different aspects.
- Option 1: Focus on the most literal reading of the user's words
- Option 2: Focus on the underlying motivation or drive
- Option 3: Focus on the identity signal or pattern

${patternTitle ? `A pattern "${patternTitle}" was detected. Use as context but personalize from the user's answers.` : ""}
${mode === "regenerate" && feedbackText ? `The user said the previous options didn't feel right. They said: "${feedbackText}". Generate 3 new alternative variations that better match their intent.` : ""}`;

      userPrompt = `Here are the user's quest responses:\n\n${allResponses}\n\nThe most important response is the final one:\n"${reflectionText}"\n\nFirst detect the emotional tone, then classify the dot sub-type, then generate 3 personalized Atlas Dot options that echo their own words. Remember: the dot MUST match the cluster's format rule.`;

      tools = [{
        type: "function",
        function: {
          name: "create_atlas_dot_options",
          description: "Create 3 Atlas Dot options for the user to choose from.",
          parameters: {
            type: "object",
            properties: {
              emotionalTone: { type: "string", enum: ["positive_outward", "vision_values", "personal_struggle", "factual_event", "passion_enjoyment", "transformation"], description: "The detected emotional tone of the user's answers." },
              dotSubType: { type: "string", enum: ["behavioral", "motivational", "identity"], description: "Classification of what the dot represents." },
              mirrorFeedback: { type: "string", description: "A single observational sentence reflecting what this discovery reveals about the user." },
              variations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "A 3-6 word identity phrase echoing the user's own language." },
                    description: { type: "string", description: "1-2 sentences referencing the user's specific answers." },
                    dotCategory: { type: "string", enum: ["strength", "shadow", "life_imprint"] },
                    signalType: { type: "string", enum: ["skill", "value", "experience", "identity", "audience", "action", "emotional_insight"] },
                    actionType: { type: "string", enum: ["create", "connect", "guide", "build", "teach", "support", "express", "organize"] },
                  },
                  required: ["title", "description", "dotCategory", "signalType", "actionType"],
                  additionalProperties: false,
                },
              },
            },
            required: ["emotionalTone", "dotSubType", "mirrorFeedback", "variations"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "create_atlas_dot_options" } };
    } else if (mode === "check_depth") {
      const reflectionText = typeof responses?.[responses.length - 1] === "string" ? responses[responses.length - 1] : "";
      systemPrompt = `You are Atlas. Your job is to determine if a user's open reflection answer is SHALLOW or DEEP.

SHALLOW answers are:
- Generic labels or roles ("I am a conscious creator", "I like helping people", "I am good at communication")
- Single sentences with no specific memory, person, or moment named
- Abstract statements that could apply to anyone

DEEP answers are:
- Specific, names a person, moment, or place
- Has emotional texture and detail
- Could only come from this specific person

If the answer is shallow, generate ONE gentle follow-up question to pull depth. Follow these rules:
- If answer is a label or role: ask for a specific moment or memory
- If answer describes someone generically: ask what specifically they learned from that person
- If answer is too abstract: ask for a concrete example from their life
- If answer is one sentence with no detail: ask to expand on the feeling

Only ask ONE follow-up. Be warm and curious, not interrogating.`;

      userPrompt = `Cluster: ${clusterName || "unknown"}
User's open reflection answer: "${reflectionText}"

Is this shallow or deep? If shallow, what type of shallow answer is it and what follow-up should we ask?`;

      tools = [{
        type: "function",
        function: {
          name: "check_answer_depth",
          description: "Check if the user's answer is shallow or deep.",
          parameters: {
            type: "object",
            properties: {
              isShallow: { type: "boolean", description: "True if the answer is shallow." },
              shallowType: { type: "string", enum: ["label_or_role", "generic_description", "too_abstract", "too_brief", "not_shallow"], description: "The type of shallow answer." },
              followUpQuestion: { type: "string", description: "A gentle follow-up question to pull depth. Only provided if isShallow is true." },
            },
            required: ["isShallow", "shallowType"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "check_answer_depth" } };
    } else if (mode === "connection_moment") {
      const dotSummary = (recentDots || []).map((d: any) => `- "${d.title}" (${d.dotCategory || "strength"})`).join("\n");
      const isIdentity = isIdentityMoment === true;
      const momentIndex = questIndex ?? 0;

      systemPrompt = `You are Atlas. Generate a connection moment reflection that connects the user's recent discoveries.

${isIdentity ? `This is the FINAL connection moment after 13 onboarding quests. Generate:
1. A "reflection" — 2-3 sentences connecting the user's discoveries into a pattern. Be observational, reference specific dot names.
2. An "identityStatement" — 2-3 sentences that capture the user's Identity Direction. This should feel earned and personally true. Start with "You" and describe what they create, care about, and contribute. It should feel like: "You create experiences that help people find and use their gifts. That is who you are."
3. "supportingLines" — exactly 4 lines: "You feel most alive when…", "You care deeply about…", "People rely on you for…", "You naturally contribute by…" — each completed based on the dots.` :
`Generate a "reflection" — 2-3 sentences that connect the user's recent discoveries and show an emerging pattern. Reference specific dot titles. Be observational ("you seem to", "this suggests") not prescriptive. End with an open observation, not a conclusion.`}

Rules:
- Reference specific dot names from the list
- Sound human, warm, and reflective
- Never use psychological labels
- Keep it personal to this user's story`;

      userPrompt = `The user's discoveries so far:\n${dotSummary}\n\n${isIdentity ? "Generate the Identity Direction moment." : `Generate connection moment #${momentIndex + 1}.`}`;

      const properties: any = {
        reflection: { type: "string", description: "2-3 sentence connection reflection." },
      };
      const required = ["reflection"];

      if (isIdentity) {
        properties.identityStatement = { type: "string", description: "2-3 sentence identity direction statement." };
        properties.supportingLines = { type: "array", items: { type: "string" }, description: "4 supporting lines." };
        required.push("identityStatement", "supportingLines");
      }

      tools = [{
        type: "function",
        function: {
          name: "create_connection_moment",
          description: "Create a connection moment reflection.",
          parameters: { type: "object", properties, required, additionalProperties: false },
        },
      }];
      toolChoice = { type: "function", function: { name: "create_connection_moment" } };
    } else if (mode === "gold_moment") {
      systemPrompt = `You are Atlas. Something interesting is emerging between a frustration and a strength.

Generate a name that captures what might be happening here — a shift, a pattern, a realization.

TONE:
- Use soft, reflective language. This is a discovery, not a declaration.
- Write as if helping someone notice something about themselves.
- Use phrases like: "It seems like...", "You might be noticing...", "Maybe the shift is..."
- The transformation description should feel like a gentle observation, not a command.

RULES:
- The name must be 3-6 words of simple, human language.
- Do NOT invent compound identity names like "The Clarity-through-Complexity Code-Breaker".
- Do NOT use "I Am a..." format.
- Do NOT use words like: Architect, Navigator, Code-Breaker, Alchemist, Weaver, Forge, Catalyst.
- Preferred tone examples: "Turning complexity into clarity", "Making the stuck feel movable", "Finding simplicity in the overwhelming".
- The name should reference both the frustration and the strength.
- The transformation description must be 1 sentence, soft and observational.
- It must feel like recognition, not cleverness.`;

      userPrompt = `Frustration dot: "${dotA?.title}" — ${dotA?.description || ""}
Strength dot: "${dotB?.title}" — ${dotB?.description || ""}

Generate a name that captures what might be emerging from this combination.`;

      tools = [{
        type: "function",
        function: {
          name: "create_gold_moment",
          description: "Create a Gold Moment superpower from frustration→strength transformation.",
          parameters: {
            type: "object",
            properties: {
              superpowerName: { type: "string", description: "3-6 word superpower name. Simple human language, no labels." },
              transformationDescription: { type: "string", description: "One sentence describing the transformation. Simple and human." },
            },
            required: ["superpowerName", "transformationDescription"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "create_gold_moment" } };
    } else if (mode === "growth_reflection") {
      const dotSummary = (recentDots || []).map((d: any) => `- "${d.title}"`).join("\n");
      systemPrompt = `You are Atlas. Generate a brief growth reflection.

RULES:
- Maximum 2 sentences.
- Mention only 1 main pattern, maximum 2 if truly necessary.
- Do NOT stack identity labels.
- Sound reflective, not clinical or robotic.
- Use simple, human language.
- Reference 1-2 specific dot titles by name.
- Never say "You consistently identify as X and Y and Z..."

BAD EXAMPLE: "You consistently identify as A Clarifier and A Pattern Seeker, demonstrating a drive to bring order and understanding to complex situations."

GOOD EXAMPLE: "Something keeps repeating here. You tend to step back, simplify what feels messy, and find the pattern underneath."

TONE: Sound like a thoughtful friend noticing something, not an AI generating a report.`;
      userPrompt = `Recent discoveries:\n${dotSummary}\n\nReflect on what these reveal about the user's journey.`;

      tools = [{
        type: "function",
        function: {
          name: "create_growth_reflection",
          description: "Create a brief growth reflection.",
          parameters: {
            type: "object",
            properties: {
              reflection: { type: "string", description: "1-2 sentence human, reflective observation. Not a report." },
            },
            required: ["reflection"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "create_growth_reflection" } };
    } else {
      throw new Error(`Unknown mode: ${mode}`);
    }

    const callAI = async () => {
      const response = await callChatCompletion({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: toolChoice,
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited, please try again." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Credits needed, please add funds." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) {
        console.warn("No tool call in response — will retry if attempts remain");
        throw new Error("No tool call in response");
      }

      return JSON.parse(toolCall.function.arguments);
    };

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await callAI();
        if (result instanceof Response) return result;
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`generate-atlas-dot attempt ${attempt} failed:`, lastError.message);
        if (attempt < 3) await new Promise(r => setTimeout(r, 800 * attempt));
      }
    }

    throw lastError ?? new Error("All attempts failed");
  } catch (e) {
    console.error("generate-atlas-dot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
