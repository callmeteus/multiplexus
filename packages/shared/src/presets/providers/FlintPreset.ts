import { ApiType } from "../../enums/ApiType";
import { ProviderPreset } from "../index";

export const flintPreset: ProviderPreset = {
    value: "flint",
    apiType: ApiType.OPENAI,
    baseUrl: "https://api.flintapi.ai/v1",
    i18n: {
        en: {
            label: "Flint API",
            freeTier: [
                "Free trial credits upon registration",
                "100% OpenAI-compatible endpoints"
            ],
            guide: {
                step1: "Go to Flint API Docs (https://flintapi.ai/docs)",
                step2: "Sign up for a developer account",
                step3: "Generate and copy your API key"
            }
        },
        pt: {
            label: "Flint API",
            freeTier: [
                "Créditos de teste gratuitos após cadastro",
                "Endpoints 100% compatíveis com OpenAI"
            ],
            guide: {
                step1: "Vá para a documentação da Flint API (https://flintapi.ai/docs)",
                step2: "Cadastre-se para obter uma conta de desenvolvedor",
                step3: "Gere e copie sua chave de API"
            }
        }
    }
};