import { ProviderHandler } from "./ProviderHandler";
import { openrouterHandler } from "./providers/OpenRouter";
import { openaiHandler } from "./providers/OpenAI";
import { anthropicHandler } from "./providers/Anthropic";
import { mistralHandler } from "./providers/Mistral";
import { geminiHandler } from "./providers/Gemini";
import { zaiHandler } from "./providers/ZAi";

/**
 * Registry mapping provider names (as stored in the database) to their handlers.
 * To add support for a new provider: create a handler file under src/providers/,
 * import it here, and add an entry to this map.
 */
const REGISTRY: Record<string, ProviderHandler> = {
    openrouter: openrouterHandler,
    openai: openaiHandler,
    anthropic: anthropicHandler,
    mistral: mistralHandler,
    gemini: geminiHandler,
    z_ai: zaiHandler
};

/**
 * Returns the provider handler for a given provider name.
 * @param providerName The provider name as stored in the database.
 * @returns The matching handler, or null if no handler is registered.
 */
export function getProviderHandler(providerName: string): ProviderHandler | null {
    return REGISTRY[providerName] ?? null;
}
