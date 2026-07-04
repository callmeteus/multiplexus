import { FastifyRequest, FastifyReply } from "fastify";
import { User } from "./models/User";
import { UserRole } from "@multiplexus/shared";

/**
 * Authenticates a user based on the API key in the request headers.
 * @param request The Fastify request object.
 * @param reply The Fastify reply object.
 * @param requiredRole The role required to access the resource.
 * @returns The user object if authenticated, otherwise null.
 */
export async function authenticate(
    request: FastifyRequest,
    reply: FastifyReply,
    requiredRole?: UserRole
): Promise<User | null> {
    const authHeader = request.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        reply.code(401).send({ error: "Missing or invalid authorization header" });
        return null;
    }

    const token = authHeader.substring(7);
    const user = await User.findOne({ where: { apiKey: token } });
    if (!user) {
        reply.code(401).send({ error: "Unauthorized" });
        return null;
    }

    if (requiredRole && user.role !== requiredRole) {
        reply.code(403).send({ error: "Forbidden: insufficient permissions" });
        return null;
    }

    return user;
}
