import { ApiType } from "../../enums/ApiType";
import { ProviderPreset } from "../index";

export const aionlabsPreset: ProviderPreset = {
    value: "aionlabs",
    apiType: ApiType.OPENAI,
    baseUrl: "https://api.aionlabs.ai/v1",
    i18n: {
        en: {
            label: "Aion Labs",
            freeTier: [
                "15 RPM Rate Limit",
                "20K tokens per day limit",
                "Specialized for roleplay and storytelling"
            ],
            guide: {
                step1: "Go to Aion Labs (https://www.aionlabs.ai/)",
                step2: "Sign up on their developer platform",
                step3: "Navigate to keys and generate your credential"
            }
        },
        pt: {
            label: "Aion Labs",
            freeTier: [
                "Limite de 15 RPM",
                "20K tokens por dia",
                "Especializado em roleplay e narrativa"
            ],
            guide: {
                step1: "Vá para Aion Labs (https://www.aionlabs.ai/)",
                step2: "Cadastre-se na plataforma de desenvolvedor",
                step3: "Navegue para chaves e gere sua credencial"
            }
        }
    }
};