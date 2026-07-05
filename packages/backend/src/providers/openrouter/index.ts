import {
    DiscoveredModel,
    ProviderHandler,
    sortModels
} from "../../ProviderHandler";

export const openrouterHandler: ProviderHandler = {
    displayName: "OpenRouter",

    async fetchModels(): Promise<DiscoveredModel[]> {
        const res = await fetch("https://openrouter.ai/api/v1/models", {
            headers: { "Accept": "application/json" },
            signal: AbortSignal.timeout(10000)
        });

        if (!res.ok) {
            throw new Error(`OpenRouter models API returned HTTP ${res.status}`);
        }

        const json = await res.json() as { data: any[] };

        const models: DiscoveredModel[] = json.data
            .filter((m: any) => m.id && m.pricing)
            .map((m: any) => {
                const prompt = parseFloat(m.pricing.prompt);
                const completion = parseFloat(m.pricing.completion);
                const hasPrice = !isNaN(prompt) && prompt >= 0 && !isNaN(completion) && completion >= 0;
                const isFree = hasPrice && prompt === 0 && completion === 0;

                return {
                    id: m.id as string,
                    name: (m.name || m.id) as string,
                    isFree,
                    promptPricePerM: hasPrice ? prompt * 1_000_000 : null,
                    completionPricePerM: hasPrice ? completion * 1_000_000 : null
                };
            });

        return sortModels(models);
    }
};
