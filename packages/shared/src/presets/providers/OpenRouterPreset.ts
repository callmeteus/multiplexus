import { ApiType } from "../../enums/ApiType";
import { ProviderPreset } from "../index";

export const openrouterPreset: ProviderPreset = {
    value: "openrouter",
    apiType: ApiType.OPENAI,
    baseUrl: "https://openrouter.ai/api/v1",
    i18n: {
        en: {
            label: "OpenRouter",
            freeTier: [
                "Access to various free open-source models",
                "Seamless rotation based on upstream status"
            ],
            guide: {
                step1: "Go to OpenRouter (https://openrouter.ai/)",
                step2: "Navigate to API Keys section",
                step3: "Create a new key and copy the token value"
            }
        },
        pt: {
            label: "OpenRouter",
            freeTier: [
                "Modelos open-source gratuitos disponíveis",
                "Rotação transparente com base no status do upstream"
            ],
            guide: {
                step1: "Vá para o site do OpenRouter (https://openrouter.ai/)",
                step2: "Navegue para API Keys",
                step3: "Crie uma nova chave e copie seu valor"
            }
        }
    }
};