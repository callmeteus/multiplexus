import { ApiType } from "../enums/ApiType";
import { openaiPreset } from "./providers/OpenAiPreset";
import { anthropicPreset } from "./providers/AnthropicPreset";
import { geminiPreset } from "./providers/GeminiPreset";
import { coherePreset } from "./providers/CoherePreset";
import { mistralPreset } from "./providers/MistralPreset";
import { aionlabsPreset } from "./providers/AionLabsPreset";
import { zaiPreset } from "./providers/ZAiPreset";
import { cerebrasPreset } from "./providers/CerebrasPreset";
import { cloudflarePreset } from "./providers/CloudflarePreset";
import { flintPreset } from "./providers/FlintPreset";
import { anyapiPreset } from "./providers/AnyApiPreset";
import { airforcePreset } from "./providers/AirforcePreset";
import { inceptionPreset } from "./providers/InceptionPreset";
import { openrouterPreset } from "./providers/OpenRouterPreset";
import { customPreset } from "./providers/CustomPreset";

export interface ProviderPreset {
    /**
     * The value of the preset.
     */
    value: string;

    /**
     * The API type of the preset.
     */
    apiType: ApiType;

    /**
     * The base URL of the preset.
     */
    baseUrl: string;

    /**
     * Free tier offerings for this provider.
     */
    freeTier?: string[];

    /**
     * When true, the CLI may offer browser OAuth login for this provider.
     */
    browserLogin?: boolean;
    i18n: {
        en: {
            label: string;
            freeTier: string[];
            guide: {
                step1: string;
                step2: string;
                step3: string;
            } | null;
        };
        pt: {
            label: string;
            freeTier: string[];
            guide: {
                step1: string;
                step2: string;
                step3: string;
            } | null;
        };
    };
}

export const PRESETS: ProviderPreset[] = [
    openaiPreset,
    anthropicPreset,
    geminiPreset,
    coherePreset,
    mistralPreset,
    aionlabsPreset,
    zaiPreset,
    cerebrasPreset,
    cloudflarePreset,
    flintPreset,
    anyapiPreset,
    airforcePreset,
    inceptionPreset,
    openrouterPreset,
    customPreset
];

export function getPresets(lang: string) {
    const isPt = lang.toLowerCase().includes("pt");
    const l = isPt ? "pt" : "en";

    return PRESETS.map(p => {
        const info = p.i18n[l] || p.i18n.en;
        return {
            value: p.value,
            label: info.label,
            apiType: p.apiType,
            baseUrl: p.baseUrl,
            freeTier: info.freeTier,
            guide: info.guide,
            browserLogin: p.browserLogin ?? false
        };
    });
}