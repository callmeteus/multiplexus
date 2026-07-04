import { spawn } from "child_process";

/**
 * Opens a URL in the default browser.
 * @param url The URL to open.
 */
export const openUrlInBrowser = (url: string) => {
    const platform = process.platform;

    switch (platform) {
        case "win32":
            // Use "start" command via cmd.exe to open the default browser
            // The double quotes after start are necessary in case the URL has & or special characters
            spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
            break;
        case "darwin":
            spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
            break;
        default:
            spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
            break;
    }
}

/**
 * Checks whether the multiplexus backend health endpoint is responding.
 * @param url The base URL of the server.
 * @param timeoutMs The connection timeout in milliseconds.
 * @returns True when the server reports status ok.
 */
export async function checkServerReady(url: string = "http://localhost:3000", timeoutMs: number = 1000): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        const res = await fetch(`${url}/health`, { signal: controller.signal });

        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json() as { status?: string };
            return data.status === "ok";
        }
    } catch (_) {
        // Ignore error and assume offline
    }

    return false;
}

/**
 * Checks if the prompt result is a cancel signal (Ctrl+C).
 * If it is, cleanly terminates the CLI process immediately.
 * Call this after every clack prompt to ensure Ctrl+C always exits immediately.
 * @param result The prompt result from any Clack prompt.
 */
export function handleCancel(result: unknown): void {
    // All clack cancel signals are represented as a specific symbol internally.
    // typeof === "symbol" is the reliable way to detect them without importing clack here.
    if (typeof result === "symbol") {
        process.stdout.write("\n");
        process.exit(0);
    }
}