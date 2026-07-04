import * as clack from "@clack/prompts";
import { ApiType, getPresets } from "@multiplexus/shared";
import { ApiClient } from "../ApiClient";
import { ensureCredentials } from "../config/LocalConfig";
import { t } from "../i18n/index";
import { loginGoogle } from "./add_provider_wizard/GoogleLogin";
import { loginAnthropic } from "./add_provider_wizard/AnthropicLogin";
import { loginXai } from "./add_provider_wizard/XaiLogin";

/**
 * Formats the preset label.
 * @param preset The preset.
 * @returns The formatted preset label.
 */
function formatPresetLabel(preset: { label: string; freeTier?: string[] }): string {
    if (preset.freeTier && preset.freeTier.length > 0) {
        return `${preset.label} ${t.provider.freeTierBadge}`;
    }

    return preset.label;
}

export async function addProviderWizard(apiClient: ApiClient) {
    await ensureCredentials(apiClient);
    clack.intro(t.menu.addProvider);

    const isPt = t.menu.welcome.includes("Bem-vindo");
    const lang = isPt ? "pt" : "en";

    let presets: any[] = [];
    try {
        presets = await apiClient.getProviderPresets();
    } catch (err: any) {
        presets = getPresets(lang);
        clack.log.warn("Backend presets unreachable. Loaded presets from local offline cache.");
    }

    const providers = await apiClient.getProviders().catch(() => [] as any[]);

    if (presets.some(p => p.freeTier?.length > 0)) {
        clack.note(t.provider.freeTierLegend);
    }

    const selection = await clack.select({
        message: t.provider.selectPrompt,
        options: presets.map(p => ({ value: p.value, label: formatPresetLabel(p) }))
    });

    if (clack.isCancel(selection)) {
        return;
    }

    const presetName = selection as string;
    const selectedPreset = presets.find(p => p.value === presetName)!;
    let providerName = selectedPreset.label;
    let providerId = 0;
    let apiType = selectedPreset.apiType;
    let baseUrl = selectedPreset.baseUrl;

    // Show free tier benefits if available
    if (selectedPreset.freeTier && selectedPreset.freeTier.length > 0) {
        clack.note(
            selectedPreset.freeTier.map((item: string) => "* " + item).join("\n"),
            `${selectedPreset.label} Free Tier Offerings`
        );
    }

    if (presetName === "custom") {
        const name = await clack.text({
            message: t.provider.namePrompt,
            placeholder: "groq",
            validate(value) {
                if (!value) {
                    return "Provider name is required";
                }
            }
        });

        if (clack.isCancel(name)) {
            return;
        }

        const inputUrl = await clack.text({
            message: t.provider.baseUrlPrompt,
            placeholder: "https://api.groq.com/openai/v1",
            validate(value) {
                if (!value) {
                    return "Base URL is required for custom providers";
                }
            }
        });

        if (clack.isCancel(inputUrl)) {
            return;
        }

        const spinnerReg = clack.spinner();
        spinnerReg.start("Registering provider...");
        try {
            const res = await apiClient.createProvider(name as string, ApiType.OPENAI, inputUrl as string);
            providerId = res.id;
            providerName = res.name;
            apiType = ApiType.OPENAI;
            spinnerReg.stop(t.provider.success);
        } catch (err: any) {
            spinnerReg.stop("Error registering provider");
            clack.log.error(`${t.common.error} dots`.replace("\dots", err.message));
            return;
        }
    } else {
        const existing = providers.find((p: any) => p.name === presetName);
        if (existing) {
            providerId = existing.id;
        } else {
            // Handle cloudflare dynamic account ID URL generation
            if (presetName === "cloudflare") {
                const accountId = await clack.text({
                    message: "Enter your Cloudflare Account ID:",
                    placeholder: "e.g. 1a2b3c4d5e6f...",
                    validate(val) {
                        if (!val) return "Account ID is required";
                    }
                });
                if (clack.isCancel(accountId)) return;
                baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1`;
            }

            const spinnerReg = clack.spinner();
            spinnerReg.start("Registering default provider...");
            try {
                const res = await apiClient.createProvider(presetName, apiType, baseUrl || undefined);
                providerId = res.id;
                spinnerReg.stop(t.provider.success);
            } catch (err: any) {
                spinnerReg.stop("Error registering provider");
                clack.log.error(`${t.common.error} dots`.replace("\dots", err.message));
                return;
            }
        }
    }

    // Ask key entry method
    const authMethod = await clack.select({
        message: "How would you like to add the API Key/Token?",
        options: [
            { value: "manual", label: "Enter key manually" },
            { value: "oauth", label: "Log in via Web Browser (OAuth/Connection)" }
        ]
    });

    if (clack.isCancel(authMethod)) {
        return;
    }

    let key = "";

    if (authMethod === "oauth") {
        clack.log.info("Starting browser OAuth flow...");
        try {
            if (presetName === "gemini") {
                key = await loginGoogle();
            } else
            if (presetName === "anthropic") {
                key = await loginAnthropic();
            } else {
                key = await loginXai();
            }
        } catch (err: any) {
            clack.log.error(`OAuth connection failed: dots`.replace("\dots", err.message));
            return;
        }
    } else {
        // Direct or Step-by-Step key entry
        const mode = await clack.select({
            message: t.key.directOrGuidedPrompt,
            options: [
                { value: "direct", label: t.key.directInput },
                { value: "guided", label: t.key.stepByStep }
            ]
        });

        if (clack.isCancel(mode)) {
            return;
        }

        if (mode === "guided") {
            const guide = selectedPreset.guide;
            if (guide) {
                clack.note(`${guide.step1}\ndots\n${guide.step3}`.replace("\dots", guide.step2), `${providerName} Guide`);
            } else {
                clack.note(`Follow setup instructions for your custom provider '${providerName}' to generate a valid API key.`, "Custom Guide");
            }

            const proceed = await clack.confirm({
                message: "Do you have the API Key ready?"
            });

            if (!proceed || clack.isCancel(proceed)) {
                clack.outro("Aborted key setup");
                return;
            }
        }

        const inputKey = await clack.text({
            message: t.key.enterPrompt,
            validate(value) {
                if (!value) {
                    return "API Key cannot be empty";
                }
            }
        });

        if (clack.isCancel(inputKey)) {
            return;
        }
        key = inputKey as string;
    }

    const weightInput = await clack.text({
        message: t.key.weightPrompt,
        placeholder: "1",
        defaultValue: "1",
        validate(value) {
            if (value && isNaN(Number(value))) {
                return "Weight must be a number";
            }
        }
    });

    if (clack.isCancel(weightInput)) {
        return;
    }

    const desc = await clack.text({
        message: t.key.descPrompt,
        placeholder: "Primary Key"
    });

    if (clack.isCancel(desc)) {
        return;
    }

    const spinnerKey = clack.spinner();
    spinnerKey.start("Adding API Key to database...");
    try {
        await apiClient.addProviderKey(
            providerId,
            key,
            weightInput ? Number(weightInput) : 1,
            (desc as string) || undefined
        );
        spinnerKey.stop(t.key.success);
    } catch (err: any) {
        spinnerKey.stop("Error adding key");
        clack.log.error(`${t.common.error} ${err.message}`);
    }
}