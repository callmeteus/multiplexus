import { FastifyRequest, FastifyReply } from "fastify";
import { getPresets } from "@multiplexus/shared";

export const GET = async (request: FastifyRequest, reply: FastifyReply) => {
    const acceptLanguage = request.headers["accept-language"] || "";
    const lang = acceptLanguage.toLowerCase().includes("pt") ? "pt" : "en";
    
    const presets = getPresets(lang);
    reply.send(presets);
};