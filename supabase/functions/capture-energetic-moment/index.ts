import { createClient } from "npm:@supabase/supabase-js@^2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Not authenticated");

    const {
      momentType, // 'flow_state', 'breakthrough', 'expansion', 'resonance', 'intuition_hit'
      energyLevel,
      clarityLevel,
      expansionLevel,
      alignmentFeeling,
      coherenceLevel,
      emotionalState,
      activityContext,
      userNotes,
      relatedDotId,
      relatedTaskId,
      somaticData,
    } = await req.json();

    if (!momentType) {
      return new Response(
        JSON.stringify({ error: "momentType is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine overall frequency based on inputs
    let overallFrequency = "medium";
    const avgLevel = (energyLevel + clarityLevel + expansionLevel + alignmentFeeling + coherenceLevel) / 5;
    if (avgLevel >= 8) overallFrequency = "very-high";
    else if (avgLevel >= 6) overallFrequency = "high";
    else if (avgLevel >= 4) overallFrequency = "medium";
    else overallFrequency = "low";

    // Create energetic snapshot
    const { data: snapshot, error: snapshotError } = await supabaseClient
      .from("energetic_snapshots")
      .insert({
        user_id: user.id,
        snapshot_type: momentType,
        energy_level: energyLevel,
        clarity_level: clarityLevel,
        expansion_level: expansionLevel,
        alignment_feeling: alignmentFeeling,
        coherence_level: coherenceLevel,
        emotional_state: emotionalState,
        overall_frequency: overallFrequency,
        activity_context: activityContext,
        user_notes: userNotes,
        related_dot_id: relatedDotId,
        related_task_id: relatedTaskId,
        somatic_data: somaticData || {},
        snapshot_metadata: {
          captured_via: "user_signal",
          timestamp: new Date().toISOString(),
        }
      })
      .select()
      .single();

    if (snapshotError) throw snapshotError;

    // If it's a significant moment (high frequency), create an insight dot
    if (avgLevel >= 7) {
      const dotInsightText = userNotes || `${momentType.replace(/_/g, ' ')} moment: ${emotionalState || 'High energy state'}`;
      
      await supabaseClient
        .from("insight_dots")
        .insert({
          user_id: user.id,
          source_type: `energetic_${momentType}`,
          source_id: snapshot.id,
          insight_text: dotInsightText,
          core_theme: momentType === 'flow_state' ? 'Flow & Genius' :
                       momentType === 'breakthrough' ? 'Breakthrough' :
                       momentType === 'expansion' ? 'Expansion' :
                       momentType === 'resonance' ? 'Resonance' :
                       'Intuition',
          emotional_tone: emotionalState || 'elevated',
          energetic_frequency: overallFrequency,
          flow_state_detected: momentType === 'flow_state',
          resonance_level: alignmentFeeling,
          intuition_signal: momentType === 'intuition_hit',
          somatic_notes: userNotes,
          coherence_indicators: {
            energy: energyLevel,
            clarity: clarityLevel,
            expansion: expansionLevel,
            alignment: alignmentFeeling,
            coherence: coherenceLevel,
          },
          vibrational_context: {
            moment_type: momentType,
            activity: activityContext,
            overall_frequency: overallFrequency,
            snapshot_id: snapshot.id,
          }
        });
    }

    // Check for vibrational pattern
    const { data: existingPattern } = await supabaseClient
      .from("vibrational_patterns")
      .select("*")
      .eq("user_id", user.id)
      .eq("pattern_type", momentType)
      .maybeSingle();

    if (existingPattern) {
      // Update existing pattern
      await supabaseClient
        .from("vibrational_patterns")
        .update({
          frequency_count: existingPattern.frequency_count + 1,
          average_energy: ((existingPattern.average_energy * existingPattern.frequency_count) + energyLevel) / (existingPattern.frequency_count + 1),
          average_coherence: ((existingPattern.average_coherence * existingPattern.frequency_count) + coherenceLevel) / (existingPattern.frequency_count + 1),
          peak_frequency: Math.max(existingPattern.peak_frequency, avgLevel),
          last_occurrence: new Date().toISOString(),
        })
        .eq("id", existingPattern.id);
    } else {
      // Create new pattern
      await supabaseClient
        .from("vibrational_patterns")
        .insert({
          user_id: user.id,
          pattern_type: momentType,
          frequency_count: 1,
          average_energy: energyLevel,
          average_coherence: coherenceLevel,
          peak_frequency: avgLevel,
          associated_activities: activityContext ? [activityContext] : [],
          emotional_signatures: emotionalState ? [emotionalState] : [],
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        snapshot_id: snapshot.id,
        frequency: overallFrequency,
        dot_created: avgLevel >= 7
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error capturing energetic moment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
