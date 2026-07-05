import {
    DiscoveredModel,
    ProviderHandler,
    fetchOpenAICompatibleList,
    markFreeModels,
    sortModels
} from "../../ProviderHandler";

const FREE_PATTERNS: RegExp[] = [
    /^gemma/
];

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
