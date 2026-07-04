import * as clack from "@clack/prompts";
import * as fs from "fs";
import * as path from "path";
import { ApiClient } from "../ApiClient";
import { t } from "../i18n/index";

export interface LocalConfig {
    url: string;
    apiKey: string;
}

const configPath = path.join(process.cwd(), ".multiplexus-cli-config.json");

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

export function saveLocalConfig(config: LocalConfig) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4), "utf-8");
}

export async function ensureCredentials(apiClient: ApiClient) {
    if (apiClient.hasCredentials()) {
        return;
    }

    const localConfig = loadLocalConfig();
    if (localConfig) {
        apiClient.setCredentials(localConfig.url, localConfig.apiKey);
        return;
    }

    clack.intro(t.setup.title);
    clack.note(t.setup.keyWarn);

    const url = await clack.text({
        message: t.setup.urlPrompt,
        placeholder: "http://localhost:3000",
        defaultValue: "http://localhost:3000",
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
        message: t.setup.keyPrompt,
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
    apiClient.setCredentials(conf.url, conf.apiKey);
    clack.outro(t.setup.success);
}
