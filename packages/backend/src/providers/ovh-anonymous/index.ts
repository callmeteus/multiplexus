import { ApiType, isKeylessApiKey } from "@multiplexus/shared";
import {
    DiscoveredModel,
    ProviderHandler,
    fetchOpenAICompatibleList,
    fetchOpenAICompatibleListUnauthenticated,
    sortModels
} from "../../ProviderHandler";
import { ProviderCatalogEntry } from "../CatalogTypes";

export const catalog: ProviderCatalogEntry = {
    value: "ovh_anonymous",
    apiType: ApiType.OPENAI,
    baseUrl: "https://oai.endpoints.kepler.ai.cloud.ovh.net/v1",
    requiresApiKey: false,
    bootstrapRoutes: [
        { routerModel: "free", providerModel: "gpt-oss-20b", priority: 0, weight: 3 },
        { routerModel: "free", providerModel: "Qwen3.5-9B", priority: 0, weight: 2 },
        { routerModel: "gpt-4o", providerModel: "gpt-oss-120b", priority: 0, weight: 1 },
        { routerModel: "gpt-4o-mini", providerModel: "gpt-oss-20b", priority: 0, weight: 1 }
    ],
    i18n: {
        en: {
            label: "OVHcloud AI (anonymous)",
            freeTier: [
                "No signup or API key required",
                "20+ open-weight models (2 RPM per IP)",
                "Hosted in EU data centers"
            ],
            guide: null
        },
        pt: {
            label: "OVHcloud AI (anônimo)",
            freeTier: [
                "Sem cadastro nem chave de API",
                "20+ modelos open-weight (2 RPM por IP)",
                "Hospedado em datacenters na UE"
            ],
            guide: null
        }
    }
};

export const handler: ProviderHandler = {
    displayName: "OVHcloud AI",

    async fetchModels(apiKey = "", baseUrl = catalog.baseUrl): Promise<DiscoveredModel[]> {
        const models = isKeylessApiKey(apiKey)
            ? await fetchOpenAICompatibleListUnauthenticated(baseUrl)
            : await fetchOpenAICompatibleList(baseUrl, apiKey);

        return sortModels(models.map(m => ({ ...m, isFree: true, promptPricePerM: 0, completionPricePerM: 0 })));
    }
};
