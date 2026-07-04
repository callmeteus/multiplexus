import { ApiType } from "../../enums/ApiType";
import { ProviderPreset } from "../index";

export const customPreset: ProviderPreset = {
    value: "custom",
    apiType: ApiType.OPENAI,
    baseUrl: "",
    i18n: {
        en: {
            label: "Custom OpenAI-compatible provider",
            freeTier: [],
            guide: null
        },
        pt: {
            label: "Provedor personalizado compatível com OpenAI",
            freeTier: [],
            guide: null
        }
    }
};