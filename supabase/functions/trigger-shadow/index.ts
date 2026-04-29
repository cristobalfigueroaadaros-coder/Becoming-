import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShadowEncounterTemplate {
  shadowName: string;
  statement: string;
  prompts: string[];
  task: string;
  mentorType?: string;
  xpReward: number;
  integrationLine: string;
}

const shadowTemplates: Record<string, ShadowEncounterTemplate> = {
  fear: {
    shadowName: "Fear",
    statement: "You've been rehearsing your launch for months. But we both know you're not refining — you're hiding. You'd rather stay 'potential' than risk being proven ordinary.",
    prompts: [
      "What would you attempt if no one was watching or keeping score?",
      "Who are you really protecting by staying small — them, or yourself?"
    ],
    task: "Record a 60-second voice note explaining your business idea as if you're telling your future self 5 years from now. No editing. Raw truth only.",
    mentorType: "Mamba Mentor",
    xpReward: 50,
    integrationLine: "I no longer confuse preparation with protection. My work deserves to be seen."
  },
  procrastination: {
    shadowName: "Procrastination",
    statement: "You say you'll do it tomorrow. You've said that for weeks now. The truth? You're waiting for permission that will never come.",
    prompts: [
      "What are you actually avoiding when you delay this task?",
      "If you never got to do this, what would you regret not trying?"
    ],
    task: "Set a timer for 15 minutes and start the thing you've been avoiding. Don't finish it. Just start.",
    mentorType: "Strategist Mentor",
    xpReward: 40,
    integrationLine: "Action creates clarity. I don't need perfect conditions — I need momentum."
  },
  impostor: {
    shadowName: "Impostor",
    statement: "They'll find out you don't belong. That you're faking it. That you got lucky. Deep down, you believe them when they praise you — but only when they don't.",
    prompts: [
      "What evidence do you have that you actually earned your achievements?",
      "Whose voice tells you you're not enough — and why did you believe them?"
    ],
    task: "Write down 3 achievements you're proud of. Then record yourself reading them aloud as if you're introducing a respected colleague.",
    mentorType: "Heart Mentor",
    xpReward: 60,
    integrationLine: "My worth isn't measured by others' belief in me. I belong where I choose to show up."
  },
  perfectionism: {
    shadowName: "Perfectionism",
    statement: "You obsess over details no one will notice. You rewrite what's already good. You know why? Because 'perfect' is safer than 'done and visible.'",
    prompts: [
      "What would 'good enough' look like if you were being honest?",
      "What's the cost of never shipping your work?"
    ],
    task: "Publish or share something imperfect today. A draft post, a rough idea, a half-finished project. Let it breathe.",
    mentorType: "Creator Mentor",
    xpReward: 50,
    integrationLine: "Done is better than perfect. My work is meant to evolve in the world, not in my head."
  },
  shame: {
    shadowName: "Shame",
    statement: "You carry a story about who you used to be, what you did, what was done to you. It whispers: 'You're damaged. You're too much. You're not enough.'",
    prompts: [
      "If you could forgive one version of yourself, which one would it be?",
      "What would change if you stopped apologizing for existing?"
    ],
    task: "Write a letter to your younger self. Tell them what they needed to hear back then. Read it aloud to yourself.",
    mentorType: "Compassionate Elder",
    xpReward: 70,
    integrationLine: "My past does not define my worth. I release what no longer serves who I'm becoming."
  },
  anger: {
    shadowName: "Anger",
    statement: "You smile when you're seething. You nod when you want to scream. All that rage you're swallowing? It's corroding you from the inside.",
    prompts: [
      "What would you say if you weren't afraid of the consequences?",
      "Who or what are you really angry at — and what are you protecting by staying silent?"
    ],
    task: "Write an unsent letter to whoever or whatever you're angry at. Let it be raw, unfiltered, honest. Then decide what to do with it.",
    mentorType: "Mamba Mentor",
    xpReward: 60,
    integrationLine: "My anger is information. I can acknowledge it without being consumed by it."
  },
  control: {
    shadowName: "Control",
    statement: "You need to know the outcome before you begin. You micromanage every detail. But the tighter you grip, the less you actually hold.",
    prompts: [
      "What are you afraid will happen if you let go?",
      "What would change if you trusted the process more than the plan?"
    ],
    task: "Identify one thing you've been trying to control. For the next 24 hours, practice letting it unfold without your intervention.",
    mentorType: "Ancient Sage",
    xpReward: 50,
    integrationLine: "True power comes from flexibility, not force. I trust the flow of life."
  },
  isolation: {
    shadowName: "Isolation",
    statement: "You tell yourself you're better off alone. That no one would understand anyway. But isolation isn't protection — it's a prison you've built for yourself.",
    prompts: [
      "What are you protecting yourself from by staying distant?",
      "Who would you reach out to if you weren't afraid of being a burden?"
    ],
    task: "Send a genuine, vulnerable message to one person you've been avoiding. No agenda, just connection.",
    mentorType: "Heart Mentor",
    xpReward: 65,
    integrationLine: "Connection requires courage, not perfection. I am worthy of belonging."
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { shadowType, triggeredBy, context } = await req.json();

    const template = shadowTemplates[shadowType.toLowerCase()];
    if (!template) {
      throw new Error("Unknown shadow type");
    }

    // Check if user already has an active encounter
    const { data: existingEncounter } = await supabase
      .from("shadow_encounters")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (existingEncounter) {
      return new Response(
        JSON.stringify({ message: "Active encounter already exists" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create shadow encounter
    const { data: encounter, error: encounterError } = await supabase
      .from("shadow_encounters")
      .insert({
        user_id: user.id,
        shadow_name: template.shadowName,
        shadow_statement: template.statement,
        reflection_prompts: template.prompts,
        task_description: template.task,
        mentor_type: template.mentorType,
        xp_reward: template.xpReward,
        triggered_by: triggeredBy || "manual",
        triggered_context: context || {},
      })
      .select()
      .single();

    if (encounterError) throw encounterError;

    console.log(`Shadow encounter created: ${encounter.id} for user ${user.id}`);

    return new Response(
      JSON.stringify({ encounter, integrationLine: template.integrationLine }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in trigger-shadow:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
