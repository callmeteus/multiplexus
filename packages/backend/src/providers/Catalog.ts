import * as ovhAnonymous from "./ovh-anonymous";
import * as keylessAi from "./keyless-ai";
import { ProviderCatalogEntry } from "./CatalogTypes";

/** All API providers owned by the backend package. */
export const BACKEND_PROVIDER_CATALOG: ProviderCatalogEntry[] = [
    ovhAnonymous.catalog,
    keylessAi.catalog
];

/**
 * Returns backend provider presets localized for the CLI wizard.
 * @param lang The language code ("en" or "pt").
 */
export function getBackendProviderPresets(lang: string) {
    const isPt = lang.toLowerCase().includes("pt");
    const l = isPt ? "pt" : "en";

    return BACKEND_PROVIDER_CATALOG.map(entry => {
        const info = entry.i18n[l] || entry.i18n.en;
        return {
            value: entry.value,
            label: info.label,
            apiType: entry.apiType,
            baseUrl: entry.baseUrl,
            freeTier: info.freeTier,
            guide: info.guide,
            browserLogin: entry.browserLogin ?? false,
            requiresApiKey: entry.requiresApiKey ?? true,
            bootstrapRoutes: entry.bootstrapRoutes ?? []
        };
    });
}

/**
 * Returns catalog entries that ship default routes for local bootstrap.
 */
export function getBootstrapCatalog(): ProviderCatalogEntry[] {
    return BACKEND_PROVIDER_CATALOG.filter(e => (e.bootstrapRoutes?.length ?? 0) > 0);
}
