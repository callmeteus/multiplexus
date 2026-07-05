import { NO_API_KEY_MARKER } from "@multiplexus/shared";
import { ApiClient } from "../ApiClient";

/**
 * Ensures providers with bootstrapRoutes exist on local start.
 * Idempotent — safe to call on every `mpx start`.
 * @param apiClient The authenticated admin API client.
 */
export async function ensureLocalBootstrap(apiClient: ApiClient): Promise<void> {
    const presets = await apiClient.getProviderPresets();
    const bootstrapPresets = presets.filter((p: any) => (p.bootstrapRoutes?.length ?? 0) > 0);
    const providers = await apiClient.getProviders();
    const keys = await apiClient.getProviderKeys();
    const routes = await apiClient.getModelRoutes();

    for (const preset of bootstrapPresets) {
        let provider = providers.find((p: any) => p.name === preset.value);

        if (!provider) {
            provider = await apiClient.createProvider(preset.value, preset.apiType, preset.baseUrl);
            providers.push(provider);
        }

        const hasKey = keys.some((k: any) => k.providerId === provider.id);
        if (!hasKey) {
            const keyValue = preset.requiresApiKey === false ? NO_API_KEY_MARKER : "";
            if (!keyValue) {
                continue;
            }

            const created = await apiClient.addProviderKey(
                provider.id,
                keyValue,
                1,
                preset.requiresApiKey === false ? "no-api-key" : "bootstrap"
            );
            keys.push(created);
        }

        for (const route of preset.bootstrapRoutes ?? []) {
            const exists = routes.some((r: any) =>
                r.routerModel === route.routerModel
                && r.providerId === provider.id
                && r.providerModel === route.providerModel
            );

            if (!exists) {
                const created = await apiClient.createModelRoute(
                    route.routerModel,
                    provider.id,
                    route.providerModel,
                    route.priority ?? 0,
                    route.weight ?? 1
                );
                routes.push(created);
            }
        }
    }
}
