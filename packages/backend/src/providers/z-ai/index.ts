import {
    DiscoveredModel,
    ProviderHandler,
    fetchOpenAICompatibleList,
    markFreeModels,
    sortModels
} from "../../ProviderHandler";

const FREE_PATTERNS: RegExp[] = [
    /^glm-4-flash$/
];

export const zaiHandler: ProviderHandler = {
    displayName: "Z.ai",

    async fetchModels(apiKey = "", baseUrl = "https://api.z.ai/v1"): Promise<DiscoveredModel[]> {
        const models = await fetchOpenAICompatibleList(baseUrl, apiKey);
        const marked = markFreeModels(models, FREE_PATTERNS);
        return sortModels(marked);
    }
};
