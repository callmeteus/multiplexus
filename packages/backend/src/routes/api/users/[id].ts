import { FastifyRequest, FastifyReply } from "fastify";
import { authenticate } from "../../../database/Auth";
import { User } from "../../../database/models/User";
import { UserRole } from "@multiplexus/shared";

export const DELETE = async (request: FastifyRequest, reply: FastifyReply) => {
    const adminUser = await authenticate(request, reply, UserRole.ADMIN);
    if (!adminUser) {
        return;
    }

    const { id } = request.params as { id: string };
    const userToDelete = await User.findByPk(id);

    if (!userToDelete) {
        reply.code(404).send({ error: "User not found" });
        return;
    }

    if (userToDelete.id === adminUser.id) {
        reply.code(400).send({ error: "Cannot delete yourself" });
        return;
    }

    await userToDelete.destroy();
    reply.send({ success: true, message: `User ${userToDelete.name} deleted` });
};
