import * as fs from "fs";
import * as path from "path";
import { isProcessAlive, killServerProcess } from "../config/ServerProcess";
import { loadPidRegistry, loadTunnelUrl, setTunnelPid, clearTunnelPid } from "../config/PidRegistry";
import { checkServerReady } from "../utils/ProcessUtils";
import { spawnBackgroundProcess } from "../utils/BackgroundProcess";

const TUNNEL_URL_RE = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i;

export { loadTunnelUrl };

/**
 * Resolves how to invoke npx for cloudflared.
 * On Windows, .cmd files cannot be spawned directly (EINVAL) — use node + npx-cli.js.
 */
function resolveNpxInvocation(tunnelArgs: string[]): { command: string; args: string[] } | null {
    const nodeDir = path.dirname(process.execPath);
    const npxCliJs = path.join(nodeDir, "node_modules", "npm", "bin", "npx-cli.js");

    if (fs.existsSync(npxCliJs)) {
        return {
            command: process.execPath,
            args: [npxCliJs, ...tunnelArgs]
        };
    }

    const npxCli = process.platform === "win32"
        ? path.join(nodeDir, "npx.cmd")
        : path.join(nodeDir, "npx");

    if (!fs.existsSync(npxCli)) {
        return null;
    }

    return {
        command: npxCli,
        args: tunnelArgs
    };
}

/**
 * Checks whether a saved tunnel is still running and serving the local backend.
 * @param backendDir The backend directory.
 */
export async function isTunnelHealthy(backendDir: string): Promise<boolean> {
    const registry = loadPidRegistry(backendDir);
    const url = registry.tunnel?.url;
    const pid = registry.tunnel?.pid;

    if (!url) {
        return false;
    }

    if (pid && !isProcessAlive(pid)) {
        return false;
    }

    return checkServerReady(url, 5000);
}

/**
 * Returns the saved tunnel URL only when the tunnel is still healthy.
 * Clears stale tunnel state when the URL or process is no longer valid.
 * @param backendDir The backend directory.
 */
export async function resolveActiveTunnelUrl(backendDir: string): Promise<string | null> {
    const url = loadTunnelUrl(backendDir);

    if (!url) {
        return null;
    }

    if (await isTunnelHealthy(backendDir)) {
        return url;
    }

    stopTunnel(backendDir);
    return null;
}

/**
 * Stops the cloudflared tunnel process if it is running.
 * @param backendDir The backend directory.
 */
export function stopTunnel(backendDir: string): void {
    const registry = loadPidRegistry(backendDir);

    if (registry.tunnel?.pid) {
        killServerProcess(registry.tunnel.pid);
    }

    clearTunnelPid(backendDir);
}

/**
 * Starts a free Cloudflare quick tunnel exposing the local multiplexus server.
 * @param backendDir The backend directory.
 * @param localPort The local port to expose (default 3000).
 * @returns The public HTTPS URL, or null when the tunnel could not start.
 */
export async function startPublicTunnel(backendDir: string, localPort: number = 3000): Promise<string | null> {
    stopTunnel(backendDir);

    const tunnelArgs = [
        "--yes",
        "cloudflared",
        "tunnel",
        "--url",
        `http://127.0.0.1:${localPort}`
    ];

    const invocation = resolveNpxInvocation(tunnelArgs);

    if (!invocation) {
        return null;
    }

    const logsDir = path.join(backendDir, "logs");
    fs.mkdirSync(logsDir, { recursive: true });
    const logFile = path.join(logsDir, "tunnel.log");
    fs.writeFileSync(logFile, "", "utf-8");

    const { pid } = spawnBackgroundProcess(invocation.command, invocation.args, {
        cwd: backendDir,
        logFile,
        launcherName: "start-tunnel.cmd"
    });

    if (!pid) {
        return null;
    }

    setTunnelPid(backendDir, pid);

    return new Promise((resolve) => {
        let settled = false;

        const finish = (url: string | null) => {
            if (settled) {
                return;
            }

            settled = true;
            clearTimeout(timer);
            clearInterval(pollLog);

            if (url) {
                setTunnelPid(backendDir, pid, url);
                resolve(url);
                return;
            }

            killServerProcess(pid);
            clearTunnelPid(backendDir);
            resolve(null);
        };

        const timer = setTimeout(() => finish(null), 45000);

        const pollLog = setInterval(() => {
            try {
                const content = fs.readFileSync(logFile, "utf-8");
                const matches = content.match(new RegExp(TUNNEL_URL_RE.source, "gi"));

                if (matches?.length) {
                    finish(matches[matches.length - 1]);
                }
            } catch (_) {
                // Log not ready yet
            }
        }, 500);
    });
}
