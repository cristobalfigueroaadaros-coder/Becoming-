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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Unlocking council for user:", user.id);

    // Get user's display name for personalized message
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const displayName = profile?.display_name || "friend";
    const firstName = displayName.split(" ")[0];

    // Update profile to unlock council
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        council_unlocked: true,
        council_unlocked_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Update error:", updateError);
      throw updateError;
    }

    // Create Future Self message
    const message = `Nice work, ${firstName}. You've unlocked the Council. It's time to introduce yourself.`;
    
    const { error: messageError } = await supabase
      .from("future_self_messages")
      .insert({
        user_id: user.id,
        message,
        trigger_reason: "council_unlock",
        emotional_tone: "warm",
        was_received: false,
      });

    if (messageError) {
      console.error("Message error:", messageError);
      // Don't throw - the unlock is more important than the message
    }

    console.log("Council unlocked and message created for user:", user.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Council unlocked",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in trigger-council-unlock:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
