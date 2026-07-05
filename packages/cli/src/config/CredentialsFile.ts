import * as fs from "fs";
import * as path from "path";

/**
 * Updates the initial credentials file with the public tunnel URL for editors.
 * @param backendDir The backend directory.
 * @param publicUrl The public HTTPS URL (without /v1).
 */
export function updateCredentialsPublicUrl(backendDir: string, publicUrl: string): void {
    const credPath = path.join(backendDir, "initial-credentials.data");

    if (!fs.existsSync(credPath)) {
        return;
    }

    let content = fs.readFileSync(credPath, "utf-8");

    if (content.includes("Public URL:")) {
        content = content.replace(/Public URL:\s+\S+/, `Public URL:      ${publicUrl}`);
    } else {
        content = content.replace(
            /(Router URL:\s+\S+)/,
            `$1\nPublic URL:      ${publicUrl}`
        );
    }

    fs.writeFileSync(credPath, content, "utf-8");
}

/**
 * Reads admin credentials including an optional public tunnel URL.
 * @param backendDir The backend directory.
 */
export function readCredentialsWithPublicUrl(backendDir: string): {
    apiKey: string;
    url: string;
    publicUrl?: string;
} | null {
    const credPath = path.join(backendDir, "initial-credentials.data");

    if (!fs.existsSync(credPath)) {
        return null;
    }

    try {
        const content = fs.readFileSync(credPath, "utf-8");
        const keyMatch = content.match(/Admin API Key:\s+(sk-mux-[a-f0-9]+)/);
        const urlMatch = content.match(/Router URL:\s+(http\S+)/);
        const publicMatch = content.match(/Public URL:\s+(https\S+)/);

        if (!keyMatch) {
            return null;
        }

        return {
            apiKey: keyMatch[1],
            url: urlMatch ? urlMatch[1] : "http://localhost:3000",
            publicUrl: publicMatch?.[1]
        };
    } catch (_) {
        return null;
    }
}
