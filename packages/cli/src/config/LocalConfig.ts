import * as clack from "@clack/prompts";
import * as fs from "fs";
import * as path from "path";
import { ApiClient } from "../ApiClient";
import { readAdminCredentialsFile, resolveBackend } from "./BackendResolution";
import { t } from "../i18n/index";

/**
 * The persisted local CLI configuration.
 */
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
 * Applies project admin credentials when they work against the local server.
 * @param apiClient The API client.
 * @param backendDir The backend directory.
 * @returns True when valid admin credentials were saved locally.
 */
export async function syncAdminCredentials(
    apiClient: ApiClient,
    backendDir?: string
): Promise<boolean> {
    const creds = backendDir
        ? readAdminCredentialsFile(backendDir)
        : loadCredentialsFromProject();

    if (!creds) {
        return false;
    }

    applyConfig(apiClient, creds);

    if (!(await apiClient.canAccessAdminApi())) {
        return false;
    }

    saveLocalConfig(creds);
    return true;
}

/**
 * Applies credentials from the local multiplexus project.
 * @param apiClient The API client.
 */
function applyProjectCredentials(apiClient: ApiClient) {
    const projectCreds = loadCredentialsFromProject();
    if (projectCreds) {
        applyConfig(apiClient, projectCreds);
    }
}

/**
 * Ensures the credentials.
 * @param apiClient The API client.
 * @param options Optional flags; set requireAdmin to force admin API access.
 */
export async function ensureCredentials(
    apiClient: ApiClient,
    options?: { requireAdmin?: boolean }
) {
    const requireAdmin = !!options?.requireAdmin;

    if (process.env.MULTIPLEXUS_ADMIN_KEY) {
        applyConfig(apiClient, {
            url: process.env.MULTIPLEXUS_URL || "http://localhost:3000",
            apiKey: process.env.MULTIPLEXUS_ADMIN_KEY
        });
    } else if (requireAdmin && resolveBackend()) {
        applyProjectCredentials(apiClient);
    } else {
        const localConfig = loadLocalConfig();
        if (localConfig) {
            applyConfig(apiClient, localConfig);
        } else {
            applyProjectCredentials(apiClient);
        }
    }

    if (!apiClient.hasCredentials()) {
        await promptCredentials(apiClient, requireAdmin);
    }

    if (!requireAdmin) {
        return;
    }

    if (await apiClient.canAccessAdminApi()) {
        saveLocalConfig({
            url: apiClient.getBaseUrl(),
            apiKey: apiClient.getAdminKey()
        });
        return;
    }

    if (await syncAdminCredentials(apiClient)) {
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
