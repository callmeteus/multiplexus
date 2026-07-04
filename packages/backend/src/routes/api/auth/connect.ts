import { FastifyRequest, FastifyReply } from "fastify";

/**
 * Browser OAuth entry point for the CLI login wizards.
 * Redirects back to the local CLI callback server with a token.
 */
export const GET = async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as { provider?: string; port?: string };
    const provider = query.provider || "unknown";
    const port = query.port || "5678";
    const token = `mock-oauth-${provider}-token-123`;

    return reply.redirect(`http://localhost:${port}/callback?token=${encodeURIComponent(token)}`);
};
