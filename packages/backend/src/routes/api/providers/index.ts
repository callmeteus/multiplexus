import { FastifyRequest, FastifyReply } from "fastify";
import { authenticate } from "../../../database/Auth";
import { Provider } from "../../../database/models/Provider";
import { UserRole } from "@multiplexus/shared";

export const GET = async (request: FastifyRequest, reply: FastifyReply) => {
    const adminUser = await authenticate(request, reply, UserRole.ADMIN);
    if (!adminUser) {
        return;
    }

    const providers = await Provider.findAll({
        order: [
            ["id", "ASC"]
        ]
    });

    reply.send(providers);
};

export const POST = async (request: FastifyRequest, reply: FastifyReply) => {
    const adminUser = await authenticate(request, reply, UserRole.ADMIN);
    if (!adminUser) {
        return;
    }

    const body = request.body as any;
    if (!body || !body.name || !body.apiType) {
        reply.code(400).send({ error: "Missing name or apiType parameter" });
        return;
    }

    // Check if provider exists
    let provider = await Provider.findOne({
        where: {
            name: body.name
        }
    });

    if (provider) {
        // If it already exists, update and return it
        provider.apiType = body.apiType;
        provider.baseUrl = body.baseUrl || null;
        await provider.save();
    } else {
        provider = await Provider.create({
            name: body.name,
            apiType: body.apiType,
            baseUrl: body.baseUrl || null
        });
    }

    reply.send(provider);
};
