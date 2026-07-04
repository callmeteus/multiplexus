import * as clack from "@clack/prompts";
import * as fs from "fs";
import * as path from "path";
import { ApiClient } from "../ApiClient";
import { readAdminCredentialsFile, resolveBackend } from "./BackendResolution";
import { t } from "../i18n/index";

export interface LocalConfig {
    url: string;
    apiKey: string;
}

const configPath = path.join(process.cwd(), ".multiplexus-cli-config.json");

/**
 * Loads the local config.
 * @returns The local config.
 */
export function loadLocalConfig(): LocalConfig | null {
    if (fs.existsSync(configPath)) {
        try {
            return JSON.parse(fs.readFileSync(configPath, "utf-8"));
        } catch (e) {
            // ignore
        }
    }
    return null;
}

/**
 * Saves the local config.
 * @param config The local config.
 */
export function saveLocalConfig(config: LocalConfig) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4), "utf-8");
}

/**
 * Loads the credentials from the project.
 * @returns The credentials.
 */
function loadCredentialsFromProject(): LocalConfig | null {
    const resolution = resolveBackend();
    if (!resolution) {
        return null;
    }

    return readAdminCredentialsFile(resolution.backendDir);
}

/**
 * Applies the config to the API client.
 * @param apiClient The API client.
 * @param config The local config.
 */
function applyConfig(apiClient: ApiClient, config: LocalConfig) {
    apiClient.setCredentials(config.url, config.apiKey);
}

/**
 * Loads the stored credentials.
 * @param apiClient The API client.
 */
function loadStoredCredentials(apiClient: ApiClient): void {
    if (process.env.MULTIPLEXUS_ADMIN_KEY) {
        applyConfig(apiClient, {
            url: process.env.MULTIPLEXUS_URL || "http://localhost:3000",
            apiKey: process.env.MULTIPLEXUS_ADMIN_KEY
        });
        return;
    }

    const localConfig = loadLocalConfig();
    if (localConfig) {
        applyConfig(apiClient, localConfig);
        return;
    }

    const projectCreds = loadCredentialsFromProject();
    if (projectCreds) {
        applyConfig(apiClient, projectCreds);
        saveLocalConfig(projectCreds);
    }
}

/**
 * Prompts the user for credentials.
 * @param apiClient The API client.
 * @param adminOnly Whether only admin credentials are required.
 */
async function promptCredentials(apiClient: ApiClient, adminOnly: boolean) {
    if (!adminOnly) {
        clack.intro(t.setup.title);
    }

    clack.note(adminOnly ? t.setup.adminKeyWarn : t.setup.keyWarn);

    const url = await clack.text({
        message: t.setup.urlPrompt,
        placeholder: "http://localhost:3000",
        defaultValue: apiClient.getBaseUrl() || "http://localhost:3000",
        validate(value) {
            if (!value) {
                return t.setup.urlRequired;
            }
        }
    });

    if (clack.isCancel(url)) {
        process.exit(0);
    }

    const apiKey = await clack.text({
        message: adminOnly ? t.setup.adminKeyPrompt : t.setup.keyPrompt,
        placeholder: "sk-mux-...",
        validate(value) {
            if (!value) {
                return t.setup.keyRequired;
            }
        }
    });

    if (clack.isCancel(apiKey)) {
        process.exit(0);
    }

    const conf: LocalConfig = {
        url: url as string,
        apiKey: apiKey as string
    };

    saveLocalConfig(conf);
    applyConfig(apiClient, conf);

    if (!adminOnly) {
        clack.outro(t.setup.success);
    }
}

/**
 * Refreshes the admin credentials.
 * @param apiClient The API client.
 * @returns True if the admin credentials were refreshed, false otherwise.
 */
async function refreshAdminCredentials(apiClient: ApiClient): Promise<boolean> {
    const projectCreds = loadCredentialsFromProject();
    if (!projectCreds) {
        return false;
    }

    applyConfig(apiClient, projectCreds);
    saveLocalConfig(projectCreds);

    return apiClient.canAccessAdminApi();
}

/**
 * Ensures the credentials.
 * @param apiClient The API client.
 * @param options The options.
 */
export async function ensureCredentials(
    apiClient: ApiClient,
    options?: { requireAdmin?: boolean }
) {
    loadStoredCredentials(apiClient);

    if (!apiClient.hasCredentials()) {
        await promptCredentials(apiClient, !!options?.requireAdmin);
    }

    if (!options?.requireAdmin) {
        return;
    }

    if (await apiClient.canAccessAdminApi()) {
        return;
    }

    if (await refreshAdminCredentials(apiClient)) {
        clack.log.success(t.setup.adminKeyRefreshed);
        return;
    }

    clack.log.warn(t.setup.adminKeyInvalid);
    apiClient.setCredentials(apiClient.getBaseUrl(), "");
    await promptCredentials(apiClient, true);

    if (!(await apiClient.canAccessAdminApi())) {
        clack.log.error(t.setup.adminKeyRequired);
        process.exit(1);
    }

    clack.outro(t.setup.success);
}
