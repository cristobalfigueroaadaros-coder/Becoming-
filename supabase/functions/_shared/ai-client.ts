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

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...payload,
      model: resolveModel(payload.model, config.provider),
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    // Preserve the original response for callers that need to inspect its body
    // (for example to decide whether to use a safe local fallback).
    const body = await response.clone().text();
    console.error("AI provider error:", config.provider, response.status, body);
  }

  return response;
}
