import { spawn } from "child_process";

/**
 * Opens a URL in the default browser.
 * @param url The URL to open.
 */
export const openUrlInBrowser = (url: string) => {
    const platform = process.platform;

    if (platform === "win32") {
        // Use "start" command via cmd.exe to open the default browser
        // The double quotes after start are necessary in case the URL has & or special characters
        spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
    } else
    if (platform === "darwin") {
        spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
    } else {
        spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
    }
}