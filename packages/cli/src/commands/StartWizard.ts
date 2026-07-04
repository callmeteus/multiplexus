import * as clack from "@clack/prompts";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { ApiClient } from "../ApiClient";
import { t } from "../i18n/index";
import { saveLocalConfig } from "../config/LocalConfig";
import {
    clearServerPid,
    isProcessAlive,
    killServerProcess,
    loadServerPid,
    saveServerPid
} from "../config/ServerProcess";

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

function resolveTsxCli(projectRoot: string): string | null {
    const candidates = [
        path.join(projectRoot, "node_modules", "tsx", "dist", "cli.mjs"),
        path.join(projectRoot, "packages", "backend", "node_modules", "tsx", "dist", "cli.mjs")
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    return null;
}

async function checkServerReady(url: string): Promise<boolean> {
    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 1000);

        // eslint-disable-next-line no-undef
        const res = await fetch(`${url}/health`, { signal: controller.signal });
        clearTimeout(id);

        if (res.ok) {
            const data = await res.json() as { status?: string };
            return data.status === "ok";
        }
    } catch (_) {
        // Ignore error
    }

    return false;
}

/**
 * Waits for the server to be ready.
 * @param url The URL of the server.
 * @param maxAttempts The maximum number of attempts.
 * @returns True if the server is ready, false otherwise.
 */
async function waitServerReady(url: string, maxAttempts: number = 30): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
        if (await checkServerReady(url)) {
            return true;
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

    const url = "http://localhost:3000";

    if (await checkServerReady(url)) {
        const creds = readCredentialsFile(resolution.backendDir);
        if (creds) {
            saveLocalConfig({
                url: creds.url,
                apiKey: creds.apiKey
            });
            apiClient.setCredentials(creds.url, creds.apiKey);
        }

        clack.log.success(t.start.alreadyRunning);
        if (creds) {
            clack.log.success(t.start.credentialsLoaded);
        }
        clack.outro("");
        return;
    }

    const spinner = clack.spinner();
    spinner.start(t.start.starting);

    const isWindows = process.platform === "win32";
    const logFile = path.join(resolution.backendDir, "multiplexus-backend.log");
    const logFd = fs.openSync(logFile, "a");
    const tsxCli = resolveTsxCli(resolution.projectRoot);

    if (!tsxCli) {
        spinner.stop("Could not find a runnable backend entrypoint.");
        clack.log.error("tsx is not installed. Run npm install in the multiplexus project root.");
        clack.outro("");
        return;
    }

    const cmd = isWindows ? "node.exe" : "node";
    const args = [tsxCli, "src/index.ts"];

    const child = spawn(cmd, args, {
        cwd: resolution.backendDir,
        detached: true,
        stdio: ["ignore", logFd, logFd],
        windowsHide: true
    });

    if (!child.pid) {
        spinner.stop(t.start.failed);
        clack.log.error("Could not start backend process.");
        clack.outro("");
        return;
    }

    saveServerPid(resolution.backendDir, child.pid);
    child.unref();

    spinner.message(t.start.waitingReady);

    const isReady = await waitServerReady(url);

    if (!isReady) {
        killServerProcess(child.pid);
        clearServerPid(resolution.backendDir);
        spinner.stop(t.start.failed);
        clack.log.error("Could not establish connection with router backend.");
        clack.log.warn(`Check backend logs at: ${logFile}`);
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

/**
 * Stops the backend server started by mp start.
 */
export async function stopBackendWizard() {
    clack.intro(t.stop.searchingBackend);

    const resolution = resolveBackend();
    if (!resolution) {
        clack.log.error(t.start.backendNotFound);
        clack.outro("");
        return;
    }

    const url = "http://localhost:3000";
    const pid = loadServerPid(resolution.backendDir);
    const serverUp = await checkServerReady(url);

    if (!pid) {
        if (serverUp) {
            clack.log.warn(t.stop.runningWithoutPid);
        } else {
            clack.log.warn(t.stop.notRunning);
        }
        clack.outro("");
        return;
    }

    if (!isProcessAlive(pid)) {
        clearServerPid(resolution.backendDir);

        if (serverUp) {
            clack.log.warn(t.stop.runningWithoutPid);
        } else {
            clack.log.warn(t.stop.stalePid);
        }
        clack.outro("");
        return;
    }

    const spinner = clack.spinner();
    spinner.start(t.stop.stopping);

    const killed = killServerProcess(pid);
    clearServerPid(resolution.backendDir);

    if (!killed) {
        spinner.stop(t.stop.failed);
        clack.log.error(t.stop.failed);
        clack.outro("");
        return;
    }

    for (let i = 0; i < 10; i++) {
        if (!(await checkServerReady(url))) {
            spinner.stop(t.stop.stopped);
            clack.outro("");
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 500));
    }

    spinner.stop(t.stop.failed);
    clack.log.warn(t.stop.stillResponding);
    clack.outro("");
}