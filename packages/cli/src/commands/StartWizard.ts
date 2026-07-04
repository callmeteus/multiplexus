import * as clack from "@clack/prompts";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { ApiClient } from "../ApiClient";
import { t } from "../i18n/index";
import { saveLocalConfig } from "../config/LocalConfig";
import { readAdminCredentialsFile, resolveBackend } from "../config/BackendResolution";
import {
    clearServerPid,
    findListeningPid,
    isProcessAlive,
    killServerProcess,
    loadServerPid,
    saveServerPid
} from "../config/ServerProcess";

/**
 * Resolves the tsx CLI path.
 */
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

function getBackendLogsDir(backendDir: string): string {
    return path.join(backendDir, "logs");
}

function getSpawnLogFile(backendDir: string): string {
    const logsDir = getBackendLogsDir(backendDir);
    fs.mkdirSync(logsDir, { recursive: true });
    return path.join(logsDir, "spawn.log");
}

function getBackendLogHint(backendDir: string): string {
    const today = new Date().toISOString().slice(0, 10);
    return path.join(getBackendLogsDir(backendDir), `combined-${today}.log`);
}

function quotePowerShell(value: string): string {
    return `'${value.replace(/'/g, "''")}'`;
}

function createWindowsLauncher(backendDir: string, tsxCli: string, logFile: string): string {
    const launcherPath = path.join(getBackendLogsDir(backendDir), "start-backend.cmd");
    const launcherContent = [
        "@echo off",
        `cd /d "${backendDir}"`,
        `"${process.execPath}" "${tsxCli}" src/index.ts 1>>"${logFile}" 2>&1`
    ].join("\r\n");

    fs.writeFileSync(launcherPath, launcherContent, "utf-8");
    return launcherPath;
}

function spawnBackendProcess(backendDir: string, tsxCli: string, logFile: string) {
    if (process.platform === "win32") {
        const launcherPath = createWindowsLauncher(backendDir, tsxCli, logFile);
        const command = [
            "Start-Process",
            "-FilePath 'cmd.exe'",
            `-ArgumentList ${quotePowerShell(`/d /s /c ""${launcherPath}""`)}`,
            `-WorkingDirectory ${quotePowerShell(backendDir)}`,
            "-WindowStyle Hidden"
        ].join(" ");

        return spawn("powershell.exe", [
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-WindowStyle",
            "Hidden",
            "-Command",
            command
        ], {
            cwd: backendDir,
            stdio: "ignore",
            windowsHide: true
        });
    }

    const logFd = fs.openSync(logFile, "a");

    return spawn(process.execPath, [tsxCli, "src/index.ts"], {
        cwd: backendDir,
        detached: true,
        stdio: ["ignore", logFd, logFd],
        windowsHide: true
    });
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
    return readAdminCredentialsFile(backendDir);
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

    const spawnLogFile = getSpawnLogFile(resolution.backendDir);
    const tsxCli = resolveTsxCli(resolution.projectRoot);

    if (!tsxCli) {
        spinner.stop("Could not find a runnable backend entrypoint.");
        clack.log.error("tsx is not installed. Run npm install in the multiplexus project root.");
        clack.outro("");
        return;
    }

    const child = spawnBackendProcess(resolution.backendDir, tsxCli, spawnLogFile);

    if (!child.pid) {
        spinner.stop(t.start.failed);
        clack.log.error("Could not start backend process.");
        clack.outro("");
        return;
    }

    child.unref();

    spinner.message(t.start.waitingReady);

    const isReady = await waitServerReady(url);

    if (!isReady) {
        const failedPid = findListeningPid(3000) ?? child.pid;
        killServerProcess(failedPid);
        clearServerPid(resolution.backendDir);
        spinner.stop(t.start.failed);
        clack.log.error("Could not establish connection with router backend.");
        clack.log.warn(t.start.checkLogs.replace("{spawnLog}", spawnLogFile).replace("{combinedLog}", getBackendLogHint(resolution.backendDir)));
        clack.outro("");
        return;
    }

    const runningPid = findListeningPid(3000);
    if (runningPid) {
        saveServerPid(resolution.backendDir, runningPid);
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
 * Resolves the PID of a running multiplexus server.
 * @param backendDir The backend directory.
 * @param serverUp Whether the server is up.
 * @returns The PID of the running server.
 */
function resolveRunningServerPid(backendDir: string, serverUp: boolean): number | null {
    const savedPid = loadServerPid(backendDir);

    if (savedPid && isProcessAlive(savedPid)) {
        return savedPid;
    }

    if (!serverUp) {
        return null;
    }

    return findListeningPid(3000);
}

/**
 * Waits for the server to be down.
 * @param url The URL of the server.
 * @param maxAttempts The maximum number of attempts.
 * @returns True if the server is down, false otherwise.
 */
async function waitForServerDown(url: string, maxAttempts: number = 10): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
        if (!(await checkServerReady(url))) {
            return true;
        }

        await new Promise(resolve => setTimeout(resolve, 500));
    }

    return false;
}

/**
 * Stops the multiplexus backend server on port 3000.
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
    const serverUp = await checkServerReady(url);

    if (!serverUp) {
        clearServerPid(resolution.backendDir);
        clack.log.warn(t.stop.notRunning);
        clack.outro("");
        return;
    }

    const pid = resolveRunningServerPid(resolution.backendDir, serverUp);

    if (!pid) {
        clack.log.warn(t.stop.notRunning);
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

    const stopped = await waitForServerDown(url);

    if (stopped) {
        spinner.stop(t.stop.stopped);
        clack.outro("");
        return;
    }

    spinner.stop(t.stop.failed);
    clack.log.warn(t.stop.stillResponding);
    clack.outro("");
}