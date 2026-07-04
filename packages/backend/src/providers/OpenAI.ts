import { DiscoveredModel, ProviderHandler, fetchOpenAICompatibleList, sortModels } from "../ProviderHandler";

/**
 * OpenAI provider handler.
 * Fetches the live model list from the OpenAI API.
 * OpenAI does not have free public API models — pricing is not hardcoded
 * since it changes frequently. Check https://openai.com/api/pricing for current rates.
 */
export const openaiHandler: ProviderHandler = {
    displayName: "OpenAI",

    async fetchModels(apiKey = "", baseUrl = "https://api.openai.com/v1"): Promise<DiscoveredModel[]> {
        const models = await fetchOpenAICompatibleList(baseUrl, apiKey);
        return sortModels(models);
    }
};
