import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

/**
 * The PID file path.
 */
const PID_FILE = path.join(process.cwd(), "logs", "multiplexus-backend.pid");

/**
 * Gets the PID file path.
 * @param backendDir The backend directory.
 * @returns The PID file path.
 */
function getPidFilePath(backendDir: string): string {
    return path.join(backendDir, PID_FILE);
}

/**
 * Saves the server PID.
 * @param backendDir The backend directory.
 * @param pid The PID.
 */
export function saveServerPid(backendDir: string, pid: number): void {
    fs.writeFileSync(getPidFilePath(backendDir), String(pid), "utf-8");
}

/**
 * Loads the server PID.
 * @param backendDir The backend directory.
 * @returns The server PID.
 */
export function loadServerPid(backendDir: string): number | null {
    const pidFile = getPidFilePath(backendDir);

    if (!fs.existsSync(pidFile)) {
        return null;
    }

    try {
        const pid = Number(fs.readFileSync(pidFile, "utf-8").trim());
        return Number.isInteger(pid) && pid > 0 ? pid : null;
    } catch (_) {
        return null;
    }
}

/**
 * Clears the server PID.
 * @param backendDir The backend directory.
 */
export function clearServerPid(backendDir: string): void {
    const pidFile = getPidFilePath(backendDir);

    if (fs.existsSync(pidFile)) {
        fs.unlinkSync(pidFile);
    }
}

/**
 * Checks if the process is alive.
 * @param pid The PID.
 * @returns True if the process is alive, false otherwise.
 */
export function isProcessAlive(pid: number): boolean {
    try {
        process.kill(pid, 0);
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * Kills the server process.
 * @param pid The PID.
 * @returns True if the process was killed, false otherwise.
 */
export function killServerProcess(pid: number): boolean {
    if (!isProcessAlive(pid)) {
        return false;
    }

    try {
        if (process.platform === "win32") {
            execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
        } else {
            process.kill(pid, "SIGTERM");
        }

        return true;
    } catch (_) {
        return false;
    }
}
