import * as clack from "@clack/prompts";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { ApiClient } from "../ApiClient";
import { t } from "../i18n/index";
import { saveLocalConfig } from "../config/LocalConfig";

function findBackendDir(): string | null {
    let currentDir = process.cwd();
    for (let i = 0; i < 4; i++) {
        const possiblePath = path.join(currentDir, "packages", "backend");
        if (fs.existsSync(path.join(possiblePath, "package.json"))) {
            return currentDir;
        }
        const siblingPath = path.join(currentDir, "backend");
        if (fs.existsSync(path.join(siblingPath, "package.json"))) {
            return currentDir;
        }
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) {
            break;
        }
        currentDir = parentDir;
    }
    return null;
}

async function waitServerReady(url: string, maxAttempts: number = 30): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 1000);
            const res = await fetch(`${url}/health`, { signal: controller.signal });
            clearTimeout(id);
            if (res.ok) {
                const data = await res.json() as any;
                if (data.status === "ok") {
                    return true;
                }
            }
        } catch (e) {
            // Fail silent
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return false;
}

function readCredentialsFile(projectRoot: string): { apiKey: string; url: string } | null {
    const pathsToTry = [
        path.join(projectRoot, "initial-credentials.data"),
        path.join(projectRoot, "packages", "backend", "initial-credentials.data")
    ];
    for (const filePath of pathsToTry) {
        if (fs.existsSync(filePath)) {
            try {
                const content = fs.readFileSync(filePath, "utf-8");
                const keyMatch = content.match(/Admin API Key:\s+(sk-mux-[a-f0-9]+)/);
                const urlMatch = content.match(/Router URL:\s+(http\S+)/);
                if (keyMatch) {
                    return {
                        apiKey: keyMatch[1],
                        url: urlMatch ? urlMatch[1] : "http://localhost:3000"
                    };
                }
            } catch (e) {
                // ignore
            }
        }
    }
    return null;
}

export async function startBackendWizard(apiClient: ApiClient) {
    clack.intro(t.start.searchingBackend);
    
    const projectRoot = findBackendDir();
    if (!projectRoot) {
        clack.log.error(t.start.backendNotFound);
        clack.outro("");
        return;
    }

    const spinner = clack.spinner();
    spinner.start(t.start.starting);

    const isWindows = process.platform === "win32";
    const cmd = isWindows ? "npm.cmd" : "npm";
    
    const child = spawn(cmd, ["run", "dev", "-w", "packages/backend"], {
        cwd: projectRoot,
        detached: true,
        stdio: "ignore"
    });
    
    child.unref();

    spinner.message(t.start.waitingReady);
    
    const isReady = await waitServerReady("http://localhost:3000");
    if (!isReady) {
        spinner.stop("Backend failed to respond on port 3000 within timeout.");
        return;
    }

    spinner.stop(t.start.ready);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const creds = readCredentialsFile(projectRoot);
    if (creds) {
        saveLocalConfig({
            url: creds.url,
            apiKey: creds.apiKey
        });
        apiClient.setCredentials(creds.url, creds.apiKey);
        clack.log.success(t.start.credentialsLoaded);
    } else {
        clack.log.warn(t.start.credentialsMissing);
    }

    const localUrl = creds ? creds.url : "http://localhost:3000";
    clack.note(
        [
            `${t.start.baseUrl}  ${localUrl}`,
            `${t.start.apiKey}  <client-key>`,
            "",
            ...t.start.tools.map((tool: any) => `* ${tool.name}:\n  ${tool.instruction}`),
            "",
            `💡 Tip: You can toggle Caveman Mode (for 70%+ token savings) on any client key by running: 'mp plugin toggle'`
        ].join("\n"),
        t.start.instructionsTitle
    );

    clack.outro("");
}