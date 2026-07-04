import { FastifyRequest, FastifyReply } from "fastify";
import { authenticate } from "../../database/Auth";
import { ModelRoute } from "../../database/models/ModelRoute";

export const GET = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await authenticate(request, reply);
    if (!user) {
        return;
    }

    // Find all distinct active model routes
    const routes = await ModelRoute.findAll({
        where: {
            isActive: true
        },
        attributes: [
            "routerModel"
        ],
        group: [
            "routerModel"
        ]
    });

    const models = routes.map((r, index) => {
        return {
            id: r.routerModel,
            object: "model",
            created: Math.floor(Date.now() / 1000) - index * 60, // Mock realistic timestamp
            owned_by: "multiplexus"
        };
    });

    reply.send({
        object: "list",
        data: models
    });
};
