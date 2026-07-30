import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const ALLOWED_ORIGINS = [
  Deno.env.get("ALLOWED_ORIGIN") ?? "",
  "https://bcoming.app",
  "https://www.bcoming.app",
].filter(Boolean);

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    // Allow Lovable preview/deploy URLs in development
    /^https:\/\/[a-z0-9-]+\.lovable\.app$/.test(origin) ||
    origin === "http://localhost:5173" ||
    origin === "http://localhost:3000";

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0] || "https://bcoming.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };
}

// ---------------------------------------------------------------------------
// Auth — extract + validate JWT, return the user's real ID
// ---------------------------------------------------------------------------

export async function validateAuth(
  req: Request
): Promise<{ userId: string; error?: never } | { userId?: never; error: string }> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Missing or invalid Authorization header" };
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return { error: "Empty token" };

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { error: "Unauthorized" };
  }

  return { userId: data.user.id };
}

// ---------------------------------------------------------------------------
// Rate limiting — Deno KV, per-user per-function sliding window
// ---------------------------------------------------------------------------

const DEFAULT_LIMITS: Record<string, { max: number; windowMs: number }> = {
  "chat-mentor":              { max: 40, windowMs: 60 * 60 * 1000 },
  "council-meeting":          { max: 20, windowMs: 60 * 60 * 1000 },
  "analyze-journal-entry":    { max: 30, windowMs: 60 * 60 * 1000 },
  "analyze-purpose-alignment":{ max: 10, windowMs: 60 * 60 * 1000 },
  "detect-opportunity":       { max: 10, windowMs: 60 * 60 * 1000 },
  "generate-narrative-bridge":{ max: 20, windowMs: 60 * 60 * 1000 },
  "integrator-setup":         { max: 15, windowMs: 60 * 60 * 1000 },
  "council-unlock":           { max: 10, windowMs: 60 * 60 * 1000 },
  "evolve-atlas-dot":         { max: 20, windowMs: 60 * 60 * 1000 },
};
const FALLBACK_LIMIT = { max: 30, windowMs: 60 * 60 * 1000 };

export async function checkRateLimit(
  userId: string,
  functionName: string
): Promise<{ allowed: boolean; remaining: number; retryAfterMs?: number }> {
  try {
    const kv = await Deno.openKv();
    const limit = DEFAULT_LIMITS[functionName] ?? FALLBACK_LIMIT;
    const windowStart = Math.floor(Date.now() / limit.windowMs);
    const key = ["rate_limit", functionName, userId, windowStart];

    const current = await kv.get<number>(key);
    const count = current.value ?? 0;

    if (count >= limit.max) {
      const nextWindowMs = (windowStart + 1) * limit.windowMs - Date.now();
      return { allowed: false, remaining: 0, retryAfterMs: nextWindowMs };
    }

    await kv.atomic()
      .check(current)
      .set(key, count + 1, { expireIn: limit.windowMs })
      .commit();

    return { allowed: true, remaining: limit.max - count - 1 };
  } catch {
    // If KV is unavailable, fail open (don't block legitimate requests)
    return { allowed: true, remaining: -1 };
  }
}

export function rateLimitResponse(corsHeaders: Record<string, string>, retryAfterMs = 3600000): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
      },
    }
  );
}

export function authErrorResponse(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: "Unauthorized" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
