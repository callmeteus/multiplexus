import "reflect-metadata";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import fastifyCors from "@fastify/cors";
import { Sequelize } from "sequelize-typescript";
import { User } from "../../src/database/models/User";
import { Provider } from "../../src/database/models/Provider";
import { ProviderKey } from "../../src/database/models/ProviderKey";
import { ModelRoute } from "../../src/database/models/ModelRoute";
import { UserPlugin } from "../../src/database/models/UserPlugin";
import { ApiType, UserRole } from "@multiplexus/shared";
import { loadRoutes } from "../../src/Router";

let app: FastifyInstance;
let adminKey: string;
let openaiProviderId: number;

const BASE = "http://localhost";

async function req(method: string, path: string, body?: unknown, key?: string) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (key) headers["Authorization"] = `Bearer ${key}`;
    const res = await app.inject({
        method: method as any,
        url: path,
        headers,
        payload: body ? JSON.stringify(body) : undefined
    });
    return { status: res.statusCode, body: res.json() };
}

beforeAll(async () => {
    // In-memory isolated SQLite for tests
    const sequelize = new Sequelize({
        dialect: "sqlite",
        storage: ":memory:",
        logging: false,
        models: [User, Provider, ProviderKey, ModelRoute, UserPlugin]
    });
    await sequelize.sync({ force: true });

    // Seed admin user
    const admin = await User.create({ name: "Test Admin", apiKey: "sk-test-admin", role: UserRole.ADMIN });
    adminKey = admin.apiKey;

    // Seed default providers
    await Provider.bulkCreate([
        { name: "openai", apiType: ApiType.OPENAI, baseUrl: "https://api.openai.com/v1" },
        { name: "anthropic", apiType: ApiType.ANTHROPIC, baseUrl: "https://api.anthropic.com/v1" },
        { name: "gemini", apiType: ApiType.OPENAI, baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/v1" },
        { name: "openrouter", apiType: ApiType.OPENAI, baseUrl: "https://openrouter.ai/api/v1" },
        { name: "z_ai", apiType: ApiType.OPENAI, baseUrl: "https://api.z.ai/v1" }
    ]);

    // Start Fastify with route autoloader
    app = Fastify({ logger: false });
    await app.register(fastifyCors, { origin: "*" });
    await loadRoutes(app);
    await app.ready();
});

afterAll(async () => {
    await app.close();
});

describe("GET /api/providers", () => {
    it("returns the 5 seeded providers", async () => {
        const { status, body } = await req("GET", "/api/providers", undefined, adminKey);
        expect(status).toBe(200);
        expect(Array.isArray(body)).toBe(true);
        expect(body).toHaveLength(5);
        const names = body.map((p: any) => p.name);
        expect(names).toContain("openai");
        expect(names).toContain("anthropic");
        expect(names).toContain("gemini");
    });
});

describe("POST /api/users", () => {
    it("creates a user and returns apiKey", async () => {
        const { status, body } = await req("POST", "/api/users", { name: "test-client", role: UserRole.USER }, adminKey);
        expect(status).toBe(201);
        expect(body).toHaveProperty("apiKey");
        expect(body.apiKey).toMatch(/^sk-mux-/);
        expect(body.name).toBe("test-client");
    });

    it("rejects request without auth", async () => {
        const { status } = await req("POST", "/api/users", { name: "no-auth", role: UserRole.USER });
        expect(status).toBe(401);
    });
});

describe("POST /api/providers/keys", () => {
    it("adds a key to the openai provider", async () => {
        const providers = (await req("GET", "/api/providers", undefined, adminKey)).body;
        const openai = providers.find((p: any) => p.name === "openai");
        openaiProviderId = openai.id;

        const { status, body } = await req("POST", "/api/providers/keys", {
            providerId: openaiProviderId,
            keyValue: "sk-fake-key-for-testing",
            weight: 5,
            description: "Test key"
        }, adminKey);

        expect(status).toBe(201);
        expect(body).toHaveProperty("id");
        expect(body.weight).toBe(5);
    });
});

describe("POST /api/model/routes", () => {
    it("configures a model route", async () => {
        const { status, body } = await req("POST", "/api/model/routes", {
            routerModel: "test-gpt",
            providerId: openaiProviderId,
            providerModel: "gpt-4o-mini",
            priority: 1,
            weight: 1
        }, adminKey);

        expect(status).toBe(201);
        expect(body.routerModel).toBe("test-gpt");
    });
});

describe("POST /v1/chat/completions", () => {
    it("returns 404 for unconfigured model", async () => {
        const { status } = await req("POST", "/v1/chat/completions", {
            model: "nonexistent-model",
            messages: [{ role: "user", content: "hi" }]
        }, adminKey);
        expect(status).toBe(404);
    });

    it("routes to upstream and gets a provider error (fake key -> upstream rejects)", async () => {
        // test-gpt is configured with a fake key
        // The router should attempt the call and get back a non-200 from OpenAI
        // (401 or 400 â€” fake key), proving routing happened
        const { status } = await req("POST", "/v1/chat/completions", {
            model: "test-gpt",
            messages: [{ role: "user", content: "Hello from integration test" }]
        }, adminKey);
        // 4xx from upstream is forwarded (fatal error branch) or 502 if network fails
        expect([400, 401, 403, 502]).toContain(status);
    });
});
