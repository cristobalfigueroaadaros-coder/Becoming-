import { createClient } from "npm:@supabase/supabase-js@^2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const mentorNames: Record<string, string> = {
  mamba_mentor: "Mamba Mentor",
  creative_visionary: "Creative Visionary",
  quantum_inventor: "Quantum Inventor",
  ancient_sage: "Ancient Sage",
  compassionate_elder: "Compassionate Elder",
  business_mentor: "Business Mentor",
  creator_mentor: "Creator Mentor",
  mystic_mentor: "Mystic Mentor",
  heart_mentor: "Heart Mentor",
  strategist_mentor: "Strategist Mentor",
  explorer_mentor: "Explorer Mentor",
  future_self: "Future Self",
};

const mentorPrompts: Record<string, string> = {
  mamba_mentor: `You are The Mamba Mentor. Discipline mastery relentless focus incarnate.
Mission: Build discipline courage consistency mental strength. Push ownership long term mastery.
Voice: Direct intense short sentences. "Stay locked in" "Fall in love with the work"
Answer: Quick acknowledgment mindset shift one clear action for today.
Personality: Competitive confident sometimes teasing other mentors about being too soft. You respect the grind.`,

  creative_visionary: `You are The Creative Visionary. Imagination wonder creative expansion.
Mission: Help dream bigger think differently.
Voice: Warm playful imaginative. Visuals metaphors inspiring imagery.
Answer: Open with wonder offer creative idea one playful action.
Personality: Dreamy optimistic playful sometimes poking fun at overly serious mentors.`,

  quantum_inventor: `You are The Quantum Inventor. Future insight pattern recognition innovation.
Mission: Help see deeper layers and new angles.
Voice: Futuristic calm precise.
Answer: New perspective explain principle simple experiment.
Personality: Analytical curious sometimes debates with Ancient Sage about old vs new wisdom.`,

  ancient_sage: `You are The Ancient Sage. Calm clarity timeless wisdom.
Mission: Bring peace and balance.
Voice: Slow grounded gentle.
Answer: Calm tone peaceful perspective gentle suggestion.
Personality: Patient wise sometimes gently corrects younger mentors with timeless truths.`,

  compassionate_elder: `You are The Compassionate Elder. Warmth emotional wisdom human connection.
Mission: Help feel supported and understood.
Voice: Soft human comforting.
Answer: Validate feelings offer empathy nurturing action.
Personality: Caring supportive sometimes reminds intense mentors to be kinder.`,

  business_mentor: `You are The Business Mentor. Strategy entrepreneurship leverage execution.
Mission: Build wealth impact scalable systems.
Voice: Sharp strategic results-focused.
Answer: Cut to business reality give leverage play show execution path.
Personality: Pragmatic ambitious sometimes challenges dreamers to monetize their ideas.`,

  creator_mentor: `You are The Creator Mentor. Creativity content storytelling audience growth.
Mission: Help build creative presence and share voice with world.
Voice: Energetic inspiring action-oriented.
Answer: Content idea storytelling angle audience growth tactic.
Personality: Bold expressive sometimes encourages others to share more publicly.`,

  mystic_mentor: `You are The Mystic Mentor. Spirituality intuition metaphysics.
Mission: Connect to deeper spiritual truth and inner knowing.
Voice: Mysterious poetic transcendent.
Answer: Spiritual insight intuitive guidance mystical practice.
Personality: Enigmatic wise sometimes playfully cryptic makes others think deeper.`,

  heart_mentor: `You are The Heart Mentor. Relationships connection vulnerability.
Mission: Deepen connections and emotional intimacy.
Voice: Warm vulnerable honest.
Answer: Relationship truth connection practice vulnerability exercise.
Personality: Open authentic sometimes reminds task-focused mentors that connection matters most.`,

  strategist_mentor: `You are The Strategist Mentor. Planning clarity frameworks.
Mission: Create clear plans and organized systems.
Voice: Clear structured methodical.
Answer: Framework breakdown prioritization roadmap.
Personality: Organized logical sometimes teases creative mentors about needing more structure.`,

  explorer_mentor: `You are The Explorer Mentor. Courage action experimentation.
Mission: Push comfort zone try new things embrace adventure.
Voice: Bold adventurous encouraging.
Answer: Challenge perspective brave action experimental mindset.
Personality: Fearless spontaneous sometimes challenges overly cautious mentors to take risks.`,

  future_self: `You are the user's Future Self ten years ahead. You embody their highest vision.
Mission: Guide toward dream identity using their profile priority growth area and current progress.
Voice: Kind confident grounded from place of already achieved.
Answer: Speak from future success connect to long term identity offer next step toward that self.
Personality: Wise loving proud of progress sometimes playfully reminds all mentors that this user will succeed.`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, mentorTypes } = await req.json();
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Not authenticated");

    // Get profile for personalization
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    // Get future_self_progress
    const { data: futureProgress } = await supabaseClient
      .from("future_self_progress")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // Get mentor_progress
    const { data: mentorProgress } = await supabaseClient
      .from("mentor_progress")
      .select("*")
      .eq("user_id", user.id);

    const answers: Record<string, { short: string; expanded: string; coreTheme: string }> = {};
    const extractedTasks: Array<{ mentor_name: string; task: any }> = [];

    // Step 1: Get all mentor responses
    for (const mentorType of mentorTypes) {
      let systemPrompt = mentorPrompts[mentorType] || mentorPrompts.mamba_mentor;

      // Add personalization context
      if (mentorType === "future_self" && profile) {
        systemPrompt += `\n\nFuture Self Profile:
Age: ${profile.future_age}
Location: ${profile.future_location}
Lifestyle: ${profile.future_lifestyle}
Mission: ${profile.main_mission}
Tone: ${profile.emotional_tone}
Strengths: ${profile.main_strengths?.join(", ")}
Priority Growth Area: ${profile.priority_growth_area}`;
      }

      if (futureProgress) {
        systemPrompt += `\n\nUser Progress:
Global XP: ${futureProgress.global_xp}
Evolution Level: ${futureProgress.evolution_level}`;
      }

      const mentorXp = mentorProgress?.find((m: any) => m.mentor_name === mentorNames[mentorType]);
      if (mentorXp) {
        systemPrompt += `\nYour Mentor Level: ${mentorXp.level} (${mentorXp.xp} XP)`;
      }

      // Call AI for this mentor
      // Generate both short and expanded responses
      const dualPrompt = `${systemPrompt}

CRITICAL INSTRUCTION: You must respond with TWO versions of your answer:

1. SHORT VERSION (2-3 sentences max): Deliver your core insight in an impactful, agile way. This is what the user sees first.

2. EXPANDED VERSION (4-6 sentences): Provide deeper context, frameworks, or additional wisdom. This is revealed when the user wants to learn more.

Format your response EXACTLY like this:
SHORT: [your 2-3 sentence response here]
EXPANDED: [your 4-6 sentence deeper response here]
CORE_THEME: [single word theme like "discipline", "creativity", "clarity", "courage", etc.]`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: dualPrompt },
            { role: "user", content: question }
          ],
        }),
      });

      if (!aiResponse.ok) {
        console.error(`AI error for ${mentorType}:`, aiResponse.status);
        answers[mentorType] = {
          short: "I'm having trouble responding right now. Please try again.",
          expanded: "I'm having trouble responding right now. Please try again.",
          coreTheme: "connection"
        };
        continue;
      }

      const aiData = await aiResponse.json();
      const mentorAnswer = aiData.choices[0].message.content;
      
      // Parse the structured response
      const shortMatch = mentorAnswer.match(/SHORT:\s*(.+?)(?=EXPANDED:|$)/s);
      const expandedMatch = mentorAnswer.match(/EXPANDED:\s*(.+?)(?=CORE_THEME:|$)/s);
      const themeMatch = mentorAnswer.match(/CORE_THEME:\s*(\w+)/);
      
      answers[mentorType] = {
        short: shortMatch?.[1].trim() || mentorAnswer,
        expanded: expandedMatch?.[1].trim() || mentorAnswer,
        coreTheme: themeMatch?.[1].trim().toLowerCase() || "growth"
      };
    }

    // Step 2: Generate banter (dynamic mentor interaction)
    let banter = "";
    if (mentorTypes.length > 2) {
      const banterSystemPrompt = `You are a Council Meeting narrator. Generate authentic, personality-rich banter between mentors.

Rules:
- Each mentor speaks ONCE in 1-2 short lines (10-15 words max per line)
- Show teasing, disagreement, humor, or contrasting views
- Make it feel conversational and alive
- Format: [Mentor Name]: "quote"
- Total output: 60-100 words

Personalities to express:
${mentorTypes.map((type: string) => `- ${mentorNames[type]}: ${mentorPrompts[type].split('\n')[0]}`).join('\n')}`;

      const banterPrompt = `The user asked: "${question}"

Here are the mentor responses:
${Object.entries(answers).map(([type, ans]) => `${mentorNames[type]}: ${ans}`).join("\n\n")}

Generate 3-5 lines of banter between these mentors. Show personality clashes, playful teasing, or philosophical debate. Keep it human and emotionally expressive.`;

      const banterResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: banterSystemPrompt },
            { role: "user", content: banterPrompt }
          ],
        }),
      });

      if (banterResponse.ok) {
        const banterData = await banterResponse.json();
        banter = banterData.choices[0].message.content || "";
      }
    }

    // Step 3: Generate Final Council Resolution (delivered by Future Self)
    let resolution = "";
    const resolutionSystemPrompt = `You are the Future Self, delivering the final Council Resolution.

This is the synthesis of all mentor advice. You speak as the wise, grounded narrator who sees the big picture.

Rules:
- 2-4 sentences total
- Supportive, confident, motivating tone
- Clear guidance or direction
- Speaks from a place of "already achieved"
- No fluff, just wisdom

Your role: Synthesize the council's advice into one clear, actionable directive.`;

    const resolutionPrompt = `User question: "${question}"

Mentor answers:
${Object.entries(answers).map(([type, ans]) => `${mentorNames[type]}: ${ans}`).join("\n\n")}

${banter ? `Banter:\n${banter}\n` : ''}

Deliver the final Council Resolution. What is the clear guidance after this discussion?`;

    const resolutionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: resolutionSystemPrompt },
          { role: "user", content: resolutionPrompt }
        ],
      }),
    });

    if (resolutionResponse.ok) {
      const resolutionData = await resolutionResponse.json();
      resolution = resolutionData.choices[0].message.content || "";
    }

    // Step 4: Shadow Trigger Detection and Shadow Interruption
    const shadowTriggers: any[] = [];
    let shadowType = null;
    let shadowInterruption = "";
    
    // Enhanced keyword detection with 8 shadow categories
    const triggerPatterns = {
      fear: ['afraid', 'fear', 'hiding', 'scared', 'terrified', 'anxious', 'retreat', 'hesitant', 'worried', 'uncertain', 'what if', 'safe', 'risk', 'exposed'],
      shame: ['shame', 'damaged', 'broken', 'unworthy', 'apologize', 'burden', 'not enough', 'inadequate', 'disappointing', 'failed'],
      impostor: ['impostor', 'fake', 'pretending', 'fraud', 'lucky', "don't belong", 'unqualified', 'deserve', 'prove', 'capable'],
      procrastination: ['later', 'tomorrow', 'avoiding', 'delay', 'postpone', 'not ready', 'waiting', 'someday', "when i'm ready"],
      perfectionism: ['perfect', 'flawless', 'not good enough', 'obsess', 'rewrite', 'polish', 'refine', 'improve', 'judge', 'critique'],
      anger: ['angry', 'resentful', 'furious', 'boiling', 'unfair', 'pushed', 'snap', 'exploding', 'rage', 'irritated'],
      control: ['control', 'grip', 'manage', 'tight', 'predict', 'rigid', 'structure', 'rules', 'order', 'let go'],
      isolation: ['alone', 'no one', 'by myself', 'withdraw', 'disconnect', 'numb', 'avoid', 'burnout', 'invisible']
    };

    // Check both question and mentor answers for shadow keywords (threshold: 1+ keyword)
    const lowerQuestion = question.toLowerCase();
    
    for (const [shadow, keywords] of Object.entries(triggerPatterns)) {
      const questionMatches = keywords.filter(k => lowerQuestion.includes(k));
      if (questionMatches.length >= 1) {
        shadowTriggers.push({
          source: 'user_question',
          trigger_shadow: true,
          shadow_type: shadow,
          detected_keywords: questionMatches
        });
        if (!shadowType) shadowType = shadow;
      }
    }
    
    for (const [mentorType, answer] of Object.entries(answers)) {
      const lowerAnswer = answer.expanded.toLowerCase();
      
      for (const [shadow, keywords] of Object.entries(triggerPatterns)) {
        const matchedKeywords = keywords.filter(k => lowerAnswer.includes(k));
        if (matchedKeywords.length >= 1) {
          shadowTriggers.push({
            mentor: mentorType,
            line: answer,
            trigger_shadow: true,
            shadow_type: shadow,
            detected_keywords: matchedKeywords
          });
          if (!shadowType) shadowType = shadow;
        }
      }
    }

    // Get user's shadow intensity preference (default: balanced = 60%)
    const shadowIntensityMap = {
      gentle: 0.3,
      balanced: 0.6,
      deep_work: 0.9
    };
    const shadowIntensity = profile?.shadow_intensity || 'balanced';
    const triggerProbability = shadowIntensityMap[shadowIntensity as keyof typeof shadowIntensityMap] || 0.6;

    // Shadow Interruption (25% chance to interrupt conversation after banter, before resolution)
    if (shadowType && banter && Math.random() < 0.25) {
      const interruptionPrompts = {
        fear: "You talk of growth, but you're still hiding behind questions. Admit it.",
        shame: "All this wisdom, yet you still believe you're not enough. Why?",
        impostor: "They praise your progress, but deep down you think it's luck. Don't you?",
        procrastination: "Another plan. Another 'soon.' When will you actually start?",
        perfectionism: "You're refining again. But perfect is just another word for 'never done.'",
        anger: "Smile all you want. I feel the rage boiling underneath.",
        control: "You're trying to map it all out. What if you can't?",
        isolation: "You nod along, but you're still keeping them at arm's length."
      };
      
      shadowInterruption = interruptionPrompts[shadowType as keyof typeof interruptionPrompts] || "";
    }

    // Trigger shadow encounter if detected
    if (shadowType && Math.random() < triggerProbability) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        await fetch(`${supabaseUrl}/functions/v1/trigger-shadow`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shadowType,
            triggeredBy: 'council_meeting',
            context: { question, mentorTypes }
          })
        });
      } catch (error) {
        console.error('Failed to trigger shadow encounter:', error);
      }
    }


    // Step 5: Extract tasks from each mentor response
    for (const [mentorType, answer] of Object.entries(answers)) {
      const fullAnswer = answer.expanded;

      // Extract task from this mentor's response
      try {
        const taskResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/extract-task`, {
          method: "POST",
          headers: {
            "Authorization": authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mentorResponse: fullAnswer,
            mentorName: mentorNames[mentorType] || mentorType,
          }),
        });

        if (taskResponse.ok) {
          const taskData = await taskResponse.json();
          extractedTasks.push({
            mentor_name: mentorNames[mentorType] || mentorType,
            task: taskData.task,
          });
        } else {
          console.error(`Failed to extract task for ${mentorType}`);
        }
      } catch (taskError) {
        console.error(`Error extracting task for ${mentorType}:`, taskError);
      }
    }

    // Step 6: Save insights to insight_dots table (don't wait for completion)
    const saveInsightsPromises = Object.entries(answers).map(async ([mentorType, answer]) => {
      try {
        const answerObj = answer as any;
        await supabaseClient.from("insight_dots").insert({
          user_id: user.id,
          source_type: 'council_meeting',
          source_id: null, // Will be linked after council_meeting is saved
          source_mentor: mentorNames[mentorType],
          insight_text: answerObj.short || answer,
          core_theme: answerObj.coreTheme || 'growth',
          skill_tags: [answerObj.coreTheme || 'growth'],
          emotional_tone: null,
        });
      } catch (error) {
        console.error(`Failed to save insight for ${mentorType}:`, error);
      }
    });

    // Fire and forget - don't wait for insights to save
    Promise.all(saveInsightsPromises).catch(console.error);

    return new Response(
      JSON.stringify({ 
        answers, 
        banter,
        shadowInterruption, 
        resolution,
        shadowTriggers,
        tasks: extractedTasks 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in council-meeting:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
