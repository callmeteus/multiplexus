import { ApiType } from "../../enums/ApiType";
import { ProviderPreset } from "../index";

export const zaiPreset: ProviderPreset = {
    value: "z_ai",
    apiType: ApiType.OPENAI,
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    i18n: {
        en: {
            label: "Z AI (Zhipu AI)",
            freeTier: [
                "Permanent free flash models (GLM-4.7-Flash)",
                "1 concurrent request rate limit",
                "No credit card required"
            ],
            guide: {
                step1: "Go to Zhipu AI (https://open.bigmodel.cn/)",
                step2: "Register and go to the developer center",
                step3: "Navigate to API Keys and copy the generated key"
            }
        },
        pt: {
            label: "Z AI (Zhipu AI)",
            freeTier: [
                "Modelos flash gratuitos permanentes (GLM-4.7-Flash)",
                "Limite de 1 requisição concorrente",
                "Não necessita de cartão de crédito"
            ],
            guide: {
                step1: "Vá para Zhipu AI (https://open.bigmodel.cn/)",
                step2: "Cadastre-se e vá para o centro do desenvolvedor",
                step3: "Navegue para API Keys e copie a chave gerada"
            }
        }
    }
};