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

    // Get completed tasks with timestamps
    const { data: tasks } = await supabaseClient
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "done")
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(50);

    // Get completed daily challenges
    const { data: challenges } = await supabaseClient
      .from("daily_challenge")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(50);

    // Get energetic snapshots
    const { data: snapshots } = await supabaseClient
      .from("energetic_snapshots")
      .select("*")
      .eq("user_id", user.id)
      .order("captured_at", { ascending: false })
      .limit(100);

    if (!tasks && !challenges && !snapshots) {
      return new Response(
        JSON.stringify({
          correlations: {
            message: "Not enough data yet. Complete more tasks and capture energetic moments!",
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Analyze correlations
    const correlations = analyzeCorrelations(tasks || [], challenges || [], snapshots || []);

    // Generate AI recommendations
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Analyze these energetic-action correlations and provide optimal timing insights:

TASK COMPLETION PATTERNS:
${JSON.stringify(correlations.taskPatterns, null, 2)}

CHALLENGE COMPLETION PATTERNS:
${JSON.stringify(correlations.challengePatterns, null, 2)}

ENERGETIC STATE CORRELATION:
${JSON.stringify(correlations.energeticCorrelation, null, 2)}

OPTIMAL WINDOWS:
${JSON.stringify(correlations.optimalWindows, null, 2)}

Generate 5-6 actionable timing recommendations using THREE-LAYER GUIDANCE:

Format as JSON array:
[
  {
    "action_type": "creative_work" | "shadow_work" | "strategic_planning" | "physical_tasks" | "social_interaction" | "learning",
    "optimal_time": "morning" | "afternoon" | "evening" | "specific hour range",
    "emotional_guidance": "Why this timing works emotionally...",
    "practical_guidance": "Specific actions to take during this window...",
    "energetic_guidance": "Vibrational signature and coherence factors...",
    "confidence": "high" | "medium" | "low",
    "avg_energy": 7.5,
    "avg_coherence": 8.2
  }
]

Be specific. Use the actual data. Focus on actionable windows.`;

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
    const recommendationsText = aiData.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = recommendationsText.match(/\[[\s\S]*\]/);
    const recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return new Response(
      JSON.stringify({
        correlations: {
          ...correlations,
          recommendations,
          current_time: new Date().toISOString(),
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Optimal timing analysis error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function analyzeCorrelations(tasks: any[], challenges: any[], snapshots: any[]) {
  // Analyze task completion patterns
  const taskPatterns = analyzeTaskPatterns(tasks, snapshots);
  
  // Analyze challenge completion patterns
  const challengePatterns = analyzeChallengePatterns(challenges, snapshots);
  
  // Find energetic state correlations
  const energeticCorrelation = analyzeEnergeticCorrelation(tasks, challenges, snapshots);
  
  // Determine optimal windows
  const optimalWindows = determineOptimalWindows(taskPatterns, challengePatterns, snapshots);

  return {
    taskPatterns,
    challengePatterns,
    energeticCorrelation,
    optimalWindows,
    total_tasks: tasks.length,
    total_challenges: challenges.length,
    total_snapshots: snapshots.length,
  };
}

function analyzeTaskPatterns(tasks: any[], snapshots: any[]) {
  const hourlySuccess: Record<number, { count: number; avgEnergy: number; totalEnergy: number }> = {};
  
  tasks.forEach(task => {
    if (!task.completed_at) return;
    
    const hour = new Date(task.completed_at).getHours();
    const nearestSnapshot = findNearestSnapshot(task.completed_at, snapshots, 60); // within 60 minutes
    
    if (!hourlySuccess[hour]) {
      hourlySuccess[hour] = { count: 0, avgEnergy: 0, totalEnergy: 0 };
    }
    
    hourlySuccess[hour].count++;
    if (nearestSnapshot) {
      hourlySuccess[hour].totalEnergy += nearestSnapshot.energy_level;
    }
  });

  // Calculate averages
  Object.keys(hourlySuccess).forEach(hour => {
    const h = parseInt(hour);
    if (hourlySuccess[h].count > 0) {
      hourlySuccess[h].avgEnergy = hourlySuccess[h].totalEnergy / hourlySuccess[h].count;
    }
  });

  const topHours = Object.entries(hourlySuccess)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 3)
    .map(([hour, data]) => ({
      hour: parseInt(hour),
      completions: data.count,
      avgEnergy: data.avgEnergy.toFixed(1),
    }));

  return {
    top_completion_hours: topHours,
    total_tasks_analyzed: tasks.length,
  };
}

function analyzeChallengePatterns(challenges: any[], snapshots: any[]) {
  const hourlyCompletion: Record<number, { count: number; avgEnergy: number; totalEnergy: number }> = {};
  
  challenges.forEach(challenge => {
    if (!challenge.completed_at) return;
    
    const hour = new Date(challenge.completed_at).getHours();
    const nearestSnapshot = findNearestSnapshot(challenge.completed_at, snapshots, 60);
    
    if (!hourlyCompletion[hour]) {
      hourlyCompletion[hour] = { count: 0, avgEnergy: 0, totalEnergy: 0 };
    }
    
    hourlyCompletion[hour].count++;
    if (nearestSnapshot) {
      hourlyCompletion[hour].totalEnergy += nearestSnapshot.energy_level;
    }
  });

  // Calculate averages
  Object.keys(hourlyCompletion).forEach(hour => {
    const h = parseInt(hour);
    if (hourlyCompletion[h].count > 0) {
      hourlyCompletion[h].avgEnergy = hourlyCompletion[h].totalEnergy / hourlyCompletion[h].count;
    }
  });

  const topHours = Object.entries(hourlyCompletion)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 3)
    .map(([hour, data]) => ({
      hour: parseInt(hour),
      completions: data.count,
      avgEnergy: data.avgEnergy.toFixed(1),
    }));

  return {
    top_completion_hours: topHours,
    total_challenges_analyzed: challenges.length,
  };
}

function analyzeEnergeticCorrelation(tasks: any[], challenges: any[], snapshots: any[]) {
  let totalActions = 0;
  let highEnergyActions = 0;
  let highCoherenceActions = 0;
  let flowStateActions = 0;

  const allActions = [
    ...tasks.map((t: any) => ({ type: 'task', completed_at: t.completed_at })),
    ...challenges.map((c: any) => ({ type: 'challenge', completed_at: c.completed_at })),
  ];

  allActions.forEach(action => {
    const nearestSnapshot = findNearestSnapshot(action.completed_at, snapshots, 60);
    if (nearestSnapshot) {
      totalActions++;
      if (nearestSnapshot.energy_level >= 7) highEnergyActions++;
      if (nearestSnapshot.coherence_level >= 7) highCoherenceActions++;
      if (nearestSnapshot.snapshot_type === 'flow_state') flowStateActions++;
    }
  });

  return {
    total_actions_with_energy_data: totalActions,
    high_energy_percentage: totalActions > 0 ? ((highEnergyActions / totalActions) * 100).toFixed(1) : 0,
    high_coherence_percentage: totalActions > 0 ? ((highCoherenceActions / totalActions) * 100).toFixed(1) : 0,
    flow_state_percentage: totalActions > 0 ? ((flowStateActions / totalActions) * 100).toFixed(1) : 0,
  };
}

function determineOptimalWindows(taskPatterns: any, challengePatterns: any, snapshots: any[]) {
  // Group snapshots by hour and calculate average metrics
  const hourlyMetrics: Record<number, {
    count: number;
    totalEnergy: number;
    totalClarity: number;
    totalCoherence: number;
    totalExpansion: number;
  }> = {};

  snapshots.forEach(snapshot => {
    const hour = new Date(snapshot.captured_at).getHours();
    if (!hourlyMetrics[hour]) {
      hourlyMetrics[hour] = {
        count: 0,
        totalEnergy: 0,
        totalClarity: 0,
        totalCoherence: 0,
        totalExpansion: 0,
      };
    }
    hourlyMetrics[hour].count++;
    hourlyMetrics[hour].totalEnergy += snapshot.energy_level;
    hourlyMetrics[hour].totalClarity += snapshot.clarity_level;
    hourlyMetrics[hour].totalCoherence += snapshot.coherence_level;
    hourlyMetrics[hour].totalExpansion += snapshot.expansion_level;
  });

  const windows = Object.entries(hourlyMetrics)
    .map(([hour, metrics]) => ({
      hour: parseInt(hour),
      avgEnergy: metrics.totalEnergy / metrics.count,
      avgClarity: metrics.totalClarity / metrics.count,
      avgCoherence: metrics.totalCoherence / metrics.count,
      avgExpansion: metrics.totalExpansion / metrics.count,
      dataPoints: metrics.count,
    }))
    .filter(w => w.dataPoints >= 2) // Only windows with enough data
    .sort((a, b) => {
      const scoreA = (a.avgEnergy + a.avgClarity + a.avgCoherence + a.avgExpansion) / 4;
      const scoreB = (b.avgEnergy + b.avgClarity + b.avgCoherence + b.avgExpansion) / 4;
      return scoreB - scoreA;
    })
    .slice(0, 5);

  return windows.map(w => ({
    hour: w.hour,
    time_label: `${w.hour}:00 - ${w.hour + 1}:00`,
    avg_energy: w.avgEnergy.toFixed(1),
    avg_clarity: w.avgClarity.toFixed(1),
    avg_coherence: w.avgCoherence.toFixed(1),
    avg_expansion: w.avgExpansion.toFixed(1),
    overall_score: ((w.avgEnergy + w.avgClarity + w.avgCoherence + w.avgExpansion) / 4).toFixed(1),
  }));
}

function findNearestSnapshot(timestamp: string, snapshots: any[], maxMinutes: number): any | null {
  const targetTime = new Date(timestamp).getTime();
  let nearest: any = null;
  let minDiff = Infinity;

  snapshots.forEach(snapshot => {
    const snapshotTime = new Date(snapshot.captured_at).getTime();
    const diff = Math.abs(targetTime - snapshotTime);
    const diffMinutes = diff / (1000 * 60);
    
    if (diffMinutes <= maxMinutes && diff < minDiff) {
      minDiff = diff;
      nearest = snapshot;
    }
  });

  return nearest;
}
