import * as fs from "fs";
import * as path from "path";
import { killServerProcess, isProcessAlive } from "./ServerProcess";

const PID_FILENAME = "pid.json";

const LEGACY_BACKEND_PID = "multiplexus-backend.pid";
const LEGACY_TUNNEL_PID = "multiplexus-tunnel.pid";
const LEGACY_TUNNEL_URL = "multiplexus-tunnel.url";

export interface ManagedProcessRef {
    pid: number;
    url?: string;
}

export interface ProcessPidRegistry {
    backend?: ManagedProcessRef;
    tunnel?: ManagedProcessRef;
}

/**
 * Returns the pid.json file path.
 * @param backendDir The backend directory.
 */
export function getPidFilePath(backendDir: string): string {
    return path.join(backendDir, "logs", PID_FILENAME);
}

/**
 * Loads the process PID registry, migrating legacy formats when needed.
 * @param backendDir The backend directory.
 */
export function loadPidRegistry(backendDir: string): ProcessPidRegistry {
    const pidFile = getPidFilePath(backendDir);
    let registry: ProcessPidRegistry = {};

    if (fs.existsSync(pidFile)) {
        try {
            registry = normalizeRegistry(JSON.parse(fs.readFileSync(pidFile, "utf-8")));
        } catch (_) {
            registry = {};
        }
    }

    return migrateLegacyPidFiles(backendDir, registry);
}

/**
 * Writes the process PID registry.
 * @param backendDir The backend directory.
 * @param registry The registry payload.
 */
export function writePidRegistry(backendDir: string, registry: ProcessPidRegistry): void {
    const logsDir = path.join(backendDir, "logs");
    fs.mkdirSync(logsDir, { recursive: true });

    const cleaned: ProcessPidRegistry = {};

    if (registry.backend?.pid) {
        cleaned.backend = { pid: registry.backend.pid };
    }

    if (registry.tunnel?.pid) {
        cleaned.tunnel = { pid: registry.tunnel.pid };

        if (registry.tunnel.url) {
            cleaned.tunnel.url = registry.tunnel.url;
        }
    }

    if (Object.keys(cleaned).length === 0) {
        const pidFile = getPidFilePath(backendDir);

        if (fs.existsSync(pidFile)) {
            fs.unlinkSync(pidFile);
        }

        return;
    }

    fs.writeFileSync(getPidFilePath(backendDir), JSON.stringify(cleaned, null, 2), "utf-8");
}

/**
 * Merges partial updates into the PID registry.
 * @param backendDir The backend directory.
 * @param patch The fields to update.
 */
export function updatePidRegistry(backendDir: string, patch: Partial<ProcessPidRegistry>): void {
    const current = loadPidRegistry(backendDir);
    const next: ProcessPidRegistry = { ...current };

    if (patch.backend !== undefined) {
        next.backend = patch.backend;
    }

    if (patch.tunnel !== undefined) {
        next.tunnel = patch.tunnel;
    }

    writePidRegistry(backendDir, next);
}

/**
 * Saves the backend process PID.
 * @param backendDir The backend directory.
 * @param pid The backend PID.
 */
export function setBackendPid(backendDir: string, pid: number): void {
    updatePidRegistry(backendDir, { backend: { pid } });
}

/**
 * Loads the saved backend PID.
 * @param backendDir The backend directory.
 */
export function loadBackendPid(backendDir: string): number | null {
    const pid = loadPidRegistry(backendDir).backend?.pid;
    return typeof pid === "number" && pid > 0 ? pid : null;
}

/**
 * Clears the backend entry from the registry.
 * @param backendDir The backend directory.
 */
export function clearBackendPid(backendDir: string): void {
    const current = loadPidRegistry(backendDir);
    delete current.backend;
    writePidRegistry(backendDir, current);
}

/**
 * Saves the tunnel process PID and optional public URL.
 * @param backendDir The backend directory.
 * @param pid The tunnel PID.
 * @param url The public tunnel URL.
 */
export function setTunnelPid(backendDir: string, pid: number, url?: string): void {
    const current = loadPidRegistry(backendDir);
    updatePidRegistry(backendDir, {
        tunnel: {
            pid,
            url: url ?? current.tunnel?.url
        }
    });
}

/**
 * Loads the saved tunnel public URL.
 * @param backendDir The backend directory.
 */
export function loadTunnelUrl(backendDir: string): string | null {
    const url = loadPidRegistry(backendDir).tunnel?.url;
    return url || null;
}

/**
 * Clears the tunnel entry from the registry.
 * @param backendDir The backend directory.
 */
export function clearTunnelPid(backendDir: string): void {
    const current = loadPidRegistry(backendDir);
    delete current.tunnel;
    writePidRegistry(backendDir, current);
}

/**
 * Clears the entire PID registry.
 * @param backendDir The backend directory.
 */
export function clearPidRegistry(backendDir: string): void {
    writePidRegistry(backendDir, {});
    removeLegacyPidFiles(backendDir);
}

/**
 * Stops backend and tunnel processes tracked in pid.json.
 * @param backendDir The backend directory.
 * @param options Optional fallbacks when PIDs are stale.
 */
export function stopManagedProcesses(
    backendDir: string,
    options: { backendFallbackPid?: number | null } = {}
): { backendStopped: boolean; tunnelStopped: boolean } {
    const registry = loadPidRegistry(backendDir);
    let backendStopped = false;
    let tunnelStopped = false;

    const backendPid = registry.backend?.pid ?? options.backendFallbackPid ?? null;

    if (backendPid) {
        backendStopped = killServerProcess(backendPid);
    }

    if (registry.tunnel?.pid) {
        tunnelStopped = killServerProcess(registry.tunnel.pid);
    }

    clearPidRegistry(backendDir);
    return { backendStopped, tunnelStopped };
}

/**
 * Returns whether any managed process appears to be running.
 * @param backendDir The backend directory.
 */
export function hasManagedProcesses(backendDir: string): boolean {
    const registry = loadPidRegistry(backendDir);

    if (registry.backend?.pid && isProcessAlive(registry.backend.pid)) {
        return true;
    }

    if (registry.tunnel?.pid && isProcessAlive(registry.tunnel.pid)) {
        return true;
    }

    return false;
}

/**
 * Normalizes pid.json payloads from older flat shapes.
 * @param raw The parsed JSON body.
 */
function normalizeRegistry(raw: unknown): ProcessPidRegistry {
    if (!raw || typeof raw !== "object") {
        return {};
    }

    const source = raw as Record<string, unknown>;
    const registry: ProcessPidRegistry = {};

    const backend = source.backend;

    if (typeof backend === "number" && backend > 0) {
        registry.backend = { pid: backend };
    } else
    if (backend && typeof backend === "object") {
        const pid = (backend as ManagedProcessRef).pid;

        if (typeof pid === "number" && pid > 0) {
            registry.backend = { pid };
        }
    }

    const tunnel = source.tunnel;
    const legacyTunnelUrl = typeof source.tunnelUrl === "string" ? source.tunnelUrl : undefined;

    if (typeof tunnel === "number" && tunnel > 0) {
        registry.tunnel = { pid: tunnel, ...(legacyTunnelUrl ? { url: legacyTunnelUrl } : {}) };
    } else
    if (tunnel && typeof tunnel === "object") {
        const pid = (tunnel as ManagedProcessRef).pid;
        const url = (tunnel as ManagedProcessRef).url ?? legacyTunnelUrl;

        if (typeof pid === "number" && pid > 0) {
            registry.tunnel = { pid, ...(url ? { url } : {}) };
        }
    }

    return registry;
}

/**
 * Imports legacy per-process pid files into pid.json.
 * @param backendDir The backend directory.
 * @param registry The current registry.
 */
function migrateLegacyPidFiles(backendDir: string, registry: ProcessPidRegistry): ProcessPidRegistry {
    const logsDir = path.join(backendDir, "logs");
    const migrated = { ...registry };
    let changed = false;

    if (!migrated.backend?.pid) {
        const legacyPath = path.join(logsDir, LEGACY_BACKEND_PID);

        if (fs.existsSync(legacyPath)) {
            const pid = readPositiveIntFile(legacyPath);

            if (pid) {
                migrated.backend = { pid };
                changed = true;
            }
        }
    }

    if (!migrated.tunnel?.pid) {
        const legacyPath = path.join(logsDir, LEGACY_TUNNEL_PID);

        if (fs.existsSync(legacyPath)) {
            const pid = readPositiveIntFile(legacyPath);

            if (pid) {
                migrated.tunnel = { pid };
                changed = true;
            }
        }
    }

    if (migrated.tunnel && !migrated.tunnel.url) {
        const legacyPath = path.join(logsDir, LEGACY_TUNNEL_URL);

        if (fs.existsSync(legacyPath)) {
            const url = fs.readFileSync(legacyPath, "utf-8").trim();

            if (url) {
                migrated.tunnel = { ...migrated.tunnel, url };
                changed = true;
            }
        }
    }

    if (changed) {
        writePidRegistry(backendDir, migrated);
        removeLegacyPidFiles(backendDir);
    }

    return migrated;
}

/**
 * Reads a positive integer from a text file.
 * @param filePath The file path.
 */
function readPositiveIntFile(filePath: string): number | null {
    try {
        const pid = Number(fs.readFileSync(filePath, "utf-8").trim());
        return Number.isInteger(pid) && pid > 0 ? pid : null;
    } catch (_) {
        return null;
    }
}

/**
 * Deletes legacy pid files after migration.
 * @param backendDir The backend directory.
 */
function removeLegacyPidFiles(backendDir: string): void {
    const logsDir = path.join(backendDir, "logs");

    for (const name of [LEGACY_BACKEND_PID, LEGACY_TUNNEL_PID, LEGACY_TUNNEL_URL]) {
        const filePath = path.join(logsDir, name);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}
