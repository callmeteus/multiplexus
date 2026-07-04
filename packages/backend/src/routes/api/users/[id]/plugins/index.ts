import { FastifyRequest, FastifyReply } from "fastify";
import { authenticate } from "../../../../../database/Auth";
import { User } from "../../../../../database/models/User";
import { UserPlugin } from "../../../../../database/models/UserPlugin";
import { UserRole } from "@multiplexus/shared";
import { SUPPORTED_PLUGINS } from "../../../../../plugins";

export const GET = async (request: FastifyRequest, reply: FastifyReply) => {
    const adminUser = await authenticate(request, reply, UserRole.ADMIN);
    if (!adminUser) {
        return;
    }

    const { id } = request.params as { id: string };
    const targetUser = await User.findByPk(id);
    if (!targetUser) {
        reply.code(404).send({ error: "User not found" });
        return;
    }

    const activePlugins = await UserPlugin.findAll({
        where: {
            userId: targetUser.id
        }
    });

    const result = SUPPORTED_PLUGINS.map((name: string) => {
        const found = activePlugins.find(p => p.pluginName === name);
        return {
            name,
            isEnabled: found ? found.isEnabled : false
        };
    });

    reply.send(result);
};

export const POST = async (request: FastifyRequest, reply: FastifyReply) => {
    const adminUser = await authenticate(request, reply, UserRole.ADMIN);
    if (!adminUser) {
        return;
    }

    const { id } = request.params as { id: string };
    const targetUser = await User.findByPk(id);
    if (!targetUser) {
        reply.code(404).send({ error: "User not found" });
        return;
    }

    const body = request.body as any;
    if (!body || !body.pluginName || typeof body.isEnabled !== "boolean") {
        reply.code(400).send({ error: "Missing pluginName or isEnabled parameter" });
        return;
    }

    if (!SUPPORTED_PLUGINS.includes(body.pluginName)) {
        reply.code(400).send({ error: `Plugin "${body.pluginName}" is not supported` });
        return;
    }

    let userPlugin = await UserPlugin.findOne({
        where: {
            userId: targetUser.id,
            pluginName: body.pluginName
        }
    });

    if (userPlugin) {
        userPlugin.isEnabled = body.isEnabled;
        await userPlugin.save();
    } else {
        userPlugin = await UserPlugin.create({
            userId: targetUser.id,
            pluginName: body.pluginName,
            isEnabled: body.isEnabled
        });
    }

    reply.send(userPlugin);
};