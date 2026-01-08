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

    if (!insightText || insightText.length < 5) {
      return new Response(
        JSON.stringify({ title: insightText?.slice(0, 30) || 'New Insight' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to get API key - check multiple possible names
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY") || Deno.env.get("chatgpt") || "";
    
    if (!apiKey) {
      console.log('No API key found, using fallback title');
      const fallbackTitle = insightText.slice(0, 40) + (insightText.length > 40 ? '...' : '');
      return new Response(
        JSON.stringify({ title: fallbackTitle }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
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

Insight: "${insightText.slice(0, 500)}"

Return ONLY the title, nothing else. No quotes, no explanation.`
          }
        ]
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('API error:', data.error);
      const fallbackTitle = insightText.slice(0, 40) + (insightText.length > 40 ? '...' : '');
      return new Response(
        JSON.stringify({ title: fallbackTitle }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const title = data.content?.[0]?.text?.trim() || insightText.slice(0, 30);

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
