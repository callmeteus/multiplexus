import { FastifyRequest, FastifyReply } from "fastify";
import { Readable } from "stream";
import { authenticate } from "../../../database/Auth";
import { ModelRoute } from "../../../database/models/ModelRoute";
import { Provider } from "../../../database/models/Provider";
import { ProviderKey } from "../../../database/models/ProviderKey";
import { UserPlugin } from "../../../database/models/UserPlugin";
import { getProvider } from "../../../providers/ProviderRegistry";
import { logger } from "../../../Logger";
import { PLUGINS } from "../../../plugins";

// HTTP status codes that indicate the request itself is bad â€” no point in retrying with another key/provider
const FATAL_CLIENT_STATUSES = new Set([400, 401, 403, 404, 422]);

function selectWeighted<T extends { weight: number }>(items: T[]): T {
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
    let r = Math.random() * totalWeight;
    for (const item of items) {
        r -= (item.weight || 1);
        if (r <= 0) {
            return item;
        }
    }
    return items[0];
}

// Checks if an upstream error is recoverable (rate-limit, server error, network) vs fatal (bad request / auth)
function isRecoverableError(err: any): boolean {
    const status: number | undefined = err.status ?? err.statusCode ?? err.response?.status;
    if (status === undefined) {
        // Network/timeout errors are always recoverable
        return true;
    }
    // 429 = rate limited â€” try another key
    // 5xx = server-side provider error â€” try another key
    if (status === 429 || status >= 500) {
        return true;
    }
    // 4xx (except 429) = bad request / auth error â€” fatal, stop retrying
    return !FATAL_CLIENT_STATUSES.has(status);
}

export const POST = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticate(request, reply);
    if (!user) {
        return;
    }

    const body = request.body as any;

    // Query and apply enabled client-key plugins dynamically
    const activeUserPlugins = await UserPlugin.findAll({
        where: {
            userId: user.id,
            isEnabled: true
        }
    });

    for (const userPlugin of activeUserPlugins) {
        const plugin = PLUGINS[userPlugin.pluginName];
        if (plugin) {
            plugin.apply(body);
        }
    }
    if (!body || !body.model) {
        reply.code(400).send({ error: "Missing model parameter" });
        return;
    }

    const routerModel = body.model;

    // Fetch all active routes for this model
    const routes = await ModelRoute.findAll({
        where: {
            routerModel,
            isActive: true
        },
        include: [{
            model: Provider,
            required: true
        }]
    });

    if (routes.length === 0) {
        reply.code(404).send({ error: `Model '${routerModel}' is not configured or active on the router` });
        return;
    }

    // Group routes by priority (ascending = lower is tried first)
    const routesByPriority: Record<number, ModelRoute[]> = {};
    for (const route of routes) {
        const p = route.priority;
        if (!routesByPriority[p]) {
            routesByPriority[p] = [];
        }
        routesByPriority[p].push(route);
    }

    const sortedPriorities = Object.keys(routesByPriority)
        .map(Number)
        .sort((a, b) => a - b);

    let lastError: Error | null = null;
    let attempts = 0;
    let fatalError: { status: number; body: unknown } | null = null;

    for (const priority of sortedPriorities) {
        const priorityRoutes = [...routesByPriority[priority]];

        while (priorityRoutes.length > 0) {
            const selectedRoute = selectWeighted(priorityRoutes);

            const activeKeys = await ProviderKey.findAll({
                where: {
                    providerId: selectedRoute.providerId,
                    isActive: true
                }
            });

            if (activeKeys.length === 0) {
                const idx = priorityRoutes.indexOf(selectedRoute);
                priorityRoutes.splice(idx, 1);
                lastError = new Error(`No active keys for provider '${selectedRoute.provider.name}'`);
                logger.warn(`No active keys for provider '${selectedRoute.provider.name}', skipping.`);
                continue;
            }

            const currentKeys = [...activeKeys];

            while (currentKeys.length > 0) {
                const selectedKey = selectWeighted(currentKeys);
                const providerInstance = getProvider(selectedRoute.provider.apiType);
                attempts++;

                logger.info(
                    `Attempt ${attempts}: routing '${routerModel}' -> provider '${selectedRoute.provider.name}' ` +
                    `model '${selectedRoute.providerModel}' (priority=${priority}, keyId=${selectedKey.id}, weight=${selectedKey.weight})`
                );

                try {
                    const providerResponse = await providerInstance.execute(
                        body,
                        selectedKey.keyValue,
                        selectedRoute.providerModel,
                        selectedRoute.provider.baseUrl || undefined
                    );

                    // Diagnostic headers
                    reply.header("X-Mux-Provider", selectedRoute.provider.name);
                    reply.header("X-Mux-Attempts", String(attempts));
                    reply.headers(providerResponse.headers);

                    if (providerResponse.isStream) {
                        reply.send(Readable.fromWeb(providerResponse.body as any));
                    } else {
                        reply.send(providerResponse.body);
                    }

                    return;
                } catch (err: any) {
                    lastError = err;
                    const status: number | undefined = err.status ?? err.statusCode;
                    logger.warn(
                        `Attempt ${attempts} failed via provider '${selectedRoute.provider.name}' ` +
                        `(keyId=${selectedKey.id}): [${status ?? "network"}] ${err.message}`
                    );

                    // If upstream returned a fatal client error, abort immediately and forward it
                    if (status !== undefined && FATAL_CLIENT_STATUSES.has(status)) {
                        fatalError = { status, body: err.responseBody ?? { error: err.message } };
                        break;
                    }

                    // Recoverable â€” try next key
                    const keyIdx = currentKeys.indexOf(selectedKey);
                    currentKeys.splice(keyIdx, 1);
                }
            }

            if (fatalError) {
                break;
            }

            // All keys failed for this route â€” move to next route in same priority
            const idx = priorityRoutes.indexOf(selectedRoute);
            priorityRoutes.splice(idx, 1);
        }

        if (fatalError) {
            break;
        }
    }

    // Forward fatal upstream error directly to the client
    if (fatalError) {
        logger.error(`Fatal upstream error (${fatalError.status}) after ${attempts} attempt(s). Forwarding to client.`);
        reply.header("X-Mux-Attempts", String(attempts));
        reply.code(fatalError.status).send(fatalError.body);
        return;
    }

    // All providers exhausted
    logger.error(`All providers exhausted after ${attempts} attempt(s) for model '${routerModel}'.`);
    reply.header("X-Mux-Attempts", String(attempts));
    reply.code(502).send({
        error: "Bad Gateway",
        message: "Failed to route completions request to any configured provider",
        details: lastError ? lastError.message : "No providers available"
    });
};
