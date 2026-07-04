import { FastifyRequest, FastifyReply } from "fastify";
import { authenticate } from "../../../../database/Auth";
import { ModelRoute } from "../../../../database/models/ModelRoute";
import { Provider } from "../../../../database/models/Provider";
import { UserRole } from "@multiplexus/shared";

export const GET = async (request: FastifyRequest, reply: FastifyReply) => {
    const adminUser = await authenticate(request, reply, UserRole.ADMIN);
    if (!adminUser) {
        return;
    }

    const routes = await ModelRoute.findAll({
        include: [{
            model: Provider,
            required: true
        }],
        order: [
            ["routerModel", "ASC"],
            ["priority", "ASC"],
            ["id", "ASC"]
        ]
    });

    reply.send(routes);
};

export const POST = async (request: FastifyRequest, reply: FastifyReply) => {
    const adminUser = await authenticate(request, reply, UserRole.ADMIN);
    if (!adminUser) {
        return;
    }

    const body = request.body as any;
    if (!body || !body.routerModel || !body.providerId || !body.providerModel) {
        reply.code(400).send({ error: "Missing routerModel, providerId, or providerModel parameter" });
        return;
    }

    const provider = await Provider.findByPk(body.providerId);
    if (!provider) {
        reply.code(404).send({ error: "Provider not found" });
        return;
    }

    const route = await ModelRoute.create({
        routerModel: body.routerModel,
        providerId: body.providerId,
        providerModel: body.providerModel,
        priority: body.priority ?? 1,
        weight: body.weight ?? 1,
        isActive: true
    });

    reply.code(201).send(route);
};
