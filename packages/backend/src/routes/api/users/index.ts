import { FastifyRequest, FastifyReply } from "fastify";
import * as crypto from "crypto";
import { authenticate } from "../../../database/Auth";
import { User } from "../../../database/models/User";
import { UserRole } from "@multiplexus/shared";

export const GET = async (request: FastifyRequest, reply: FastifyReply) => {
    const adminUser = await authenticate(request, reply, UserRole.ADMIN);
    if (!adminUser) {
        return;
    }

    const users = await User.findAll({
        order: [
            ["id", "ASC"]
        ]
    });

    reply.send(users);
};

export const POST = async (request: FastifyRequest, reply: FastifyReply) => {
    const adminUser = await authenticate(request, reply, UserRole.ADMIN);
    if (!adminUser) {
        return;
    }

    const body = request.body as any;
    if (!body || !body.name) {
        reply.code(400).send({ error: "Missing name parameter" });
        return;
    }

    const role = body.role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.USER;
    const apiKey = `sk-mux-${crypto.randomBytes(24).toString("hex")}`;

    const newUser = await User.create({
        name: body.name,
        apiKey,
        role
    });

    reply.code(201).send(newUser);
};
