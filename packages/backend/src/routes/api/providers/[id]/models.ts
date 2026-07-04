import { FastifyRequest, FastifyReply } from "fastify";
import { authenticate } from "../../../../database/Auth";
import { Provider } from "../../../../database/models/Provider";
import { ProviderKey } from "../../../../database/models/ProviderKey";
import { UserRole } from "@multiplexus/shared";
import { getProviderHandler } from "../../../../ProviderRegistry";

/**
 * GET /api/providers/:id/models
 *
 * Discovers available models for a given provider using the provider handler registry.
 * Each handler knows whether to call a live API or return a hardcoded list,
 * and applies hardcoded pricing tables where provider APIs don't return pricing.
 */
export const GET = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const adminUser = await authenticate(request, reply, UserRole.ADMIN);
    if (!adminUser) {
        return;
    }

    const providerId = parseInt(request.params.id, 10);
    if (isNaN(providerId)) {
        reply.code(400).send({ error: "Invalid provider ID" });
        return;
    }

    const provider = await Provider.findByPk(providerId, {
        include: [{ model: ProviderKey, as: "keys", where: { isActive: true }, required: false }]
    });

    if (!provider) {
        reply.code(404).send({ error: "Provider not found" });
        return;
    }

    const handler = getProviderHandler(provider.name);
    if (!handler) {
        reply.code(501).send({ error: `No model discovery handler registered for provider "${provider.name}"` });
        return;
    }

    const keys = (provider as any).keys as ProviderKey[];
    const apiKey = keys?.[0]?.keyValue ?? "";
    const baseUrl = provider.baseUrl ?? undefined;

    try {
        const models = await handler.fetchModels(apiKey, baseUrl);
        reply.send({ models });
    } catch (err: any) {
        reply.code(502).send({ error: `Failed to fetch models from ${handler.displayName}: ${err.message}` });
    }
};
