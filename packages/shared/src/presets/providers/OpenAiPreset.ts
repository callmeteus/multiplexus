import { ApiType } from "../../enums/ApiType";
import { ProviderPreset } from "../index";

export const openaiPreset: ProviderPreset = {
    value: "openai",
    apiType: ApiType.OPENAI,
    baseUrl: "",
    i18n: {
        en: {
            label: "OpenAI",
            freeTier: [],
            guide: null
        },
        pt: {
            label: "OpenAI",
            freeTier: [],
            guide: null
        }
    }
};