import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Cluster Signal Dictionary — defines what each cluster hunts for and correct/wrong dot examples
const CLUSTER_INTELLIGENCE: Record<string, {
  signal: string;
  correctExamples: string[];
  wrongExamples: string[];
  dotStyle: string;
}> = {
  "Life Events": {
    signal: "Objective facts. A significant moment the user can name and date. A change in location, situation, or circumstance. A beginning or an ending.",
    correctExamples: ["Built First Business in Chile", "Moved to Germany Alone", "Broke My Leg in Australia", "Left Stability to Explore the World"],
    wrongExamples: ["Resilient Navigator (interpretation, not fact)", "Turning Point Experience (too abstract)", "Life Narrator (belongs to identity)"],
    dotStyle: "Name the fact of what happened. No interpretation. 3-6 words.",
  },
  "Natural Talents": {
    signal: "What the user can do effortlessly that others find difficult. Abilities present before training. Something that feels obvious to the user but remarkable to others.",
    correctExamples: ["Understands How Systems Work", "Learns Fast by Doing", "Extracts Skills from Others", "Connects Ideas Across Domains", "Reads a Room Instantly"],
    wrongExamples: ["Smart Thinker (too vague)", "Creative Mind (meaningless without specifics)", "Natural Leader (could apply to anyone)"],
    dotStyle: "Name the specific ability, not a generic label. Reference what the user described.",
  },
  "Childhood Signals": {
    signal: "Early indicators of the user's nature before the world shaped them. What they loved doing as a child without being told to. The emotional environment they grew up in.",
    correctExamples: ["Loved Sport as a Kid", "Learned Through Action Not Books", "Grew Up Feeling Loved and Supported", "High Energy from the Start", "Always Asked Why"],
    wrongExamples: ["Active Child (too generic)", "Curious Kid (meaningless without context)", "Energetic Personality (not a signal)"],
    dotStyle: "Name the childhood signal specifically. Reference the activity or environment.",
  },
  "Passions": {
    signal: "What the user loves doing, not what they are good at. Things they return to naturally across contexts. An activity that produces flow or joy.",
    correctExamples: ["Love Creating Experiences", "Passion for Connecting People", "Driven by Curiosity", "Loves Exploring Ideas", "Enjoys Learning Everything"],
    wrongExamples: ["Explorer Mindset (cognitive style, not passion)", "Growth Seeker (too abstract)", "Inspired Creator (vague and generic)"],
    dotStyle: "Name the passion using active language. Start with a verb or feeling.",
  },
  "Values": {
    signal: "What matters deeply to the user regardless of circumstance. Principles that guide decisions without thinking. Something the user would not compromise even under pressure.",
    correctExamples: ["Family First", "Connection Over Everything", "Driven to Contribute", "Acts with Honesty", "Believes in Growth"],
    wrongExamples: ["Integrity (too abstract without context)", "Good Values (meaningless)", "Strong Principles (not personal enough)"],
    dotStyle: "Name the specific value and how it shows up. Make it personal.",
  },
  "Skills": {
    signal: "What the user has built the ability to do through practice, experience, and repetition. A capability tied to specific experiences.",
    correctExamples: ["Turns Ideas into Reality", "Connects People Naturally", "Understands Business from the Inside", "Designs Systems That Work", "Sells Through Story"],
    wrongExamples: ["Smart (not a skill)", "Good Communicator (needs more specificity)", "Creative (passion, not skill)"],
    dotStyle: "Name the specific skill, not a trait. Reference what they do, not who they are.",
  },
  "Experiments": {
    signal: "Things the user actively tried or built. Two layers: the fact of what was tried AND the meaning of what was learned.",
    correctExamples: ["Built E-commerce Business from Scratch", "Organized Festival Experience", "Left Stability to Start Over", "Learned to Shift the Energy of a Room"],
    wrongExamples: ["Tried Things (too vague)", "Risk Taker (interpretation, not fact)", "Adventurous Spirit (label, not discovery)"],
    dotStyle: "Name the experiment specifically. If possible, include both what was done and what was learned.",
  },
  "Aha Moments": {
    signal: "Specific moments of realization that changed direction or perception. Not general insights — specific moments that can be named and located in time.",
    correctExamples: ["Stopped Judging by Appearance in Berlin", "Forced Pause Led to Creating Family Squad", "Realized AI Could Simulate Mentorship", "Understood That Energy Can Be Designed"],
    wrongExamples: ["Confidence Boost (not a moment)", "Self-Discovery (too abstract)", "Changed Perspective (too generic)"],
    dotStyle: "Name the specific realization and where/when it happened if possible.",
  },
  "Personal Frustrations": {
    signal: "What frustrates the user points to what matters most. The problem that keeps showing up. The gap between how things are and how they should be.",
    correctExamples: ["Hates Wasted Potential", "Frustrated by Broken Systems", "Can't Stand Superficial Connection", "Impatient with Slow Progress"],
    wrongExamples: ["Anger Issues (clinical label)", "Frustrated Person (too generic)", "Intensity (not specific)"],
    dotStyle: "Name the frustration specifically. Use the user's own words about what bothers them.",
  },
  "Inspirations": {
    signal: "Who and what inspires the user. A compliment or observation that surprised them. The qualities in others that move them most.",
    correctExamples: ["Inspired by Quiet Courage", "Moves Me When Someone Is Authentic", "Drawn to People Who Build from Nothing", "Art That Tells the Truth"],
    wrongExamples: ["Inspired Person (meaningless)", "Seeker (too vague)", "Deep Thinker (generic)"],
    dotStyle: "Name what specifically inspires them. Reference the quality, person, or moment.",
  },
  "Vision for a Better World": {
    signal: "What the user wants to change in the world. The cause that pulls at their heart. What they would fight for.",
    correctExamples: ["Everyone Deserves a Mentor", "Families Should Be Stronger", "Creative Education for All", "Mental Health Should Be Normal"],
    wrongExamples: ["World Changer (too vague)", "Visionary (label, not vision)", "Good Person (meaningless)"],
    dotStyle: "Name the specific vision or change they want to see. Use their own words.",
  },
  "Ideal Life": {
    signal: "What the user's ideal day, environment, and relationships look like. The concrete elements of the life they want to build.",
    correctExamples: ["Morning Creative Time by the Ocean", "Small Circle of Deep Thinkers", "Freedom to Work from Anywhere", "Seasonal Rhythm of Work and Rest"],
    wrongExamples: ["Happy Life (meaningless)", "Balance (too abstract)", "Success (not specific)"],
    dotStyle: "Name the specific element of their ideal life. Be concrete about place, time, or activity.",
  },
  "External Reflections": {
    signal: "What others have told the user about themselves. How others see the user. Feedback that surprised them or that they keep hearing.",
    correctExamples: ["Others See Me as a Leader", "People Trust Me Naturally", "Recognized as Creative", "Known for Bringing People Together"],
    wrongExamples: ["Wisdom Seeker (internal, not external)", "Confidence (not a reflection from others)", "Strong Person (too vague)"],
    dotStyle: "Name what others see. Start with 'Others say...' or 'Known for...' style.",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { responses, clusterName, patternTitle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const allResponses = responses.map((r: any, i: number) => {
      if (typeof r === "string") return `Response ${i + 1}: "${r}"`;
      if (Array.isArray(r)) return `Response ${i + 1}: ${r.join(", ")}`;
      if (typeof r === "number") return `Response ${i + 1}: option ${r}`;
      if (typeof r === "object" && r !== null) {
        if (r.then && r.now) return `Response ${i + 1}: Then: "${r.then}" / Now: "${r.now}"`;
        return `Response ${i + 1}: ${JSON.stringify(r)}`;
      }
      return `Response ${i + 1}: ${JSON.stringify(r)}`;
    }).join("\n");

    // Find the richest text response (last one is usually open-ended)
    const lastResponse = responses[3];
    const reflectionText = typeof lastResponse === "string" ? lastResponse :
      (lastResponse?.then && lastResponse?.now) ? `Then: ${lastResponse.then}. Now: ${lastResponse.now}` : "";

    // Get cluster intelligence
    const clusterIntel = CLUSTER_INTELLIGENCE[clusterName] || null;
    const clusterContext = clusterIntel ? `
CLUSTER: "${clusterName}"
SIGNAL THIS CLUSTER HUNTS FOR: ${clusterIntel.signal}
DOT NAMING STYLE: ${clusterIntel.dotStyle}

CORRECT DOT EXAMPLES for this cluster:
${clusterIntel.correctExamples.map(e => `- "${e}"`).join("\n")}

WRONG DOT EXAMPLES (NEVER generate dots like these):
${clusterIntel.wrongExamples.map(e => `- ${e}`).join("\n")}
` : `CLUSTER: "${clusterName}"`;

    const systemPrompt = `You are Atlas, a personal discovery mirror. You help people see patterns in their life by reflecting their own words back to them.

Your job: Generate a dot title and description from the user's answers, especially their final open reflection.

${clusterContext}

CRITICAL RULES FOR TITLE:
- 3-6 words. Must feel like something the user would say about themselves.
- Must echo the user's own language — extract key words from their answer.
- Must be specific enough that the user recognizes their own life in it.
- If the dot could apply to anyone, it is WRONG. Regenerate.
- Use simple, concrete language. No psychological labels. No poetic abstractions.
- The test: would the user want to show this dot to someone who knows them?

CRITICAL RULES FOR DESCRIPTION:
- 1-2 sentences maximum.
- MUST reference something specific the user actually said.
- Sound like a friend reflecting back, not an AI analyzing.
- Never use generic phrases like "Discovered through Atlas quest exploration."
- Good: "You mentioned leaving your business to travel — that tells me you trust yourself enough to choose the unknown."
- Bad: "You show curiosity and independence."

PRIMARY SIGNAL RULE:
- The open reflection answer (Response 4) is the PRIMARY input for the dot title.
- Responses 1-3 tell you which cluster the dot belongs to.
- Response 4 tells you what to call it and how to describe it.
- If you cannot generate a meaningful dot from the answer, use the next most specific response.

LANGUAGE ECHO RULE:
- Extract the user's own key words, phrases, or emotional signals.
- Use those words in the dot title.

${patternTitle ? `A pattern "${patternTitle}" was detected across multiple quests. Use this as context but personalize using the user's specific answers.` : ""}`;

    const userPrompt = `Here are the user's quest responses:\n\n${allResponses}\n\nThe most important response is the final one:\n"${reflectionText}"\n\nGenerate a personalized dot that echoes their own words.`;

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
        tools: [{
          type: "function",
          function: {
            name: "create_atlas_dot",
            description: "Create a personalized Atlas dot from the user's discovery responses.",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "A 3-6 word identity phrase echoing the user's own language. Specific, concrete, personal." },
                description: { type: "string", description: "1-2 sentences referencing the user's specific answers. Conversational tone." },
                dotCategory: { type: "string", enum: ["strength", "shadow", "life_imprint"] },
              },
              required: ["title", "description", "dotCategory"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_atlas_dot" } },
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
