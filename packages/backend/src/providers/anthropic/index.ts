import { DiscoveredModel, ProviderHandler, sortModels } from "../../ProviderHandler";

const MODELS: DiscoveredModel[] = sortModels([
    { id: "claude-opus-4-5",           name: "Claude Opus 4.5",         isFree: false, promptPricePerM: null, completionPricePerM: null },
    { id: "claude-opus-4-5-fast",      name: "Claude Opus 4.5 (Fast)",  isFree: false, promptPricePerM: null, completionPricePerM: null },
    { id: "claude-sonnet-4-5",         name: "Claude Sonnet 4.5",       isFree: false, promptPricePerM: null, completionPricePerM: null },
    { id: "claude-haiku-3-5",          name: "Claude Haiku 3.5",        isFree: false, promptPricePerM: null, completionPricePerM: null },
    { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet",      isFree: false, promptPricePerM: null, completionPricePerM: null },
    { id: "claude-3-5-haiku-20241022",  name: "Claude 3.5 Haiku",       isFree: false, promptPricePerM: null, completionPricePerM: null },
    { id: "claude-3-opus-20240229",    name: "Claude 3 Opus",           isFree: false, promptPricePerM: null, completionPricePerM: null },
    { id: "claude-3-haiku-20240307",   name: "Claude 3 Haiku",          isFree: false, promptPricePerM: null, completionPricePerM: null }
]);

export const anthropicHandler: ProviderHandler = {
    displayName: "Anthropic",

    async fetchModels(): Promise<DiscoveredModel[]> {
        return MODELS;
    }
};

export { AnthropicProvider } from "./executor";
