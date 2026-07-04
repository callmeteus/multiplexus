import { ApiType } from "../../enums/ApiType";
import { ProviderPreset } from "../index";

export const cloudflarePreset: ProviderPreset = {
    value: "cloudflare",
    apiType: ApiType.OPENAI,
    baseUrl: "",
    i18n: {
        en: {
            label: "Cloudflare Workers AI",
            freeTier: [
                "10,000 Neurons per day free",
                "50+ open-weight models available",
                "Shared concurrent queues"
            ],
            guide: {
                step1: "Go to Cloudflare Dashboard (https://dash.cloudflare.com/)",
                step2: "Generate an API token with Workers AI Read permission",
                step3: "Copy the Token and find your Account ID on the home dashboard"
            }
        },
        pt: {
            label: "Cloudflare Workers AI",
            freeTier: [
                "10.000 Neurons grátis por dia",
                "Mais de 50 modelos open-weight disponíveis",
                "Filas concorrentes compartilhadas"
            ],
            guide: {
                step1: "Acesse o painel do Cloudflare (https://dash.cloudflare.com/)",
                step2: "Gere um token de API com permissão de leitura para Workers AI",
                step3: "Copie o Token e pegue o Account ID na home do painel"
            }
        }
    }
};