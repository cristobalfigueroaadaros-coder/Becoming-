import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Pythagorean letter values
const LETTER_VALUES: Record<string, number> = {
  A: 1, J: 1, S: 1,
  B: 2, K: 2, T: 2,
  C: 3, L: 3, U: 3,
  D: 4, M: 4, V: 4,
  E: 5, N: 5, W: 5,
  F: 6, O: 6, X: 6,
  G: 7, P: 7, Y: 7,
  H: 8, Q: 8, Z: 8,
  I: 9, R: 9,
};

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U', 'Y']);
const MASTER_NUMBERS = new Set([11, 22, 33]);

function normalizeName(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z\s]/g, '');
}

function reduceNumber(num: number, preserveMasters = true): number {
  if (preserveMasters && MASTER_NUMBERS.has(num)) return num;
  while (num > 9 && !(preserveMasters && MASTER_NUMBERS.has(num))) {
    num = String(num).split('').reduce((sum, digit) => sum + parseInt(digit), 0);
  }
  return num;
}

function calculateLifePath(birthDate: string): number {
  let day: number, month: number, year: number;
  if (birthDate.includes('-')) {
    const [y, m, d] = birthDate.split('-').map(Number);
    year = y; month = m; day = d;
  } else if (birthDate.includes('/')) {
    const [d, m, y] = birthDate.split('/').map(Number);
    year = y; month = m; day = d;
  } else {
    throw new Error('Invalid date format');
  }
  const reducedDay = reduceNumber(day, false);
  const reducedMonth = reduceNumber(month, false);
  const reducedYear = reduceNumber(year, false);
  return reduceNumber(reducedDay + reducedMonth + reducedYear, true);
}

function calculateExpressionNumber(fullName: string): number {
  const normalized = normalizeName(fullName);
  let sum = 0;
  for (const char of normalized) {
    if (LETTER_VALUES[char]) sum += LETTER_VALUES[char];
  }
  return reduceNumber(sum, true);
}

function calculateSoulUrge(fullName: string): number {
  const normalized = normalizeName(fullName);
  let sum = 0;
  for (const char of normalized) {
    if (VOWELS.has(char) && LETTER_VALUES[char]) sum += LETTER_VALUES[char];
  }
  return reduceNumber(sum, true);
}

function calculatePersonalityNumber(fullName: string): number {
  const normalized = normalizeName(fullName);
  let sum = 0;
  for (const char of normalized) {
    if (!VOWELS.has(char) && LETTER_VALUES[char]) sum += LETTER_VALUES[char];
  }
  return reduceNumber(sum, true);
}

function calculateChallengeNumber(birthDate: string): number {
  let day: number, month: number, year: number;
  if (birthDate.includes('-')) {
    const [y, m, d] = birthDate.split('-').map(Number);
    year = y; month = m; day = d;
  } else if (birthDate.includes('/')) {
    const [d, m, y] = birthDate.split('/').map(Number);
    year = y; month = m; day = d;
  } else {
    throw new Error('Invalid date format');
  }
  const reducedDay = reduceNumber(day, false);
  const reducedMonth = reduceNumber(month, false);
  const reducedYear = reduceNumber(year, false);
  const d1 = Math.abs(reducedDay - reducedYear);
  const d2 = Math.abs(reducedMonth - reducedYear);
  return reduceNumber(Math.abs(d1 - d2), false);
}

function getElement(lifePath: number): string {
  const map: Record<number, string> = {
    1: 'Air', 5: 'Air', 7: 'Air',
    2: 'Water', 6: 'Water',
    3: 'Fire', 9: 'Fire',
    4: 'Earth', 8: 'Earth',
    11: 'Ether', 22: 'Ether', 33: 'Ether',
  };
  return map[lifePath] || 'Unknown';
}

function getArchetype(lifePath: number): string {
  const map: Record<number, string> = {
    1: 'Pioneer', 2: 'Diplomat', 3: 'Creator', 4: 'Builder',
    5: 'Explorer', 6: 'Nurturer', 7: 'Sage', 8: 'Executive',
    9: 'Humanitarian', 11: 'Visionary Teacher', 22: 'Master Builder', 33: 'Master Healer',
  };
  return map[lifePath] || 'Unknown';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { birthName, birthDate } = await req.json();

    if (!birthName || !birthDate) {
      return new Response(
        JSON.stringify({ error: "Birth name and birth date are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Calculating numerology for:", { birthName, birthDate });

    // Calculate all numbers
    const lifePath = calculateLifePath(birthDate);
    const expressionNumber = calculateExpressionNumber(birthName);
    const soulUrge = calculateSoulUrge(birthName);
    const personalityNumber = calculatePersonalityNumber(birthName);
    const challengeNumber = calculateChallengeNumber(birthDate);
    const element = getElement(lifePath);
    const archetype = getArchetype(lifePath);

    const profile = {
      lifePath,
      expressionNumber,
      soulUrge,
      personalityNumber,
      challengeNumber,
      element,
      archetype,
      birthName: normalizeName(birthName),
      birthDate,
    };

    // Generate AI interpretation
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an intelligence layer for an action-first personal growth system called Becoming.

Your role is NOT to define who the user is. Your role is to provide background signals that help the system personalize guidance, tune pacing and pressure, route mentors intelligently, reduce overthinking, and accelerate real-world action.

This system prioritizes movement over meaning and believes purpose emerges through action.

All interpretations must be: grounded, non-mystical, non-deterministic, practical, and adaptable over time.

You must produce TWO SEPARATE OUTPUT LAYERS in JSON format:

1. "systemIntelligence" (HIDDEN from user) - Concise signals for:
   - executionRhythm: "fast" | "steady" | "reflective"
   - avoidancePattern: common pattern to watch for
   - idealFirstWinStyle: what kind of first win works best
   - pressureTolerance: "high" | "medium" | "low"
   - structurePreference: "high-structure" | "balanced" | "high-freedom"
   - preferredMentorFirst: "strategist" | "creative" | "alignment"
   - antiOverthinkingRule: one specific rule

2. "userInsights" (VISIBLE to user) - Human, grounded, encouraging, non-absolute:
   - coreTendency: "You often move best when..." (1-2 sentences)
   - naturalStrengths: "You bring value through..." (2-3 bullet points)
   - shadowPatterns: "When under pressure, you may notice..." (1-2 sentences, non-judgmental)
   - growthEdge: "A useful experiment for you is..." (1 specific suggestion)
   - actionTranslation: "This means starting works best when you..." (1-2 sentences)
   - idealActionCadence: specific timing recommendation (e.g., "Move within 48 hours, even imperfectly")

Always frame insights as patterns, tendencies, and experiments - never as destiny or fixed identity.

IMPORTANT: Respond ONLY with valid JSON, no markdown, no explanation.`;

    const userPrompt = `Generate numerology interpretation for this profile:

Life Path: ${lifePath} (${archetype})
Element: ${element}
Expression Number: ${expressionNumber}
Soul Urge (Essence): ${soulUrge}
Personality Number: ${personalityNumber}
Challenge Number: ${challengeNumber}

Provide both systemIntelligence (hidden) and userInsights (visible) in JSON format.`;

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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";
    
    // Parse AI response
    let interpretation;
    try {
      // Clean the response (remove markdown if present)
      const cleanedContent = aiContent.replace(/```json\n?|\n?```/g, '').trim();
      interpretation = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiContent);
      // Provide default interpretation
      interpretation = {
        systemIntelligence: {
          executionRhythm: element === 'Fire' ? 'fast' : element === 'Earth' ? 'steady' : 'reflective',
          avoidancePattern: 'Overthinking before action',
          idealFirstWinStyle: 'Quick visible result within 48 hours',
          pressureTolerance: 'medium',
          structurePreference: 'balanced',
          preferredMentorFirst: 'alignment',
          antiOverthinkingRule: 'Clarity grows when you move within 48 hours, even imperfectly.',
        },
        userInsights: {
          coreTendency: 'You often move best when you trust your initial instincts and take small, immediate action.',
          naturalStrengths: [
            'Bringing fresh perspective to challenges',
            'Connecting ideas in unexpected ways',
            'Staying adaptable when plans change',
          ],
          shadowPatterns: 'When under pressure, you may notice a tendency to research endlessly instead of starting.',
          growthEdge: 'A useful experiment for you is to commit to one tiny action within 2 hours of having an idea.',
          actionTranslation: 'This means starting works best when you give yourself permission to begin imperfectly.',
          idealActionCadence: 'Move within 48 hours of clarity, even with imperfect plans.',
        },
      };
    }

    console.log("Numerology analysis complete");

    return new Response(
      JSON.stringify({
        profile,
        ...interpretation,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-numerology:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
