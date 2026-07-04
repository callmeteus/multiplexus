import { ApiType } from "../../enums/ApiType";
import { ProviderPreset } from "../index";

export const geminiPreset: ProviderPreset = {
    value: "gemini",
    apiType: ApiType.OPENAI,
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/v1",
    browserLogin: true,
    i18n: {
        en: {
            label: "Google Gemini",
            freeTier: [
                "15 RPM (Requests Per Minute)",
                "1,500 RPD (Requests Per Day)",
                "1M Context Length (up to 2M on Pro)",
                "Free tier prompts may be used to improve Google products"
            ],
            guide: {
                step1: "Go to Google AI Studio (https://aistudio.google.com/)",
                step2: "Click on 'Get API Key'",
                step3: "Create and copy your Gemini API Key"
            }
        },
        pt: {
            label: "Google Gemini",
            freeTier: [
                "15 RPM (Requisições por minuto)",
                "1.500 RPD (Requisições por dia)",
                "Contexto de 1M de tokens (até 2M no Pro)",
                "Prompts do tier gratuito podem ser usados pelo Google para melhorar serviços"
            ],
            guide: {
                step1: "Vá para o Google AI Studio (https://aistudio.google.com/)",
                step2: "Clique em 'Obter chave de API'",
                step3: "Gere e copie sua chave de API do Gemini"
            }
        }
    }
};