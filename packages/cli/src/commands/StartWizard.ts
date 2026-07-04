import * as clack from "@clack/prompts";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { ApiClient } from "../ApiClient";
import { t } from "../i18n/index";
import { saveLocalConfig } from "../config/LocalConfig";

/**
 * The backend resolution.
 */
interface BackendResolution {
    projectRoot: string;
    backendDir: string;
    isCompiled: boolean;
}

/**
 * Resolves the backend directory.
 * @returns The backend resolution.
 */
function resolveBackend(): BackendResolution | null {
    // Search relative to process.cwd() (up to 4 parent directories)
    let currentDir = process.cwd();

    for (let i = 0; i < 4; i++) {
        const backendPath = path.join(currentDir, "packages", "backend");

        if (fs.existsSync(path.join(backendPath, "package.json"))) {
            const isCompiled = fs.existsSync(path.join(backendPath, "dist", "index.js"));
            return { projectRoot: currentDir, backendDir: backendPath, isCompiled };
        }

        const siblingPath = path.join(currentDir, "backend");

        if (fs.existsSync(path.join(siblingPath, "package.json"))) {
            const isCompiled = fs.existsSync(path.join(siblingPath, "dist", "index.js"));
            return { projectRoot: currentDir, backendDir: siblingPath, isCompiled };
        }

        const parentDir = path.dirname(currentDir);

        if (parentDir === currentDir) {
            break;
        }

        currentDir = parentDir;
    }

    // Then search upwards from the physical __dirname (for global/local npm links)
    let fileDir = __dirname;

    for (let i = 0; i < 6; i++) {
        const backendPath = path.join(fileDir, "packages", "backend");

        if (fs.existsSync(path.join(backendPath, "package.json"))) {
            const isCompiled = fs.existsSync(path.join(backendPath, "dist", "index.js"));
            return { projectRoot: fileDir, backendDir: backendPath, isCompiled };
        }

        const parentDir = path.dirname(fileDir);

        if (parentDir === fileDir) {
            break;
        }

        fileDir = parentDir;
    }

    return null;
}

/**
 * Waits for the server to be ready.
 * @param url The URL of the server.
 * @param maxAttempts The maximum number of attempts.
 * @returns True if the server is ready, false otherwise.
 */
async function waitServerReady(url: string, maxAttempts: number = 30): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 1000);

            // Node 18+: global fetch. Polyfill if needed for lower versions.
            // eslint-disable-next-line no-undef
            const res = await fetch(`${url}/health`, { signal: controller.signal });
            clearTimeout(id);

            if (res.ok) {
                const data = await res.json() as any;
                if (data.status === "ok") {
                    return true;
                }
            }
        } catch (_) {
            // Ignore error and try again
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return false;
}

/**
 * Reads the credentials file from the backend directory.
 * @param backendDir The backend directory.
 * @returns The credentials.
 */
function readCredentialsFile(backendDir: string): { apiKey: string; url: string } | null {
    const pathsToTry = [
        path.join(backendDir, "initial-credentials.data"),
        path.join(path.dirname(backendDir), "initial-credentials.data")
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
            } catch (_) {
                // Ignore
            }
        }
    }

    return null;
}

/**
 * Starts the backend wizard.
 * @param apiClient The API client.
 */
export async function startBackendWizard(apiClient: ApiClient) {
    clack.intro(t.start.searchingBackend);

    const resolution = resolveBackend();
    if (!resolution) {
        clack.log.error(t.start.backendNotFound);
        clack.outro("");
        return;
    }

    const spinner = clack.spinner();
    spinner.start(t.start.starting);

    let child;
    const isWindows = process.platform === "win32";

    if (resolution.isCompiled) {
        // Use pre-compiled production backend for faster startup
        const cmd = isWindows ? "node.exe" : "node";

        child = spawn(cmd, [path.join("dist", "index.js")], {
            cwd: resolution.backendDir,
            detached: true,
            stdio: "ignore"
        });
    } else {
        // Fallback to dev mode if not compiled
        const cmd = isWindows ? "npm.cmd" : "npm";

        child = spawn(cmd, ["run", "dev"], {
            cwd: resolution.backendDir,
            detached: true,
            stdio: "ignore"
        });
    }

    child.unref();

    spinner.message(t.start.waitingReady);

    const url = "http://localhost:3000";
    const isReady = await waitServerReady(url);

    if (!isReady) {
        spinner.stop("Backend failed to respond on port 3000.");
        clack.log.error("Could not establish connection with router backend.");
        clack.outro("");
        return;
    }

    spinner.message("Loading router administrative credentials...");

    // Read generated credentials file from backend run
    const creds = readCredentialsFile(resolution.backendDir);
    if (creds) {
        saveLocalConfig({
            url: creds.url,
            apiKey: creds.apiKey
        });

        apiClient.setCredentials(creds.url, creds.apiKey);
        spinner.stop(t.start.ready);
        clack.log.success(t.start.credentialsLoaded);
    } else {
        spinner.stop(t.start.ready);
        clack.log.warn("Router server is online, but could not fetch initial-credentials.data. Please configure manually.");
    }

    clack.outro("");
}