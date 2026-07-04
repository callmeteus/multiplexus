import { ApiType } from "../../enums/ApiType";
import { ProviderPreset } from "../index";

export const inceptionPreset: ProviderPreset = {
    value: "inception",
    apiType: ApiType.OPENAI,
    baseUrl: "https://api.inceptionlabs.ai/v1",
    i18n: {
        en: {
            label: "Inception Labs",
            freeTier: [
                "Free credits for developers",
                "Support for agentic-focused models"
            ],
            guide: {
                step1: "Go to Inception Labs (https://www.inceptionlabs.ai/)",
                step2: "Register for a developer account",
                step3: "Navigate to API keys tab and generate your token"
            }
        },
        pt: {
            label: "Inception Labs",
            freeTier: [
                "Créditos gratuitos para desenvolvedores",
                "Suporte a modelos focados em agentes autônomos"
            ],
            guide: {
                step1: "Acesse o site Inception Labs (https://www.inceptionlabs.ai/)",
                step2: "Cadastre-se na conta de desenvolvedor",
                step3: "Navegue para a aba de chaves e gere seu token"
            }
        }
    }
};