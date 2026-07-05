import {
    DiscoveredModel,
    ProviderHandler,
    fetchOpenAICompatibleList,
    markFreeModels,
    sortModels
} from "../../ProviderHandler";

const FREE_PATTERNS: RegExp[] = [
    /^open-/
];

export const mistralHandler: ProviderHandler = {
    displayName: "Mistral",

    async fetchModels(apiKey = "", baseUrl = "https://api.mistral.ai/v1"): Promise<DiscoveredModel[]> {
        const models = await fetchOpenAICompatibleList(baseUrl, apiKey);
        const marked = markFreeModels(models, FREE_PATTERNS);
        return sortModels(marked);
    }
};
