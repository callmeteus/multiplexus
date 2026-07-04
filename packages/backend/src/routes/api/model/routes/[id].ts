import { FastifyRequest, FastifyReply } from "fastify";
import { authenticate } from "../../../../database/Auth";
import { ModelRoute } from "../../../../database/models/ModelRoute";
import { UserRole } from "@multiplexus/shared";

/**
 * Handles PATCH requests to update a specific model route.
 * @param request The Fastify request.
 * @param reply The Fastify reply.
 */
export const PATCH = async (request: FastifyRequest, reply: FastifyReply) => {
    const adminUser = await authenticate(request, reply, UserRole.ADMIN);
    if (!adminUser) {
        return;
    }

    const { id } = request.params as { id: string };
    const body = request.body as any;

    const route = await ModelRoute.findByPk(id);
    if (!route) {
        reply.code(404).send({ error: "Model route not found" });
        return;
    }

    const updates: any = {};

    if (body.routerModel !== undefined) {
        updates.routerModel = body.routerModel;
    }

    if (body.providerModel !== undefined) {
        updates.providerModel = body.providerModel;
    }

    if (body.priority !== undefined) {
        updates.priority = Number(body.priority);
    }

    if (body.weight !== undefined) {
        updates.weight = Number(body.weight);
    }

    if (body.isActive !== undefined) {
        updates.isActive = Boolean(body.isActive);
    }

    await route.update(updates);
    reply.send(route);
};

/**
 * Handles DELETE requests to delete a specific model route.
 * @param request The Fastify request.
 * @param reply The Fastify reply.
 */
export const DELETE = async (request: FastifyRequest, reply: FastifyReply) => {
    const adminUser = await authenticate(request, reply, UserRole.ADMIN);
    if (!adminUser) {
        return;
    }

    const { id } = request.params as { id: string };

    const route = await ModelRoute.findByPk(id);
    if (!route) {
        reply.code(404).send({ error: "Model route not found" });
        return;
    }

    await route.destroy();
    reply.send({ success: true });
};
