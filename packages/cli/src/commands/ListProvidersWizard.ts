import * as clack from "@clack/prompts";
import { getPresets } from "@multiplexus/shared";
import { ApiClient } from "../ApiClient";
import { ensureCredentials } from "../config/LocalConfig";
import { t } from "../i18n/index";

/**
 * List all supported providers and their status
 * @param apiClient The API client
 */
export async function listProvidersWizard(apiClient: ApiClient) {
    await ensureCredentials(apiClient);
    clack.intro("Supported multiplexus Providers");

    const isPt = t.menu.welcome.includes("Bem-vindo");
    const lang = isPt ? "pt" : "en";

    const spinner = clack.spinner();
    spinner.start("Loading active keys from database...");

    let keys: any[] = [];
    try {
        keys = await apiClient.getProviderKeys();
        spinner.stop("Loaded successfully!");
    } catch (err: any) {
        spinner.stop("Unreachable database - displaying offline status.");
        clack.log.warn(`${t.common.error} ${err.message}`);
    }

    const allPresets = getPresets(lang);

    const list = allPresets.map(preset => {
        // A provider is configured and active ONLY if it has at least one key registered
        const isConfigured = keys.some(key => {
            const pObj = key.provider || key.Provider;
            return pObj && pObj.name === preset.value;
        });
        return {
            ...preset,
            isConfigured
        };
    });

    // Sort: configured providers first, then alphabetical by label
    list.sort((a, b) => {
        if (a.isConfigured && !b.isConfigured) return -1;
        if (!a.isConfigured && b.isConfigured) return 1;
        return a.label.localeCompare(b.label);
    });

    for (const item of list) {
        const symbol = item.isConfigured ? "🟢" : "⚪";
        const statusText = item.isConfigured 
            ? (isPt ? "CONFIGURADO/ATIVO" : "CONFIGURED/ACTIVE") 
            : (isPt ? "Não configurado" : "Not configured");
        
        clack.log.step(`${symbol} ${item.label} (${item.value}) — ${statusText}`);
    }

    clack.outro("");
}