import { ApiType } from "@multiplexus/shared";
import { DiscoveredModel, ProviderHandler, sortModels } from "../../ProviderHandler";
import { ProviderCatalogEntry } from "../CatalogTypes";

export const catalog: ProviderCatalogEntry = {
    value: "keylessai",
    apiType: ApiType.OPENAI,
    baseUrl: "https://keylessai.thryx.workers.dev/v1",
    requiresApiKey: false,
    bootstrapRoutes: [
        { routerModel: "free", providerModel: "openai-fast", priority: 1, weight: 1 }
    ],
    i18n: {
        en: {
            label: "KeylessAI",
            freeTier: [
                "No signup or API key required",
                "Aggregates public Pollinations and ApiAirforce endpoints",
                "Automatic failover between upstreams"
            ],
            guide: null
        },
        pt: {
            label: "KeylessAI",
            freeTier: [
                "Sem cadastro nem chave de API",
                "Agrega endpoints públicos Pollinations e ApiAirforce",
                "Failover automático entre upstreams"
            ],
            guide: null
        }
    }
};

const FALLBACK_MODELS: DiscoveredModel[] = [
    { id: "openai-fast", name: "openai-fast", isFree: true, promptPricePerM: 0, completionPricePerM: 0 },
    { id: "grok-4.1-mini:free", name: "grok-4.1-mini:free", isFree: true, promptPricePerM: 0, completionPricePerM: 0 }
];

export const handler: ProviderHandler = {
    displayName: "KeylessAI",

    async fetchModels(): Promise<DiscoveredModel[]> {
        return sortModels(FALLBACK_MODELS);
    }
};
