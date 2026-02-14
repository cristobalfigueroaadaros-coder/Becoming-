import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const {
      data: { user },
    } = await anonClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { patternId, patternName, transmutationData, primaryEmotion } =
      await req.json();

    if (!patternId || !transmutationData) {
      return new Response(
        JSON.stringify({ error: "Missing patternId or transmutationData" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const apiKey = Deno.env.get("chatgpt");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are an identity evolution analyst. After a completed transmutation journey, extract 1-4 Superpowers — stable identity traits developed through adversity.

A Superpower follows the logic: Event → Adaptation → Trait
Example: Business collapse → Refocused on money generation → Revenue-Focused Strategist

A Superpower is NOT: a lesson, a reflection, a sentence, therapy phrasing, or a vague improvement.

## The 5 Superpower Categories

1. **Emotional Mastery** — How the user now relates to emotions.
   Examples: Emotionally Regulated, Self-Compassionate, Boundary-Aware, Calm Communicator

2. **Psychological Strength** — Internal stability under pressure.
   Examples: Resilient, Grounded, Adaptive, Fear-Conscious, Self-Reliant

3. **Cognitive Strength** — How they think differently now.
   Examples: Strategic Thinker, Pattern Recognizer, Long-Term Oriented, Systems Thinker

4. **Behavioral Strength** — How they act differently.
   Examples: Courageous Initiator, Disciplined Builder, Action-Oriented, Boundary Setter

5. **Identity Upgrade** — Who they became.
   Examples: Self-Trusting Leader, Independent Provider, Purpose-Driven Builder

## Transmutation Data

Pattern: "${patternName || "Unknown"}"
Primary Emotion: "${primaryEmotion || "Unknown"}"
Shadow/Pain: "${transmutationData.shadow || ""}"
The Shift: "${transmutationData.shift_moment || ""}"
Lesson Learned: "${transmutationData.lesson_learned || ""}"
Protective Purpose: "${transmutationData.protective_purpose || ""}"
Gold Insight: "${transmutationData.gold_insight || ""}"
Brave Step: "${transmutationData.brave_step || ""}"

## Extraction Rules

- Extract 1 to 4 superpowers maximum
- Maximum 1 per category
- Only extract if clearly derived from this specific journey
- No duplicates
- Each name must be 1-3 CAPITALIZED words — like a medal title
- No punctuation, no full sentences
- Include an emoji icon for each
- Include a one-sentence description tied to the specific event

## Format

Respond ONLY with a JSON array:
[{"name": "Superpower Name", "category": "Emotional Mastery", "description": "One sentence about how this was gained from this event", "icon": "🔥", "color": "amber"}]

Use these color mappings:
- Emotional Mastery → rose
- Psychological Strength → emerald
- Cognitive Strength → blue
- Behavioral Strength → violet
- Identity Upgrade → amber`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";

    let superpowers: Array<{
      name: string;
      category: string;
      description: string;
      icon: string;
      color: string;
    }> = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        superpowers = JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.error("Failed to parse superpowers:", content);
      superpowers = [
        {
          name: "Inner Warrior",
          category: "Psychological Strength",
          description: "Gained strength through adversity",
          icon: "⚔️",
          color: "amber",
        },
      ];
    }

    // Limit to 4 and enforce max 1 per category
    const seenCategories = new Set<string>();
    const filtered: typeof superpowers = [];
    for (const sp of superpowers) {
      if (filtered.length >= 4) break;
      const cat = sp.category || "Identity Upgrade";
      if (seenCategories.has(cat)) continue;
      seenCategories.add(cat);
      filtered.push(sp);
    }
    superpowers = filtered;

    // Store in database
    const insertData = superpowers.map((sp) => ({
      user_id: user.id,
      pattern_id: patternId,
      name: sp.name,
      description: sp.description,
      icon: sp.icon || "⚡",
      color: sp.color || "amber",
      category: sp.category || "Identity Upgrade",
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("superpowers")
      .insert(insertData)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save superpowers" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ superpowers: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
