import { ApiType } from "../../enums/ApiType";
import { ProviderPreset } from "../index";

export const airforcePreset: ProviderPreset = {
    value: "airforce",
    apiType: ApiType.OPENAI,
    baseUrl: "https://api.airforce/v1",
    i18n: {
        en: {
            label: "API Airforce",
            freeTier: [
                "Free access to various open-source models",
                "No credit card required"
            ],
            guide: {
                step1: "Go to api.airforce (https://api.airforce/)",
                step2: "Log in using GitHub or Email account",
                step3: "Navigate to profile settings and copy your API key"
            }
        },
        pt: {
            label: "API Airforce",
            freeTier: [
                "Acesso gratuito a diversos modelos open-source",
                "Não exige cartão de crédito"
            ],
            guide: {
                step1: "Acesse o site api.airforce (https://api.airforce/)",
                step2: "Faça login usando GitHub ou E-mail",
                step3: "Vá nas configurações do perfil e copie sua chave"
            }
        }
    }
};