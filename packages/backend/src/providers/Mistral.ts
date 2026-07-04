import {
    DiscoveredModel,
    ProviderHandler,
    fetchOpenAICompatibleList,
    markFreeModels,
    sortModels
} from "../ProviderHandler";

/**
 * Mistral models that are free on La Plateforme (open-weight, no API cost).
 * These are the only models where isFree is hardcoded — paid model pricing
 * is not hardcoded since it changes. Check https://mistral.ai/technology/#pricing
 */
const FREE_PATTERNS: RegExp[] = [
    /^open-/ // open-mistral-7b, open-mistral-nemo, open-codestral-mamba, etc.
];

/**
 * Mistral provider handler.
 * Fetches the live model list from Mistral's OpenAI-compatible API,
 * then marks known open-weight (free) models.
 */
export const mistralHandler: ProviderHandler = {
    displayName: "Mistral",

    async fetchModels(apiKey = "", baseUrl = "https://api.mistral.ai/v1"): Promise<DiscoveredModel[]> {
        const models = await fetchOpenAICompatibleList(baseUrl, apiKey);
        const marked = markFreeModels(models, FREE_PATTERNS);
        return sortModels(marked);
    }
};
