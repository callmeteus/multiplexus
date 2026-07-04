import "reflect-metadata";
import fastifyCors from "@fastify/cors";
import Fastify from "fastify";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { initializeDatabase } from "./database/Connection";
import { User } from "./database/models/User";
import { Provider } from "./database/models/Provider";
import { ApiType, UserRole } from "@multiplexus/shared";
import { loadRoutes } from "./Router";
import { logger } from "./Logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const credentialsPath = path.join(backendRoot, "initial-credentials.data");

/**
 * Writes the admin credentials file from the current database state.
 * @param adminUser The admin user record.
 */
function writeCredentialsFile(adminUser: User) {
    const credentialsContent = [
        "==================================================",
        "      MULTIPLEXUS INITIAL ADMIN CREDENTIALS       ",
        "==================================================",
        `Admin Name:      ${adminUser.name}`,
        `Admin API Key:   ${adminUser.apiKey}`,
        `Router URL:      http://localhost:3000`,
        `Created At:      ${new Date().toISOString()}`,
        "==================================================",
        "Keep this key secret. You can use it in your CLI  ",
        "to register providers, keys, and model routes.    ",
        "=================================================="
    ].join("\n");

    fs.writeFileSync(credentialsPath, credentialsContent, "utf-8");
}

/**
 * Normalizes legacy lowercase role values in the database.
 */
async function normalizeUserRoles() {
    await User.update(
        { role: UserRole.ADMIN },
        { where: { role: "admin" } }
    );
    await User.update(
        { role: UserRole.USER },
        { where: { role: "user" } }
    );
}

/**
 * Keeps initial-credentials.data aligned with the admin user in the database.
 */
async function syncCredentialsFile() {
    const adminUser = await User.findOne({
        where: { role: UserRole.ADMIN },
        order: [["id", "ASC"]]
    });

    if (!adminUser) {
        return;
    }

    writeCredentialsFile(adminUser);
}

async function seedDatabase() {
    await normalizeUserRoles();

    // 1. Seed Default Admin User if no users exist
    const userCount = await User.count();
    if (userCount === 0) {
        const adminKey = `sk-mux-${crypto.randomBytes(24).toString("hex")}`;
        const adminUser = await User.create({
            name: "Default Admin",
            apiKey: adminKey,
            role: UserRole.ADMIN
        });

        writeCredentialsFile(adminUser);

        console.log("\n" + fs.readFileSync(credentialsPath, "utf-8") + "\n");
        logger.info("Initial admin credentials generated and saved.");
    } else {
        await syncCredentialsFile();
    }

    // 2. Seed Default Providers if no providers exist
    const providerCount = await Provider.count();
    if (providerCount === 0) {
        await Provider.bulkCreate([
            {
                name: "openai",
                apiType: ApiType.OPENAI,
                baseUrl: "https://api.openai.com/v1"
            },
            {
                name: "anthropic",
                apiType: ApiType.ANTHROPIC,
                baseUrl: "https://api.anthropic.com/v1"
            },
            {
                name: "gemini",
                apiType: ApiType.OPENAI,
                baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/v1"
            },
            {
                name: "openrouter",
                apiType: ApiType.OPENAI,
                baseUrl: "https://openrouter.ai/api/v1"
            },
            {
                name: "z_ai",
                apiType: ApiType.OPENAI,
                baseUrl: "https://api.z.ai/v1"
            }
        ]);
        logger.info("Seeded default providers: openai, anthropic, gemini, openrouter, z_ai");
    }
}

async function startServer() {
    try {
        logger.info("Initializing database...");
        await initializeDatabase();

        logger.info("Seeding database...");
        await seedDatabase();

        const fastify = Fastify({
            logger: false
        });

        // Register CORS
        await fastify.register(fastifyCors, {
            origin: "*"
        });

        logger.info("Loading routes...");
        await loadRoutes(fastify);

        const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
        await fastify.listen({
            port,
            host: "0.0.0.0"
        });

        logger.info(`multiplexus is running on http://localhost:${port}`);
    } catch (err) {
        logger.error("Error starting server:", err);
        process.exit(1);
    }
}

startServer();
