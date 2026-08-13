type ChatCompletionPayload = {
  model?: string;
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
  tools?: unknown[];
  tool_choice?: unknown;
  temperature?: number;
  max_tokens?: number;
};

type ChatCompletionOptions = {
  signal?: AbortSignal;
  usage?: {
    userId?: string;
    feature?: string;
  };
};

const LOVABLE_CHAT_COMPLETIONS_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

function getProviderConfig() {
  const explicitUrl = Deno.env.get("AI_CHAT_COMPLETIONS_URL");
  const explicitKey = Deno.env.get("AI_API_KEY");
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  if (explicitUrl && explicitKey) {
    return {
      apiKey: explicitKey,
      url: explicitUrl,
      provider: Deno.env.get("AI_PROVIDER") || "custom",
    };
  }

  if (openAiKey) {
    return {
      apiKey: openAiKey,
      url: OPENAI_CHAT_COMPLETIONS_URL,
      provider: "openai",
    };
  }

  if (lovableKey) {
    return {
      apiKey: lovableKey,
      url: LOVABLE_CHAT_COMPLETIONS_URL,
      provider: "lovable",
    };
  }

  return null;
}

function resolveModel(model: string | undefined, provider: string) {
  if (provider !== "openai") return model;
  if (Deno.env.get("OPENAI_MODEL")) return Deno.env.get("OPENAI_MODEL");
  if (!model || model.startsWith("google/")) return "gpt-4o-mini";
  return model;
}

function estimatedCost(provider: string, model: string | undefined, input: number, output: number) {
  // Current GPT-4o mini public list price: $0.15 / 1M input, $0.60 / 1M output.
  // Keep unknown providers at $0 until their pricing is deliberately configured.
  if (provider !== "openai" || model !== "gpt-4o-mini") return 0;
  return (input * 0.15 + output * 0.60) / 1_000_000;
}

async function recordUsage(
  response: Response,
  provider: string,
  model: string | undefined,
  usage: ChatCompletionOptions["usage"],
) {
  if (!usage?.feature || !response.ok) return;
  try {
    const data = await response.clone().json();
    const input = Number(data?.usage?.prompt_tokens ?? data?.usage?.input_tokens ?? 0);
    const output = Number(data?.usage?.completion_tokens ?? data?.usage?.output_tokens ?? 0);
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const url = Deno.env.get("SUPABASE_URL");
    if (!serviceKey || !url) return;
    await fetch(`${url}/rest/v1/ai_usage_ledger`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        user_id: usage.userId ?? null,
        feature: usage.feature,
        provider,
        model,
        input_tokens: input,
        output_tokens: output,
        estimated_cost_usd: estimatedCost(provider, model, input, output),
      }),
    });
  } catch (error) {
    // Cost monitoring must never block a user's meaningful AI moment.
    console.warn("Could not record AI usage:", error);
  }
}

export function hasAiProvider() {
  return getProviderConfig() !== null;
}

export async function callChatCompletion(
  payload: ChatCompletionPayload,
  options: ChatCompletionOptions = {},
) {
  const config = getProviderConfig();
  if (!config) {
    throw new Error("No AI provider configured. Set OPENAI_API_KEY, AI_API_KEY, or LOVABLE_API_KEY.");
  }

  const resolvedModel = resolveModel(payload.model, config.provider);
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...payload,
      model: resolvedModel,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    // Preserve the original response for callers that need to inspect its body
    // (for example to decide whether to use a safe local fallback).
    const body = await response.clone().text();
    console.error("AI provider error:", config.provider, response.status, body);
  }

  void recordUsage(response, config.provider, resolvedModel, options.usage);

  return response;
}
