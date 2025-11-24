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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { 
      userId, 
      sourceType, 
      sourceId, 
      insightText, 
      coreTheme, 
      skillTags, 
      emotionalTone, 
      sourceMentor,
      // New energetic fields
      energeticFrequency,
      flowStateDetected,
      resonanceLevel,
      intuitionSignal,
      somaticNotes,
      coherenceIndicators,
      vibrationalContext
    } = await req.json();

    if (!userId || !sourceType || !insightText || !coreTheme) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the insight dot with energetic fields
    const dotData: any = {
      user_id: userId,
      source_type: sourceType,
      source_id: sourceId,
      source_mentor: sourceMentor,
      insight_text: insightText,
      core_theme: coreTheme,
      skill_tags: skillTags || [],
      emotional_tone: emotionalTone,
    };

    // Add energetic fields if provided
    if (energeticFrequency) dotData.energetic_frequency = energeticFrequency;
    if (typeof flowStateDetected === 'boolean') dotData.flow_state_detected = flowStateDetected;
    if (resonanceLevel) dotData.resonance_level = resonanceLevel;
    if (typeof intuitionSignal === 'boolean') dotData.intuition_signal = intuitionSignal;
    if (somaticNotes) dotData.somatic_notes = somaticNotes;
    if (coherenceIndicators) dotData.coherence_indicators = coherenceIndicators;
    if (vibrationalContext) dotData.vibrational_context = vibrationalContext;

    const { data: dot, error: dotError } = await supabaseClient
      .from("insight_dots")
      .insert(dotData)
      .select()
      .single();

    if (dotError) throw dotError;

    return new Response(
      JSON.stringify({ success: true, dot }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating insight dot:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
