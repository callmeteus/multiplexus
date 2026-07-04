import { FastifyRequest, FastifyReply } from "fastify";

export const GET = async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.send({ status: "ok", version: "1.0.0" });
};
