import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders, validateAuth, authErrorResponse } from "../_shared/security.ts";

// Server-side price/mode mapping — client sends only a tier name
const PRICE_MAP: Record<string, { priceId: string; mode: "payment" | "subscription" }> = {
  supporter: { priceId: "price_1TJPhvGjv5uqp0k0kgyo2tSf", mode: "payment" },
  monthly:   { priceId: "price_1TJPiMGjv5uqp0k0mc0G5c3x", mode: "subscription" },
  yearly:    { priceId: "price_1TJPiTGjv5uqp0k0rqYLXTYH", mode: "subscription" },
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await validateAuth(req);
  if (auth.error) return authErrorResponse(corsHeaders);

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Get user email from Supabase (not from client)
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "").trim();
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    // Accept either a tier name (preferred) or a direct priceId (legacy)
    const body = await req.json();
    const tierName: string | undefined = body.tier;
    let priceId: string;
    let mode: "payment" | "subscription";

    if (tierName) {
      const tier = PRICE_MAP[tierName];
      if (!tier) throw new Error("Invalid tier");
      priceId = tier.priceId;
      mode = tier.mode;
    } else {
      // Legacy path — still validate priceId is one of the known ones
      const validPriceIds = Object.values(PRICE_MAP).map((t) => t.priceId);
      if (!body.priceId || !validPriceIds.includes(body.priceId)) {
        throw new Error("Invalid priceId");
      }
      priceId = body.priceId;
      // Resolve mode server-side — never trust the client's mode
      mode = Object.values(PRICE_MAP).find((t) => t.priceId === priceId)!.mode;
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    const origin = req.headers.get("origin") ?? "https://bcoming.app";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/creation-lab`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("create-checkout error:", error instanceof Error ? error.message : "unknown");
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
