import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { insightText } = await req.json();

    if (!insightText) {
      throw new Error('No insight text provided');
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 50,
        messages: [
          {
            role: "user",
            content: `Extract the core concept from this insight as a short title (3-6 words).

The title should be:
- A conceptual phrase, not a sentence
- Capture the essential meaning
- Be memorable and clear
- Use title case

Insight: "${insightText}"

Return ONLY the title, nothing else. No quotes, no explanation.`
          }
        ]
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    const title = data.content[0]?.text?.trim() || 'New Insight';

    return new Response(
      JSON.stringify({ title }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error extracting concept title:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        title: 'New Insight',
        error: errorMessage 
      }),
      { 
        status: 200, // Return 200 with fallback title
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
