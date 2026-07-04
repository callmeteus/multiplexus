import { ApiType } from "../../enums/ApiType";
import { ProviderPreset } from "../index";

export const anthropicPreset: ProviderPreset = {
    value: "anthropic",
    apiType: ApiType.ANTHROPIC,
    baseUrl: "https://api.anthropic.com/v1",
    i18n: {
        en: {
            label: "Anthropic",
            freeTier: [],
            guide: {
                step1: "Go to Anthropic Console (https://console.anthropic.com/)",
                step2: "Navigate to API Keys section",
                step3: "Create and copy your API key"
            }
        },
        pt: {
            label: "Anthropic",
            freeTier: [],
            guide: {
                step1: "Vá para o Anthropic Console (https://console.anthropic.com/)",
                step2: "Navegue para API Keys",
                step3: "Crie e copie sua chave de API"
            }
        }
    }
};