import { createClient } from "npm:@supabase/supabase-js@^2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EnergeticSnapshot {
  id: string;
  captured_at: string;
  energy_level: number;
  clarity_level: number;
  expansion_level: number;
  coherence_level: number;
  alignment_feeling: number;
  emotional_state: string | null;
  overall_frequency: string | null;
  activity_context: string | null;
  snapshot_type: string;
  user_notes: string | null;
}

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

    // Get all snapshots for the user
    const { data: snapshots, error: snapshotsError } = await supabaseClient
      .from("energetic_snapshots")
      .select("*")
      .eq("user_id", user.id)
      .order("captured_at", { ascending: false });

    if (snapshotsError) throw snapshotsError;

    if (!snapshots || snapshots.length < 3) {
      return new Response(
        JSON.stringify({
          insights: {
            message: "Need more energetic data to analyze patterns. Keep capturing moments!",
            total_snapshots: snapshots?.length || 0,
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Analyze patterns
    const analysis = analyzePatterns(snapshots as EnergeticSnapshot[]);

    // Generate AI insights
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Analyze these vibrational patterns and provide actionable insights:

FLOW STATE PATTERNS:
${JSON.stringify(analysis.flowStatePatterns, null, 2)}

TIME-BASED PATTERNS:
${JSON.stringify(analysis.timeBasedPatterns, null, 2)}

ACTIVITY RESONANCE:
${JSON.stringify(analysis.activityResonance, null, 2)}

EMOTIONAL SIGNATURES:
${JSON.stringify(analysis.emotionalSignatures, null, 2)}

PEAK PERFORMANCE CONDITIONS:
${JSON.stringify(analysis.peakConditions, null, 2)}

Generate 4-6 specific, actionable insights following this THREE-LAYER structure:

1. EMOTIONAL INSIGHT: What patterns reveal about their inner state
2. PRACTICAL INSIGHT: Specific actions/times/activities to optimize for
3. ENERGETIC INSIGHT: Vibrational signature and coherence patterns

Format as JSON array:
[
  {
    "title": "Peak Flow Windows",
    "emotional": "...",
    "practical": "...",
    "energetic": "...",
    "priority": "high" | "medium" | "low"
  }
]

Be specific. Use actual data. Make it actionable.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const insightsText = aiData.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = insightsText.match(/\[[\s\S]*\]/);
    const aiInsights = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return new Response(
      JSON.stringify({
        insights: {
          total_snapshots: snapshots.length,
          analysis_summary: analysis,
          ai_insights: aiInsights,
          generated_at: new Date().toISOString(),
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Vibrational pattern analysis error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function analyzePatterns(snapshots: EnergeticSnapshot[]) {
  // Flow state patterns
  const flowStates = snapshots.filter(s => s.snapshot_type === "flow_state" || s.expansion_level >= 8);
  const flowStatePatterns = {
    total_flow_states: flowStates.length,
    avg_energy_in_flow: flowStates.length > 0 
      ? flowStates.reduce((acc, s) => acc + s.energy_level, 0) / flowStates.length 
      : 0,
    avg_coherence_in_flow: flowStates.length > 0
      ? flowStates.reduce((acc, s) => acc + s.coherence_level, 0) / flowStates.length
      : 0,
  };

  // Time-based patterns
  const timeBasedPatterns = analyzeTimePatterns(snapshots);

  // Activity resonance
  const activityResonance = analyzeActivityResonance(snapshots);

  // Emotional signatures
  const emotionalSignatures = analyzeEmotionalSignatures(snapshots);

  // Peak performance conditions
  const peakConditions = analyzePeakConditions(snapshots);

  return {
    flowStatePatterns,
    timeBasedPatterns,
    activityResonance,
    emotionalSignatures,
    peakConditions,
  };
}

function analyzeTimePatterns(snapshots: EnergeticSnapshot[]) {
  const hourlyData: Record<number, { count: number; avgEnergy: number; totalEnergy: number }> = {};

  snapshots.forEach(snapshot => {
    const hour = new Date(snapshot.captured_at).getHours();
    if (!hourlyData[hour]) {
      hourlyData[hour] = { count: 0, avgEnergy: 0, totalEnergy: 0 };
    }
    hourlyData[hour].count++;
    hourlyData[hour].totalEnergy += snapshot.energy_level;
  });

  // Calculate averages
  Object.keys(hourlyData).forEach(hour => {
    const h = parseInt(hour);
    hourlyData[h].avgEnergy = hourlyData[h].totalEnergy / hourlyData[h].count;
  });

  // Find peak hours
  const peakHours = Object.entries(hourlyData)
    .sort(([, a], [, b]) => b.avgEnergy - a.avgEnergy)
    .slice(0, 3)
    .map(([hour, data]) => ({
      hour: parseInt(hour),
      avgEnergy: data.avgEnergy.toFixed(1),
      count: data.count,
    }));

  return {
    peak_hours: peakHours,
    total_hours_tracked: Object.keys(hourlyData).length,
  };
}

function analyzeActivityResonance(snapshots: EnergeticSnapshot[]) {
  const activityData: Record<string, { count: number; totalResonance: number; avgResonance: number }> = {};

  snapshots.forEach(snapshot => {
    if (snapshot.activity_context) {
      const activity = snapshot.activity_context.toLowerCase();
      if (!activityData[activity]) {
        activityData[activity] = { count: 0, totalResonance: 0, avgResonance: 0 };
      }
      activityData[activity].count++;
      // Resonance = average of energy, expansion, and alignment
      const resonance = (snapshot.energy_level + snapshot.expansion_level + snapshot.alignment_feeling) / 3;
      activityData[activity].totalResonance += resonance;
    }
  });

  // Calculate averages
  Object.keys(activityData).forEach(activity => {
    activityData[activity].avgResonance = activityData[activity].totalResonance / activityData[activity].count;
  });

  // Find highest resonance activities
  const topActivities = Object.entries(activityData)
    .sort(([, a], [, b]) => b.avgResonance - a.avgResonance)
    .slice(0, 5)
    .map(([activity, data]) => ({
      activity,
      avgResonance: data.avgResonance.toFixed(1),
      count: data.count,
    }));

  return {
    top_resonance_activities: topActivities,
    unique_activities: Object.keys(activityData).length,
  };
}

function analyzeEmotionalSignatures(snapshots: EnergeticSnapshot[]) {
  const emotionalData: Record<string, { count: number; avgEnergy: number; totalEnergy: number }> = {};

  snapshots.forEach(snapshot => {
    if (snapshot.emotional_state) {
      const emotion = snapshot.emotional_state.toLowerCase();
      if (!emotionalData[emotion]) {
        emotionalData[emotion] = { count: 0, avgEnergy: 0, totalEnergy: 0 };
      }
      emotionalData[emotion].count++;
      emotionalData[emotion].totalEnergy += snapshot.energy_level;
    }
  });

  // Calculate averages
  Object.keys(emotionalData).forEach(emotion => {
    emotionalData[emotion].avgEnergy = emotionalData[emotion].totalEnergy / emotionalData[emotion].count;
  });

  // Find most frequent and highest energy emotions
  const topEmotions = Object.entries(emotionalData)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([emotion, data]) => ({
      emotion,
      frequency: data.count,
      avgEnergy: data.avgEnergy.toFixed(1),
    }));

  return {
    top_emotional_states: topEmotions,
    unique_emotions: Object.keys(emotionalData).length,
  };
}

function analyzePeakConditions(snapshots: EnergeticSnapshot[]) {
  // Find snapshots with highest overall frequency
  const peakSnapshots = snapshots
    .filter(s => s.overall_frequency === "very-high" || s.overall_frequency === "high")
    .sort((a, b) => {
      const aScore = (a.energy_level + a.coherence_level + a.expansion_level) / 3;
      const bScore = (b.energy_level + b.coherence_level + b.expansion_level) / 3;
      return bScore - aScore;
    })
    .slice(0, 10);

  const conditions = {
    peak_snapshot_count: peakSnapshots.length,
    common_peak_activities: extractCommonPatterns(peakSnapshots, "activity_context"),
    common_peak_emotions: extractCommonPatterns(peakSnapshots, "emotional_state"),
    avg_peak_energy: peakSnapshots.length > 0
      ? peakSnapshots.reduce((acc, s) => acc + s.energy_level, 0) / peakSnapshots.length
      : 0,
    avg_peak_coherence: peakSnapshots.length > 0
      ? peakSnapshots.reduce((acc, s) => acc + s.coherence_level, 0) / peakSnapshots.length
      : 0,
  };

  return conditions;
}

function extractCommonPatterns(snapshots: EnergeticSnapshot[], field: keyof EnergeticSnapshot) {
  const counts: Record<string, number> = {};
  
  snapshots.forEach(snapshot => {
    const value = snapshot[field];
    if (value && typeof value === "string") {
      const key = value.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([pattern, count]) => ({ pattern, count }));
}
