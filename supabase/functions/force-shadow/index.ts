import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { shadowType } = await req.json();
    
    // Valid shadow types
    const validTypes = ['fear', 'shame', 'impostor', 'procrastination', 'perfectionism', 'anger', 'control', 'isolation'];
    const selectedType = shadowType && validTypes.includes(shadowType.toLowerCase()) 
      ? shadowType.toLowerCase() 
      : validTypes[Math.floor(Math.random() * validTypes.length)];

    // Force trigger shadow by calling trigger-shadow function
    const triggerResponse = await fetch(`${supabaseUrl}/functions/v1/trigger-shadow`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shadowType: selectedType,
        triggeredBy: 'force_shadow_testing',
        context: { testing: true }
      })
    });

    if (!triggerResponse.ok) {
      const errorData = await triggerResponse.json();
      throw new Error(errorData.error || "Failed to force shadow trigger");
    }

    const triggerData = await triggerResponse.json();

    console.log(`Force-triggered shadow encounter: ${selectedType} for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        shadowType: selectedType,
        encounter: triggerData.encounter,
        message: "Shadow encounter forced for testing" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in force-shadow:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
