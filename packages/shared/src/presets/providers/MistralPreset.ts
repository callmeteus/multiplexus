import { ApiType } from "../../enums/ApiType";
import { ProviderPreset } from "../index";

export const mistralPreset: ProviderPreset = {
    value: "mistral",
    apiType: ApiType.OPENAI,
    baseUrl: "https://api.mistral.ai/v1",
    i18n: {
        en: {
            label: "Mistral AI",
            freeTier: [
                "Free 'Experiment' plan keys",
                "~1B tokens per month for testing",
                "Prompts may be used to improve Mistral models"
            ],
            guide: {
                step1: "Go to Mistral AI Console (https://console.mistral.ai/)",
                step2: "Navigate to 'API Keys' section",
                step3: "Create a new key and copy the token"
            }
        },
        pt: {
            label: "Mistral AI",
            freeTier: [
                "Chaves gratuitas do plano 'Experiment'",
                "Aproximadamente 1 bilhão de tokens grátis por mês",
                "Prompts podem ser usados para treinar os modelos"
            ],
            guide: {
                step1: "Acesse o console da Mistral AI (https://console.mistral.ai/)",
                step2: "Navegue para 'API Keys' no painel",
                step3: "Crie uma chave e copie o token"
            }
        }
    }
};