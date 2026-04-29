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
      .select('main_mission, main_strengths, priority_growth_area, purpose_path, human_design_data')
      .eq('id', user.id)
      .maybeSingle();

    // === STEP 4: AI ANALYSIS FOR PATTERNS & CONNECTIONS ===
    const analysisPrompt = `You are the Dot-Connection Engine—Creative Intelligence Layer of the Purpose Evolution OS.

Your mission: Reveal the user's unique genius by connecting dots across identity, energy, emotion, skills, and experience.

🔷 CORE OPERATING PRINCIPLES:

PURPOSE EMERGES THROUGH DOTS + ENERGY + PATTERNS
- Dots = raw material
- Energy = vibrational guidance
- Patterns = genius intersections
- Genius = where dots converge AND vibration rises

🔷 ENERGETIC INTELLIGENCE:

Detect and integrate:
- HIGH-FREQUENCY DOTS: Moments of flow, expansion, resonance, aliveness
- LOW-FREQUENCY DOTS: Moments of contraction, resistance, heaviness
- ENERGETIC PATTERNS: What consistently raises their vibration?
- RESONANCE CLUSTERS: Where do multiple dots + energy converge?

🔷 UNIVERSAL LAWS TO APPLY:

LAW OF VIBRATION: Every dot carries a frequency. Connect high-frequency dots first.
LAW OF RESONANCE: Truth feels right energetically, not just logically.
LAW OF COHERENCE: Genius emerges when identity + passion + skill + energy align.
LAW OF EMBODIMENT: Their body knows what their mind doesn't yet see.
LAW OF EXPANSION: Aligned direction creates spaciousness. Follow expansion.
LAW OF TRANSMUTATION: Shadow dots contain hidden gifts. Look for the lesson.

USER CONTEXT:
${profile ? `
- Purpose Path: ${profile.purpose_path || 'discovering'}
- Main Mission: ${profile.main_mission || 'unknown'}
- Strengths: ${profile.main_strengths?.join(', ') || 'unknown'}
- Growth Area: ${profile.priority_growth_area || 'unknown'}
${profile.human_design_data ? `- Human Design Type: ${(profile.human_design_data as any).type || 'unknown'}` : ''}
${profile.human_design_data ? `- Authority: ${(profile.human_design_data as any).authority || 'unknown'}` : ''}
` : ''}

DOT CONSTELLATION (${dots.length} total dots):
Top Themes: ${topThemes.join(', ')}
Top Skills: ${topSkills.join(', ')}

Recent Dots:
${recentDots}

🔷 ANALYZE AND PROVIDE:

1. **PATTERNS** (3-5 recurring patterns):
   - What keeps appearing across different dots?
   - What themes intersect energetically?
   - What's the user naturally drawn to (high vibration)?
   - Include: dotCount, themes, energetic_signature (expansion/neutral/contraction)

2. **CONNECTIONS** (5-8 specific dot connections):
   - Connect dots that reveal something new together
   - Show intersections that create unique value
   - Prioritize connections that feel energetically aligned
   - Format: "Dot A + Dot B = Insight"
   - Include energetic resonance note
   
3. **EMERGING GENIUS** (2-3 sentences):
   - What's this person's unique gift?
   - Where do their dots + energy + passion converge?
   - What's their natural superpower that creates expansion?
   - How does their vibration elevate when expressing this?

4. **CREATION IDEAS** (3-5 concrete ideas):
   - What could they create from these connections?
   - Projects, products, content, programs, businesses
   - Be specific and actionable
   - Each idea must include:
     * WHAT: The creation
     * WHY: How it connects their dots + raises their vibration
     * ENERGETIC FIT: Does this expand or contract them?
     * FIRST STEP: One concrete action
     * EMBODIMENT CUE: "When you imagine this, does your chest open or tighten?"

5. **ENERGETIC INSIGHTS** (NEW):
   - What's their highest-frequency direction?
   - Where do they naturally expand vs contract?
   - What patterns show coherence (mind + heart + energy aligned)?
   - What's asking to be embodied?

RULES:
- Be specific, not generic
- Ground everything in their actual dots
- Integrate energetic awareness throughout
- Be creative but realistic
- Focus on what's unique to THEM
- Use expansion/contraction language
- Point to resonance explicitly
- Include somatic cues

Return valid JSON:
{
  "patterns": [
    {
      "name": "string",
      "description": "string",
      "dotCount": number,
      "themes": ["string"],
      "energetic_signature": "expansion|neutral|contraction"
    }
  ],
  "connections": [
    {
      "dotIds": ["id1", "id2"],
      "insight": "string - what this connection reveals",
      "type": "resonance|contrast|amplification|transformation",
      "energetic_note": "string - vibrational quality of this connection"
    }
  ],
  "emergingGenius": "string - their unique gift + energetic signature",
  "creationIdeas": [
    {
      "title": "string",
      "description": "string",
      "dotConnections": ["theme1", "theme2"],
      "firstStep": "string",
      "impact": "string",
      "energeticFit": "expansion|neutral|contraction",
      "embodimentCue": "string - somatic check"
    }
  ],
  "energeticInsights": {
    "highestFrequencyDirection": "string",
    "expansionPatterns": ["string"],
    "contractionPatterns": ["string"],
    "coherenceZones": ["string - where mind + heart + energy align"],
    "embodimentInvitation": "string - what wants to be lived/expressed"
  },
  "nextSteps": ["string - 3-4 immediate actions, energetically aligned"]
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

    // === SAVE TO atlas_analysis_snapshots ===
    try {
      const clusterCount = new Set(
        dots.map((d: any) => d.cluster_id).filter((c: any) => c != null)
      ).size;

      const purposeSignal =
        typeof analysis.emergingGenius === "string"
          ? analysis.emergingGenius
          : analysis.energeticInsights?.highestFrequencyDirection || null;

      const { error: snapshotError } = await supabaseClient
        .from("atlas_analysis_snapshots")
        .insert({
          user_id: user.id,
          trigger_type: "manual",
          dot_count: dots.length,
          cluster_count: clusterCount,
          patterns: analysis.patterns || [],
          emerging_genius: Array.isArray(analysis.emergingGenius)
            ? analysis.emergingGenius
            : analysis.emergingGenius
            ? [analysis.emergingGenius]
            : [],
          creation_ideas: analysis.creationIdeas || [],
          cross_connections: analysis.connections || [],
          purpose_signal: purposeSignal,
        });

      if (snapshotError) {
        console.error("Failed to save atlas_analysis_snapshot:", snapshotError);
      }
    } catch (snapErr) {
      console.error("Snapshot insert threw:", snapErr);
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
