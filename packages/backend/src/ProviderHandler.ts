/**
 * Shape of a single discovered model entry returned by any provider handler.
 */
export interface DiscoveredModel {
    /** The model identifier used in API calls (e.g. "gpt-4o-mini"). */
    id: string;
    /** Human-readable model name. */
    name: string;
    /** Whether this model is free to use on this provider's own platform. */
    isFree: boolean;
    /** Input price in USD per million tokens, or null if unavailable. */
    promptPricePerM: number | null;
    /** Output price in USD per million tokens, or null if unavailable. */
    completionPricePerM: number | null;
}

/**
 * Contract that every provider handler must implement.
 */
export interface ProviderHandler {
    /** Human-readable display name of this provider. */
    displayName: string;
    /**
     * Returns available models for this provider.
     * Handlers may call a live API, return a hardcoded list, or both.
     * @param apiKey Optional API key for authenticated listing requests.
     * @param baseUrl Optional custom base URL override.
     */
    fetchModels(apiKey?: string, baseUrl?: string): Promise<DiscoveredModel[]>;
}

/**
 * Fetches a standard OpenAI-compatible /v1/models endpoint with Bearer auth.
 * Returns models with null pricing — handlers apply their own free markers on top.
 * @param baseUrl The provider base URL (without trailing slash).
 * @param apiKey The API key.
 */
export async function fetchOpenAICompatibleList(baseUrl: string, apiKey: string): Promise<DiscoveredModel[]> {
    const url = `${baseUrl.replace(/\/$/, "")}/models`;
    const res = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Accept": "application/json"
        },
        signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
        throw new Error(`Provider models API returned HTTP ${res.status}`);
    }

    const json = await res.json() as { data?: any[] };
    const data = json.data || [];

    return data
        .filter((m: any) => typeof m.id === "string")
        .map((m: any) => ({
            id: m.id as string,
            name: (m.name || m.id) as string,
            isFree: false,
            promptPricePerM: null,
            completionPricePerM: null
        }));
}

/**
 * Marks models as free based on a list of RegExp patterns tested against model IDs.
 * Does not touch pricing of models that don't match any pattern.
 * @param models The model list to process.
 * @param freePatterns RegExp patterns — any matching model is marked as free with price 0.
 */
export function markFreeModels(models: DiscoveredModel[], freePatterns: RegExp[]): DiscoveredModel[] {
    return models.map((m) => {
        if (freePatterns.some((p) => p.test(m.id))) {
            return { ...m, isFree: true, promptPricePerM: 0, completionPricePerM: 0 };
        }

        return m;
    });
}

/**
 * Sorts models so free ones appear first, then by insertion order.
 * @param models Models to sort (not mutated — returns a new array).
 */
export function sortModels(models: DiscoveredModel[]): DiscoveredModel[] {
    return [...models].sort((a, b) => {
        if (a.isFree && !b.isFree) {
            return -1;
        }

        if (!a.isFree && b.isFree) {
            return 1;
        }

        return 0;
    });
}
