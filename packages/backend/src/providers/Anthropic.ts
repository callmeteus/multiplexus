import { DiscoveredModel, ProviderHandler, sortModels } from "../ProviderHandler";

/**
 * Hardcoded model list for Anthropic.
 * Anthropic does not expose a /v1/models listing endpoint, so the list is maintained here.
 * Pricing is not hardcoded — check https://www.anthropic.com/pricing for current rates.
 * No Anthropic models are free via the API.
 */
const MODELS: DiscoveredModel[] = sortModels([
    // Claude 4 / 4.x series
    { id: "claude-opus-4-5",           name: "Claude Opus 4.5",         isFree: false, promptPricePerM: null, completionPricePerM: null },
    { id: "claude-opus-4-5-fast",      name: "Claude Opus 4.5 (Fast)",  isFree: false, promptPricePerM: null, completionPricePerM: null },
    { id: "claude-sonnet-4-5",         name: "Claude Sonnet 4.5",       isFree: false, promptPricePerM: null, completionPricePerM: null },
    { id: "claude-haiku-3-5",          name: "Claude Haiku 3.5",        isFree: false, promptPricePerM: null, completionPricePerM: null },
    // Claude 3.5 series
    { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet",      isFree: false, promptPricePerM: null, completionPricePerM: null },
    { id: "claude-3-5-haiku-20241022",  name: "Claude 3.5 Haiku",       isFree: false, promptPricePerM: null, completionPricePerM: null },
    // Claude 3 series (legacy)
    { id: "claude-3-opus-20240229",    name: "Claude 3 Opus",           isFree: false, promptPricePerM: null, completionPricePerM: null },
    { id: "claude-3-haiku-20240307",   name: "Claude 3 Haiku",          isFree: false, promptPricePerM: null, completionPricePerM: null }
]);

/**
 * Anthropic provider handler.
 * Returns a hardcoded model list since Anthropic has no public model listing API.
 */
export const anthropicHandler: ProviderHandler = {
    displayName: "Anthropic",

    async fetchModels(): Promise<DiscoveredModel[]> {
        return MODELS;
    }
};
