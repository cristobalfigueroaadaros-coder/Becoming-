import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CLUSTER_INTELLIGENCE: Record<string, {
  signal: string;
  correctExamples: string[];
  wrongExamples: string[];
  dotStyle: string;
}> = {
  "Life Events": {
    signal: "Objective facts. A significant moment the user can name and date.",
    correctExamples: ["Built First Business in Chile", "Moved to Germany Alone", "Left Stability to Explore the World"],
    wrongExamples: ["Resilient Navigator (interpretation)", "Turning Point Experience (too abstract)"],
    dotStyle: "Name the fact of what happened. No interpretation. 3-6 words.",
  },
  "Natural Talents": {
    signal: "What the user can do effortlessly that others find difficult.",
    correctExamples: ["Understands How Systems Work", "Learns Fast by Doing", "Reads a Room Instantly"],
    wrongExamples: ["Smart Thinker (too vague)", "Natural Leader (generic)"],
    dotStyle: "Name the specific ability, not a generic label.",
  },
  "Childhood Signals": {
    signal: "Early indicators of the user's nature before the world shaped them.",
    correctExamples: ["Loved Sport as a Kid", "Always Asked Why", "Grew Up Feeling Loved"],
    wrongExamples: ["Active Child (too generic)", "Curious Kid (meaningless)"],
    dotStyle: "Name the childhood signal specifically.",
  },
  "Passions": {
    signal: "What the user loves doing, not what they are good at.",
    correctExamples: ["Love Creating Experiences", "Driven by Curiosity", "Enjoys Learning Everything"],
    wrongExamples: ["Explorer Mindset (cognitive style)", "Growth Seeker (too abstract)"],
    dotStyle: "Name the passion using active language.",
  },
  "Values": {
    signal: "What matters deeply to the user regardless of circumstance.",
    correctExamples: ["Family First", "Connection Over Everything", "Acts with Honesty"],
    wrongExamples: ["Integrity (too abstract)", "Strong Principles (not personal)"],
    dotStyle: "Name the specific value and how it shows up.",
  },
  "Skills": {
    signal: "What the user has built through practice and experience.",
    correctExamples: ["Turns Ideas into Reality", "Connects People Naturally", "Sells Through Story"],
    wrongExamples: ["Smart (not a skill)", "Creative (passion, not skill)"],
    dotStyle: "Name the specific skill, not a trait.",
  },
  "Experiments": {
    signal: "Things the user actively tried or built.",
    correctExamples: ["Built E-commerce from Scratch", "Left Stability to Start Over"],
    wrongExamples: ["Tried Things (too vague)", "Risk Taker (interpretation)"],
    dotStyle: "Name the experiment specifically.",
  },
  "Aha Moments": {
    signal: "Specific moments of realization that changed direction.",
    correctExamples: ["Stopped Judging by Appearance in Berlin", "Realized AI Could Simulate Mentorship"],
    wrongExamples: ["Confidence Boost (not a moment)", "Changed Perspective (too generic)"],
    dotStyle: "Name the specific realization.",
  },
  "Personal Frustrations": {
    signal: "What frustrates the user points to what matters most.",
    correctExamples: ["Hates Wasted Potential", "Can't Stand Superficial Connection"],
    wrongExamples: ["Anger Issues (clinical label)", "Frustrated Person (too generic)"],
    dotStyle: "Name the frustration specifically. Use the user's own words.",
  },
  "Inspirations": {
    signal: "Who and what inspires the user.",
    correctExamples: ["Inspired by Quiet Courage", "Drawn to People Who Build from Nothing"],
    wrongExamples: ["Inspired Person (meaningless)", "Deep Thinker (generic)"],
    dotStyle: "Name what specifically inspires them.",
  },
  "Vision for a Better World": {
    signal: "What the user wants to change in the world.",
    correctExamples: ["Everyone Deserves a Mentor", "Creative Education for All"],
    wrongExamples: ["World Changer (too vague)", "Visionary (label)"],
    dotStyle: "Name the specific vision or change.",
  },
  "Ideal Life": {
    signal: "What the user's ideal day, environment, and relationships look like.",
    correctExamples: ["Morning Creative Time by the Ocean", "Freedom to Work from Anywhere"],
    wrongExamples: ["Happy Life (meaningless)", "Balance (too abstract)"],
    dotStyle: "Name the specific element of their ideal life.",
  },
  "External Reflections": {
    signal: "What others have told the user about themselves.",
    correctExamples: ["Others See Me as a Leader", "Known for Bringing People Together"],
    wrongExamples: ["Wisdom Seeker (internal)", "Strong Person (too vague)"],
    dotStyle: "Name what others see.",
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { mode = "generate", responses, clusterName, patternTitle, feedbackText, dotA, dotB, recentDots, existingDots } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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

${BASE_RULES}

MIRROR FEEDBACK RULE:
- Also generate a single observational sentence (mirrorFeedback) that reflects what this discovery reveals about the user.
- Use "you often", "this suggests", "it seems like" — never "you are".
- Example: "This shows that connection matters deeply to you."

${patternTitle ? `A pattern "${patternTitle}" was detected. Use as context but personalize from the user's answers.` : ""}
${mode === "regenerate" && feedbackText ? `The user said the previous result didn't feel right. They said: "${feedbackText}". Generate 3 alternative variations that better match their intent.` : ""}`;

      userPrompt = `Here are the user's quest responses:\n\n${allResponses}\n\nThe most important response is the final one:\n"${reflectionText}"\n\nGenerate a personalized dot that echoes their own words.`;

      if (mode === "regenerate") {
        tools = [{
          type: "function",
          function: {
            name: "create_atlas_dot_variations",
            description: "Create 3 alternative dot variations.",
            parameters: {
              type: "object",
              properties: {
                variations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      dotCategory: { type: "string", enum: ["strength", "shadow", "life_imprint"] },
                    },
                    required: ["title", "description", "dotCategory"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["variations"],
              additionalProperties: false,
            },
          },
        }];
        toolChoice = { type: "function", function: { name: "create_atlas_dot_variations" } };
      } else {
        tools = [{
          type: "function",
          function: {
            name: "create_atlas_dot",
            description: "Create a personalized Atlas dot from the user's discovery responses.",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "A 3-6 word identity phrase echoing the user's own language." },
                description: { type: "string", description: "1-2 sentences referencing the user's specific answers." },
                dotCategory: { type: "string", enum: ["strength", "shadow", "life_imprint"] },
                mirrorFeedback: { type: "string", description: "A single observational sentence reflecting what this dot reveals about the user." },
              },
              required: ["title", "description", "dotCategory", "mirrorFeedback"],
              additionalProperties: false,
            },
          },
        }];
        toolChoice = { type: "function", function: { name: "create_atlas_dot" } };
      }
    } else if (mode === "gold_moment") {
      systemPrompt = `You are Atlas. A user has transformed a frustration into a strength — this is a Gold Moment. Generate a superpower name (3-6 words) that captures this transformation. It must feel earned, not assigned. Use the user's own language.

Rules:
- The superpower name must reference both the frustration and the strength.
- It must sound like something the user would proudly claim.
- Generate a one-line description of the transformation.`;

      userPrompt = `Frustration dot: "${dotA?.title}" — ${dotA?.description || ""}
Strength dot: "${dotB?.title}" — ${dotB?.description || ""}

Generate a superpower name that captures this transformation.`;

      tools = [{
        type: "function",
        function: {
          name: "create_gold_moment",
          description: "Create a Gold Moment superpower from frustration→strength transformation.",
          parameters: {
            type: "object",
            properties: {
              superpowerName: { type: "string", description: "3-6 word superpower name." },
              transformationDescription: { type: "string", description: "One sentence describing the transformation." },
            },
            required: ["superpowerName", "transformationDescription"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "create_gold_moment" } };
    } else if (mode === "growth_reflection") {
      const dotSummary = (recentDots || []).map((d: any) => `- "${d.title}"`).join("\n");
      systemPrompt = `You are Atlas. Generate a brief growth reflection (2-3 sentences max) that observes what the user's recent discoveries reveal. Be observational, not prescriptive. Use "you seem to", "it looks like", never "you are". Reference specific dot titles.`;
      userPrompt = `Recent discoveries:\n${dotSummary}\n\nReflect on what these reveal about the user's journey.`;

      tools = [{
        type: "function",
        function: {
          name: "create_growth_reflection",
          description: "Create a brief growth reflection.",
          parameters: {
            type: "object",
            properties: {
              reflection: { type: "string", description: "2-3 sentence observational reflection." },
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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: toolChoice,
      }),
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
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-atlas-dot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
