import * as clack from "@clack/prompts";
import * as fs from "fs";
import * as path from "path";
import { ApiClient } from "../ApiClient";
import { t } from "../i18n/index";
import { syncAdminCredentials } from "../config/LocalConfig";
import { ensureLocalBootstrap } from "../config/LocalBootstrap";
import { updateCredentialsPublicUrl, readCredentialsWithPublicUrl } from "../config/CredentialsFile";
import { resolveBackend } from "../config/BackendResolution";
import { checkServerReady } from "../utils/ProcessUtils";
import { spawnBackgroundProcess } from "../utils/BackgroundProcess";
import { resolveActiveTunnelUrl, startPublicTunnel } from "../tunnel/TunnelManager";
import {
    findListeningPid,
    isProcessAlive,
    killServerProcess
} from "../config/ServerProcess";
import {
    clearPidRegistry,
    hasManagedProcesses,
    loadBackendPid,
    loadPidRegistry,
    setBackendPid,
    stopManagedProcesses
} from "../config/PidRegistry";

/**
 * Resolves the tsx CLI path.
 * @param projectRoot The multiplexus project root.
 * @returns The tsx CLI path, or null when not installed.
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

/**
 * Returns the backend logs directory.
 * @param backendDir The backend directory.
 * @returns The logs directory path.
 */
function getBackendLogsDir(backendDir: string): string {
    return path.join(backendDir, "logs");
}

/**
 * Returns the spawn log file path, creating the logs directory when needed.
 * @param backendDir The backend directory.
 * @returns The spawn log file path.
 */
function getSpawnLogFile(backendDir: string): string {
    const logsDir = getBackendLogsDir(backendDir);
    fs.mkdirSync(logsDir, { recursive: true });
    return path.join(logsDir, "spawn.log");
}

/**
 * Returns the hint path for today's combined backend log file.
 * @param backendDir The backend directory.
 * @returns The combined log file path for today.
 */
function getBackendLogHint(backendDir: string): string {
    const today = new Date().toISOString().slice(0, 10);
    return path.join(getBackendLogsDir(backendDir), `combined-${today}.log`);
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
 * Bootstraps local preset routes and starts a free public tunnel for editors.
 * @param apiClient The API client.
 * @param backendDir The backend directory.
 */
async function finalizeLocalStart(apiClient: ApiClient, backendDir: string): Promise<void> {
    const spinner = clack.spinner();

    try {
        spinner.start(t.start.bootstrappingProviders);
        await ensureLocalBootstrap(apiClient);
        spinner.stop(t.start.bootstrapReady);
    } catch (err: any) {
        spinner.stop(t.start.bootstrapFailed.replace("{message}", err.message));
    }

    let publicUrl = await resolveActiveTunnelUrl(backendDir);

    if (!publicUrl && !process.env.MULTIPLEXUS_NO_TUNNEL) {
        const tunnelSpinner = clack.spinner();
        tunnelSpinner.start(t.start.startingFreeTunnel);

        publicUrl = await startPublicTunnel(backendDir, 3000);

        if (publicUrl) {
            updateCredentialsPublicUrl(backendDir, publicUrl);
            tunnelSpinner.stop(t.start.freeTunnelReady.replace("{url}", publicUrl));
        } else {
            tunnelSpinner.stop(t.start.freeTunnelFailed);
        }
    } else
    if (publicUrl) {
        clack.log.info(t.start.freeTunnelReused.replace("{url}", publicUrl));
    }

    const creds = readCredentialsWithPublicUrl(backendDir);
    const editorBase = publicUrl ? `${publicUrl}/v1` : "http://localhost:3000/v1";

    console.log();
    clack.log.info(t.start.instructionsTitle);
    clack.log.info(`${t.start.publicBaseUrl} ${editorBase}`);

    if (creds?.apiKey) {
        clack.log.info(`${t.start.apiKey} ${creds.apiKey}`);
    }

    clack.log.info(t.start.suggestedModel.replace("{model}", "free"));

    for (const tool of t.start.tools) {
        clack.log.step(`${tool.name}: ${tool.instruction}`);
    }
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
        if (await syncAdminCredentials(apiClient, resolution.backendDir)) {
            clack.log.success(t.start.alreadyRunning);
            clack.log.success(t.start.credentialsLoaded);
        } else {
            clack.log.success(t.start.alreadyRunning);
            clack.log.warn(t.start.credentialsStale);
        }

        await finalizeLocalStart(apiClient, resolution.backendDir);

        clack.outro("");
        return;
    }

    const spinner = clack.spinner();
    spinner.start(t.start.starting);

    const spawnLogFile = getSpawnLogFile(resolution.backendDir);
    const tsxCli = resolveTsxCli(resolution.projectRoot);

    if (!tsxCli) {
        spinner.stop(t.start.noEntrypoint);
        clack.log.error(t.start.tsxNotInstalled);
        clack.outro("");
        return;
    }

    const { pid } = spawnBackgroundProcess(process.execPath, [tsxCli, "src/index.ts"], {
        cwd: resolution.backendDir,
        logFile: spawnLogFile,
        launcherName: "start-backend.cmd"
    });

    spinner.message(t.start.waitingReady);

    const isReady = await waitServerReady(url);

    if (!isReady) {
        const failedPid = findListeningPid(3000) ?? pid;
        if (failedPid) {
            killServerProcess(failedPid);
        }
        clearPidRegistry(resolution.backendDir);
        spinner.stop(t.start.failed);
        clack.log.error(pid ? t.start.connectionFailed : t.start.processStartFailed);
        clack.log.warn(t.start.checkLogs.replace("{spawnLog}", spawnLogFile).replace("{combinedLog}", getBackendLogHint(resolution.backendDir)));
        clack.outro("");
        return;
    }

    const runningPid = findListeningPid(3000);
    if (runningPid) {
        setBackendPid(resolution.backendDir, runningPid);
    }

    spinner.message(t.start.loadingCredentials);

    if (await syncAdminCredentials(apiClient, resolution.backendDir)) {
        spinner.stop(t.start.ready);
        clack.log.success(t.start.credentialsLoaded);
    } else {
        spinner.stop(t.start.ready);
        clack.log.warn(t.start.credentialsStale);
    }

    await finalizeLocalStart(apiClient, resolution.backendDir);
    clack.outro("");
}

/**
 * Resolves the PID of a running multiplexus server.
 * @param backendDir The backend directory.
 * @param serverUp Whether the server is up.
 * @returns The PID of the running server.
 */
function resolveRunningServerPid(backendDir: string, serverUp: boolean): number | null {
    const savedPid = loadBackendPid(backendDir);

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
    const registry = loadPidRegistry(resolution.backendDir);
    const tunnelRunning = Boolean(registry.tunnel?.pid && isProcessAlive(registry.tunnel.pid));

    if (!serverUp && !tunnelRunning && !hasManagedProcesses(resolution.backendDir)) {
        clearPidRegistry(resolution.backendDir);
        clack.log.warn(t.stop.notRunning);
        clack.outro("");
        return;
    }

    const spinner = clack.spinner();
    spinner.start(t.stop.stopping);

    const backendFallbackPid = serverUp
        ? (resolveRunningServerPid(resolution.backendDir, serverUp) ?? findListeningPid(3000))
        : null;

    const { backendStopped, tunnelStopped } = stopManagedProcesses(resolution.backendDir, {
        backendFallbackPid
    });

    if (!backendStopped && serverUp && backendFallbackPid) {
        killServerProcess(backendFallbackPid);
    }

    const stopped = serverUp ? await waitForServerDown(url) : true;

    if (stopped || tunnelStopped) {
        spinner.stop(t.stop.stopped);
        clack.outro("");
        return;
    }

    spinner.stop(t.stop.failed);

    if (serverUp) {
        clack.log.warn(t.stop.stillResponding);
    } else {
        clack.log.error(t.stop.failed);
    }

    clack.outro("");
}