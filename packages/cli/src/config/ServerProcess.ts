import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

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
 * Finds the listening PID.
 * @param port The port.
 * @returns The listening PID.
 */
export function findListeningPid(port: number): number | null {
    try {
        if (process.platform === "win32") {
            const output = execSync(`netstat -ano | findstr ":${port}" | findstr "LISTENING"`, {
                encoding: "utf-8"
            });

            for (const line of output.trim().split(/\r?\n/)) {
                const parts = line.trim().split(/\s+/);
                const pid = Number(parts[parts.length - 1]);

                if (Number.isInteger(pid) && pid > 0) {
                    return pid;
                }
            }

            return null;
        }

        const output = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, { encoding: "utf-8" });
        const pid = Number(output.trim().split(/\r?\n/)[0]);
        return Number.isInteger(pid) && pid > 0 ? pid : null;
    } catch (_) {
        return null;
    }
}

/**
 * Kills a process and its children when possible.
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
