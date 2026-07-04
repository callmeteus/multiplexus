import {
    DiscoveredModel,
    ProviderHandler,
    fetchOpenAICompatibleList,
    markFreeModels,
    sortModels
} from "../ProviderHandler";

/**
 * Gemini models that are free on the Google AI (Gemini API) free tier.
 * Gemma models are open-weight and free to use. The Gemini API free tier
 * also covers flash-lite models but those are rate-limited - marking them
 * free would be misleading, so only open-weight Gemma models are marked here.
 * Check https://ai.google.dev/pricing for current rates.
 */
const FREE_PATTERNS: RegExp[] = [
    /^gemma/ // gemma-3-1b-it, gemma-3-4b-it, gemma-3-12b-it, etc.
];

/**
 * Google Gemini provider handler.
 * Fetches the live model list from Google's OpenAI-compatible endpoint,
 * then marks known free open-weight (Gemma) models.
 */
export const geminiHandler: ProviderHandler = {
    displayName: "Google Gemini",

    async fetchModels(
        apiKey = "",
        baseUrl = "https://generativelanguage.googleapis.com/v1beta/openai/v1"
    ): Promise<DiscoveredModel[]> {
        const models = await fetchOpenAICompatibleList(baseUrl, apiKey);
        const marked = markFreeModels(models, FREE_PATTERNS);
        return sortModels(marked);
    }
};
