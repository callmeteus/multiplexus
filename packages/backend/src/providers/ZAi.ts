import {
    DiscoveredModel,
    ProviderHandler,
    fetchOpenAICompatibleList,
    markFreeModels,
    sortModels
} from "../ProviderHandler";

/**
 * Z.ai models that are free on their platform.
 * GLM-4-Flash is documented as free on Z.ai (https://z.ai).
 * Paid model pricing is not hardcoded - check the Z.ai pricing page for current rates.
 */
const FREE_PATTERNS: RegExp[] = [
    /^glm-4-flash$/  // GLM-4-Flash - explicitly documented as free
];

/**
 * Z.ai provider handler.
 * Fetches the live model list from Z.ai's OpenAI-compatible API,
 * then marks known free models.
 */
export const zaiHandler: ProviderHandler = {
    displayName: "Z.ai",

    async fetchModels(apiKey = "", baseUrl = "https://api.z.ai/v1"): Promise<DiscoveredModel[]> {
        const models = await fetchOpenAICompatibleList(baseUrl, apiKey);
        const marked = markFreeModels(models, FREE_PATTERNS);
        return sortModels(marked);
    }
};
