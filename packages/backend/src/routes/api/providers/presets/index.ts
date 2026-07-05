import { FastifyRequest, FastifyReply } from "fastify";
import { getPresets as getSharedPresets } from "@multiplexus/shared";
import { getBackendProviderPresets } from "../../../../providers/Catalog";

export const GET = async (request: FastifyRequest, reply: FastifyReply) => {
    const acceptLanguage = request.headers["accept-language"] || "";
    const lang = acceptLanguage.toLowerCase().includes("pt") ? "pt" : "en";

    const presets = [
        ...getSharedPresets(lang),
        ...getBackendProviderPresets(lang)
    ];

    reply.send(presets);
};
