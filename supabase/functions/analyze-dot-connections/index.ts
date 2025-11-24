import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { autoSave = false } = await req.json().catch(() => ({}));

    // === STEP 1: FETCH ALL USER DOTS ===
    const { data: dots, error: dotsError } = await supabaseClient
      .from('insight_dots')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (dotsError) throw dotsError;
    if (!dots || dots.length < 3) {
      return new Response(
        JSON.stringify({ 
          error: "Not enough dots yet", 
          message: "Keep exploring! You need at least 3 dots to start seeing connections." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === STEP 2: ORGANIZE DOTS BY CLUSTERS ===
    const dotsByTheme: Record<string, any[]> = {};
    const dotsBySource: Record<string, any[]> = {};
    const dotsByTone: Record<string, any[]> = {};
    const skillTagFrequency: Record<string, number> = {};

    dots.forEach(dot => {
      // Group by theme
      if (!dotsByTheme[dot.core_theme]) dotsByTheme[dot.core_theme] = [];
      dotsByTheme[dot.core_theme].push(dot);

      // Group by source
      if (!dotsBySource[dot.source_type]) dotsBySource[dot.source_type] = [];
      dotsBySource[dot.source_type].push(dot);

      // Group by emotional tone
      if (dot.emotional_tone) {
        if (!dotsByTone[dot.emotional_tone]) dotsByTone[dot.emotional_tone] = [];
        dotsByTone[dot.emotional_tone].push(dot);
      }

      // Count skill tags
      if (dot.skill_tags) {
        dot.skill_tags.forEach((tag: string) => {
          skillTagFrequency[tag] = (skillTagFrequency[tag] || 0) + 1;
        });
      }
    });

    // === STEP 3: PREPARE CONTEXT FOR AI ===
    const topThemes = Object.entries(dotsByTheme)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5)
      .map(([theme, dots]) => `${theme} (${dots.length} dots)`);

    const topSkills = Object.entries(skillTagFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => `${skill} (${count}x)`);

    const recentDots = dots.slice(0, 20).map(d => 
      `[${d.core_theme}] ${d.insight_text.substring(0, 100)}...`
    ).join('\n');

    // Get user profile for context
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('main_mission, main_strengths, priority_growth_area, purpose_path')
      .eq('id', user.id)
      .maybeSingle();

    // === STEP 4: AI ANALYSIS FOR PATTERNS & CONNECTIONS ===
    const analysisPrompt = `You are the Dot-Connection Engine, analyzing a user's constellation of insights to reveal their genius.

USER CONTEXT:
${profile ? `
- Purpose Path: ${profile.purpose_path || 'discovering'}
- Main Mission: ${profile.main_mission || 'unknown'}
- Strengths: ${profile.main_strengths?.join(', ') || 'unknown'}
- Growth Area: ${profile.priority_growth_area || 'unknown'}
` : ''}

DOT CONSTELLATION (${dots.length} total dots):
Top Themes: ${topThemes.join(', ')}
Top Skills: ${topSkills.join(', ')}

Recent Dots:
${recentDots}

ANALYZE AND PROVIDE:

1. **PATTERNS** (3-5 recurring patterns you see):
   - What keeps appearing across different dots?
   - What themes intersect?
   - What's the user naturally drawn to?

2. **CONNECTIONS** (5-8 specific dot connections):
   - Connect dots that reveal something new together
   - Show intersections that create unique value
   - Format: "Dot A + Dot B = Insight"
   
3. **EMERGING GENIUS** (2-3 sentences):
   - What's this person's unique gift?
   - What can they do that others can't?
   - What's their natural superpower?

4. **CREATION IDEAS** (3-5 concrete ideas):
   - What could they create from these connections?
   - Projects, products, content, programs, businesses
   - Be specific and actionable
   - Each idea must include:
     * WHAT: The creation
     * WHY: How it connects their dots
     * FIRST STEP: One concrete action

RULES:
- Be specific, not generic
- Ground everything in their actual dots
- Be creative but realistic
- Focus on what's unique to THEM

Return valid JSON:
{
  "patterns": [
    {
      "name": "string",
      "description": "string",
      "dotCount": number,
      "themes": ["string"]
    }
  ],
  "connections": [
    {
      "dotIds": ["id1", "id2"],
      "insight": "string - what this connection reveals",
      "type": "string - resonance/contrast/amplification/transformation"
    }
  ],
  "emergingGenius": "string - their unique gift",
  "creationIdeas": [
    {
      "title": "string",
      "description": "string",
      "dotConnections": ["theme1", "theme2"],
      "firstStep": "string",
      "impact": "string"
    }
  ],
  "nextSteps": ["string - 3-4 immediate actions to explore their genius"]
}`;

    console.log("Calling AI for dot connection analysis...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a creative intelligence engine that finds meaningful patterns and connections." },
          { role: "user", content: analysisPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);

    // === STEP 5: SAVE ANALYSIS TO HISTORY ===
    const { data: savedAnalysis, error: saveError } = await supabaseClient
      .from('dot_analysis_history')
      .insert({
        user_id: user.id,
        patterns: analysis.patterns || [],
        connections: analysis.creationIdeas || [],
        emerging_genius: analysis.emergingGenius,
        next_steps: analysis.nextSteps || [],
        stats: {
          totalDots: dots.length,
          topThemes,
          topSkills,
          themeCount: Object.keys(dotsByTheme).length,
          sourceCount: Object.keys(dotsBySource).length,
        }
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save analysis:', saveError);
    }

    // === STEP 6: OPTIONALLY SAVE CONNECTIONS TO DATABASE ===
    if (autoSave && analysis.connections && analysis.connections.length > 0) {
      const connectionsToSave = analysis.connections
        .filter((conn: any) => conn.dotIds && conn.dotIds.length === 2)
        .map((conn: any) => ({
          user_id: user.id,
          dot_id_1: conn.dotIds[0],
          dot_id_2: conn.dotIds[1],
          connection_type: conn.type || 'ai_suggested',
          connection_insight: conn.insight,
          ai_generated: true,
        }));

      if (connectionsToSave.length > 0) {
        await supabaseClient
          .from('dot_connections')
          .insert(connectionsToSave);
      }
    }

    // === STEP 7: RETURN ANALYSIS ===
    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          ...analysis,
          stats: {
            totalDots: dots.length,
            topThemes,
            topSkills,
            themeCount: Object.keys(dotsByTheme).length,
            sourceCount: Object.keys(dotsBySource).length,
          }
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-dot-connections:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
