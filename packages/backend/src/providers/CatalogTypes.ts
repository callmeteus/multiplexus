import { ApiType } from "@multiplexus/shared";

/**
 * Default route created on local start for a provider catalog entry.
 */
export interface BootstrapRouteDef {
    routerModel: string;
    providerModel: string;
    priority?: number;
    weight?: number;
}

/**
 * Static catalog entry for a backend-managed API provider.
 */
export interface ProviderCatalogEntry {
    value: string;
    apiType: ApiType;
    baseUrl: string;
    requiresApiKey?: boolean;
    bootstrapRoutes?: BootstrapRouteDef[];
    browserLogin?: boolean;
    i18n: {
        en: {
            label: string;
            freeTier: string[];
            guide: {
                step1: string;
                step2: string;
                step3: string;
            } | null;
        };
        pt: {
            label: string;
            freeTier: string[];
            guide: {
                step1: string;
                step2: string;
                step3: string;
            } | null;
        };
    };
}
