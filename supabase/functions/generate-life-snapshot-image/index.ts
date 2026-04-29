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
    const { snapshotId } = await req.json();
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      throw new Error("Not authenticated");
    }

    // Get snapshot data
    const { data: snapshot, error: snapshotError } = await supabaseClient
      .from("ideal_life_snapshots")
      .select("*")
      .eq("id", snapshotId)
      .eq("user_id", user.id)
      .single();

    if (snapshotError || !snapshot) {
      throw new Error("Snapshot not found");
    }

    // Build prompt from snapshot content
    const elements: string[] = [];
    
    // Parse keywords for visual representation
    const text = [
      snapshot.relationships,
      snapshot.family,
      snapshot.work,
      snapshot.lifestyle,
      snapshot.contribution,
      snapshot.environment
    ].filter(Boolean).join(" ").toLowerCase();

    // Family and relationships
    if (text.includes("married") || text.includes("partner") || text.includes("wife") || text.includes("husband")) {
      elements.push("a happy couple");
    }
    if (text.includes("kids") || text.includes("children") || text.includes("family")) {
      elements.push("with children playing");
    }

    // Wealth and abundance
    if (text.includes("wealthy") || text.includes("millionaire") || text.includes("abundant") || text.includes("rich") || text.includes("financial freedom")) {
      elements.push("beautiful modern home");
      elements.push("luxury lifestyle");
    }

    // Environment
    if (text.includes("beach") || text.includes("sea") || text.includes("ocean") || text.includes("coast")) {
      elements.push("overlooking the ocean");
    }
    if (text.includes("mountain") || text.includes("nature") || text.includes("forest")) {
      elements.push("surrounded by mountains and nature");
    }
    if (text.includes("city") || text.includes("urban")) {
      elements.push("city skyline in background");
    }

    // Work
    if (text.includes("entrepreneur") || text.includes("business") || text.includes("founder")) {
      elements.push("confident professional");
    }
    if (text.includes("creative") || text.includes("artist") || text.includes("writer")) {
      elements.push("creative workspace with art");
    }
    if (text.includes("travel") || text.includes("world")) {
      elements.push("world traveler vibe");
    }

    // Lifestyle
    if (text.includes("health") || text.includes("fit") || text.includes("active")) {
      elements.push("active healthy lifestyle");
    }
    if (text.includes("peace") || text.includes("calm") || text.includes("serene")) {
      elements.push("peaceful serene atmosphere");
    }

    // Build the final prompt
    const visualElements = elements.length > 0 
      ? elements.join(", ")
      : "person living their dream life, peaceful, successful, fulfilled";

    const prompt = `A photorealistic aspirational lifestyle image: ${visualElements}. Golden hour lighting, cinematic composition, warm and inspiring mood. No text or words. Ultra high resolution, 16:9 aspect ratio.`;

    console.log("Generating image with prompt:", prompt);

    // Call Lovable AI for image generation
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      throw new Error("Failed to generate image");
    }

    const aiData = await aiResponse.json();
    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(aiData));
      throw new Error("No image generated");
    }

    // Update snapshot with image URL
    const { error: updateError } = await supabaseClient
      .from("ideal_life_snapshots")
      .update({ generated_image_url: imageUrl })
      .eq("id", snapshotId);

    if (updateError) {
      console.error("Error updating snapshot:", updateError);
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in generate-life-snapshot-image:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});