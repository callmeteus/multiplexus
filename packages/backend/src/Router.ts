import { FastifyInstance } from "fastify";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { logger } from "./Logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Loads the routes from the routes directory.
 * @param fastify The Fastify instance.
 */
export async function loadRoutes(fastify: FastifyInstance) {
    const routesDir = path.join(__dirname, "routes");
    if (!fs.existsSync(routesDir)) {
        return;
    }

    /**
     * Walks the directory and loads the routes.
     * @param dir The directory to walk.
     */
    async function walk(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await walk(fullPath);
            } else
            if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".js")) && !entry.name.endsWith(".d.ts")) {
                const relativePath = path.relative(routesDir, fullPath);
                let routePath = relativePath.replace(/\\/g, "/").slice(0, -3);

                if (routePath.endsWith("/index")) {
                    routePath = routePath.slice(0, -6);
                } else
                if (routePath === "index") {
                    routePath = "";
                }

                // Replace [param] with :param
                routePath = routePath.replace(/\[([^\]]+)\]/g, ":$1");

                const url = `/${routePath}`;

                // Import module dynamically using file:// URL for ESM compatibility on Windows
                const fileUrl = `file://${fullPath.replace(/\\/g, "/")}`;
                const handlerModule = await import(fileUrl);

                const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
                for (const method of methods) {
                    if (handlerModule[method]) {
                        fastify.route({
                            method,
                            url,
                            handler: handlerModule[method]
                        });
                        logger.info(`Registered route: ${method} ${url}`);
                    }
                }
            }
        }
    }

    await walk(routesDir);
}
