import { ApiType } from "../../enums/ApiType";
import { ProviderPreset } from "../index";

export const cerebrasPreset: ProviderPreset = {
    value: "cerebras",
    apiType: ApiType.OPENAI,
    baseUrl: "https://api.cerebras.ai/v1",
    i18n: {
        en: {
            label: "Cerebras",
            freeTier: [
                "Ultra-fast inference speed (~2,600 tokens/second)",
                "1M tokens per day limit on free tier",
                "8K context limit on free tier"
            ],
            guide: {
                step1: "Go to Cerebras Cloud (https://cloud.cerebras.ai/)",
                step2: "Navigate to API Keys section",
                step3: "Create a new key and copy the token"
            }
        },
        pt: {
            label: "Cerebras",
            freeTier: [
                "Inferência ultra-rápida (~2.600 tokens/segundo)",
                "Limite diário de 1M de tokens no tier grátis",
                "Limite de contexto de 8K no tier grátis"
            ],
            guide: {
                step1: "Acesse a Cerebras Cloud (https://cloud.cerebras.ai/)",
                step2: "Vá na seção de API Keys",
                step3: "Crie uma nova chave e copie seu valor"
            }
        }
    }
};