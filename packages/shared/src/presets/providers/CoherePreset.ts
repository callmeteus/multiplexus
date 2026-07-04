import { ApiType } from "../../enums/ApiType";
import { ProviderPreset } from "../index";

export const coherePreset: ProviderPreset = {
    value: "cohere",
    apiType: ApiType.OPENAI,
    baseUrl: "https://api.cohere.com/compatibility/v1",
    i18n: {
        en: {
            label: "Cohere",
            freeTier: [
                "1,000 free API calls per month",
                "20 RPM Rate Limit",
                "Trial keys for non-commercial use only"
            ],
            guide: {
                step1: "Go to Cohere Dashboard (https://dashboard.cohere.com/)",
                step2: "Navigate to 'API Keys' tab on the menu",
                step3: "Copy your default Trial API Key"
            }
        },
        pt: {
            label: "Cohere",
            freeTier: [
                "1.000 chamadas de API grátis por mês",
                "Limite de 20 RPM",
                "Chaves Trial apenas para fins não comerciais"
            ],
            guide: {
                step1: "Acesse o painel do Cohere (https://dashboard.cohere.com/)",
                step2: "Vá na aba 'API Keys' no menu",
                step3: "Copie sua Trial API Key padrão"
            }
        }
    }
};