import { ProviderHandler } from "./ProviderHandler";
import { openrouterHandler } from "./providers/openrouter";
import { openaiHandler } from "./providers/openai";
import { anthropicHandler } from "./providers/anthropic";
import { mistralHandler } from "./providers/mistral";
import { geminiHandler } from "./providers/gemini";
import { zaiHandler } from "./providers/z-ai";
import { handler as ovhAnonymousHandler } from "./providers/ovh-anonymous";
import { handler as keylessAiHandler } from "./providers/keyless-ai";

/**
 * Registry mapping provider names (as stored in the database) to their handlers.
 * To add support for a new provider: create a folder under src/providers/<name>/,
 * export a handler from index.ts, import it here, and add an entry to this map.
 */
const REGISTRY: Record<string, ProviderHandler> = {
    openrouter: openrouterHandler,
    openai: openaiHandler,
    anthropic: anthropicHandler,
    mistral: mistralHandler,
    gemini: geminiHandler,
    z_ai: zaiHandler,
    ovh_anonymous: ovhAnonymousHandler,
    keylessai: keylessAiHandler
};

/**
 * Returns the provider handler for a given provider name.
 * @param providerName The provider name as stored in the database.
 * @returns The matching handler, or null if no handler is registered.
 */
export function getProviderHandler(providerName: string): ProviderHandler | null {
    return REGISTRY[providerName] ?? null;
}
