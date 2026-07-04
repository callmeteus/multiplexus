import { FastifyRequest, FastifyReply } from "fastify";
import { authenticate } from "../../../../database/Auth";
import { ProviderKey } from "../../../../database/models/ProviderKey";
import { Provider } from "../../../../database/models/Provider";
import { UserRole } from "@multiplexus/shared";

export const GET = async (request: FastifyRequest, reply: FastifyReply) => {
    const adminUser = await authenticate(request, reply, UserRole.ADMIN);
    if (!adminUser) {
        return;
    }

    const keys = await ProviderKey.findAll({
        include: [{
            model: Provider,
            required: true
        }],
        order: [
            ["id", "ASC"]
        ]
    });

    reply.send(keys);
};

export const POST = async (request: FastifyRequest, reply: FastifyReply) => {
    const adminUser = await authenticate(request, reply, UserRole.ADMIN);
    if (!adminUser) {
        return;
    }

    const body = request.body as any;
    if (!body || !body.providerId || !body.keyValue) {
        reply.code(400).send({ error: "Missing providerId or keyValue parameter" });
        return;
    }

    const provider = await Provider.findByPk(body.providerId);
    if (!provider) {
        reply.code(404).send({ error: "Provider not found" });
        return;
    }

    const key = await ProviderKey.create({
        providerId: body.providerId,
        keyValue: body.keyValue,
        weight: body.weight ?? 1,
        description: body.description || null,
        isActive: true
    });

    reply.code(201).send(key);
};
