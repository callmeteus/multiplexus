import * as clack from "@clack/prompts";
import chalk from "chalk";
import { getPresets } from "@multiplexus/shared";
import { ApiClient } from "../ApiClient";
import { ensureCredentials } from "../config/LocalConfig";
import { t, currentLang } from "../i18n/index";

/**
 * List all supported providers and their status
 * @param apiClient The API client
 */
export async function listProvidersWizard(apiClient: ApiClient) {
    await ensureCredentials(apiClient);
    clack.intro(t.provider.listTitle);

    const lang = currentLang;

    const spinner = clack.spinner();
    spinner.start(t.provider.loadingKeys);

    let keys: any[] = [];
    try {
        keys = await apiClient.getProviderKeys();
        spinner.stop(t.provider.loadedSuccess);
    } catch (err: any) {
        spinner.stop(t.provider.offlineStatus);
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
        const symbol = item.isConfigured ? chalk.green("[*]") : chalk.gray("[ ]");
        const statusText = item.isConfigured 
            ? t.provider.statusConfigured 
            : t.provider.statusNotConfigured;
        
        clack.log.step(`${symbol} ${item.label} (${item.value}) - ${statusText}`);
    }

    clack.outro("");
}