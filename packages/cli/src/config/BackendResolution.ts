import * as fs from "fs";
import * as path from "path";

/**
 * The backend resolution.
 */
export interface BackendResolution {
    projectRoot: string;
    backendDir: string;
    isCompiled: boolean;
}

/**
 * Resolves the backend directory.
 * @returns The backend resolution.
 */
export function resolveBackend(): BackendResolution | null {
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

/**
 * Reads the admin credentials file.
 * @param backendDir The backend directory.
 * @returns The admin credentials.
 */
export function readAdminCredentialsFile(backendDir: string): { apiKey: string; url: string } | null {
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
