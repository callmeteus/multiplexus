import { ApiType } from "../../enums/ApiType";
import { ProviderPreset } from "../index";

export const anyapiPreset: ProviderPreset = {
    value: "anyapi",
    apiType: ApiType.OPENAI,
    baseUrl: "https://api.anyapi.ai/v1",
    i18n: {
        en: {
            label: "AnyAPI",
            freeTier: [
                "Free inference tier for public models",
                "Fully compatible with OpenAI SDK"
            ],
            guide: {
                step1: "Go to AnyAPI (https://anyapi.ai/)",
                step2: "Register/Login to your control panel",
                step3: "Copy your API Token from the profile settings page"
            }
        },
        pt: {
            label: "AnyAPI",
            freeTier: [
                "Tier de inferência gratuito para modelos públicos",
                "Compatível com SDK da OpenAI"
            ],
            guide: {
                step1: "Vá para AnyAPI (https://anyapi.ai/)",
                step2: "Cadastre-se ou faça login no painel de controle",
                step3: "Copie seu API Token na página de configurações do perfil"
            }
        }
    }
};