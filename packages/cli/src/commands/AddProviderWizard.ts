import * as clack from "@clack/prompts";
import chalk from "chalk";
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
 * @param isConfigured Whether the provider has keys configured.
 * @returns The formatted preset label.
 */
function formatPresetLabel(preset: { label: string; freeTier?: string[] }, isConfigured: boolean): string {
    const symbol = isConfigured ? chalk.green("[*] ") : chalk.gray("[ ] ");
    if (preset.freeTier && preset.freeTier.length > 0) {
        return `${symbol}${preset.label} ${chalk.yellow("(*)")} ${t.provider.freeTierBadge}`;
    }

    return `${symbol}${preset.label}`;
}

/**
 * Starts the wizard to register a new LLM provider and configure its credentials.
 * @param apiClient The API client.
 */
export async function addProviderWizard(apiClient: ApiClient) {
    await ensureCredentials(apiClient, { requireAdmin: true });
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

    const keys = await apiClient.getProviderKeys().catch(() => [] as any[]);
    const providers = await apiClient.getProviders().catch(() => [] as any[]);

    if (presets.some(p => p.freeTier?.length > 0)) {
        clack.note(`${chalk.yellow("(*)")} = ${t.provider.freeTierLegend}`);
    }

    const selection = await clack.select({
        message: t.provider.selectPrompt,
        options: presets.map(p => {
            const isConfigured = keys.some((key: any) => {
                const pObj = key.provider || key.Provider;
                return pObj && pObj.name === p.value;
            });
            return {
                value: p.value,
                label: formatPresetLabel(p, isConfigured)
            };
        })
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
                    return t.provider.nameRequired;
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
                    return t.provider.baseUrlRequired;
                }
            }
        });

        if (clack.isCancel(inputUrl)) {
            return;
        }

        const spinnerReg = clack.spinner();
        spinnerReg.start(t.provider.registering);

        try {
            const res = await apiClient.createProvider(name as string, ApiType.OPENAI, inputUrl as string);
            providerId = res.id;
            providerName = res.name;
            apiType = ApiType.OPENAI;
            spinnerReg.stop(t.provider.success);
        } catch (err: any) {
            spinnerReg.stop(t.provider.errorRegistering);
            clack.log.error(`${t.common.error} ${err.message}`);
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
                    message: t.provider.cloudflareAccountIdPrompt,
                    placeholder: "e.g. 1a2b3c4d5e6f...",
                    validate(val) {
                        if (!val) {
                            return t.provider.cloudflareAccountIdRequired;
                        }
                    }
                });

                if (clack.isCancel(accountId)) {
                    return;
                }

                baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1`;
            }

            const spinnerReg = clack.spinner();
            spinnerReg.start(t.provider.registeringDefault);

            try {
                const res = await apiClient.createProvider(presetName, apiType, baseUrl || undefined);
                providerId = res.id;
                spinnerReg.stop(t.provider.success);
            } catch (err: any) {
                spinnerReg.stop(t.provider.errorRegistering);
                clack.log.error(`${t.common.error} ${err.message}`);
                return;
            }
        }
    }

    let authMethod: "manual" | "oauth" = "manual";

    if (selectedPreset.browserLogin) {
        const authSelection = await clack.select({
            message: t.provider.keyAuthMethodPrompt,
            options: [
                { value: "manual", label: t.provider.keyAuthMethodManual },
                { value: "oauth", label: t.provider.keyAuthMethodOAuth }
            ]
        });

        if (clack.isCancel(authSelection)) {
            return;
        }

        authMethod = authSelection as "manual" | "oauth";
    }

    let key = "";

    if (authMethod === "oauth") {
        clack.log.info(t.provider.oauthStarting);

        try {
            switch (presetName) {
                case "gemini":
                    key = await loginGoogle();
                    break;
                case "anthropic":
                    key = await loginAnthropic();
                    break;
                case "xai":
                    key = await loginXai();
                    break;
            }
    
        } catch (err: any) {
            clack.log.error(`${t.provider.oauthFailed}: ${err.message}`);
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
                clack.note(`${guide.step1}\n${guide.step2}\n${guide.step3}`, `${providerName} Guide`);
            } else {
                const customGuideMsg = t.provider.customGuideText.replace("{name}", providerName);
                clack.note(customGuideMsg, t.provider.customGuideTitle);
            }

            const proceed = await clack.confirm({
                message: t.provider.keyReadyConfirm
            });

            if (!proceed || clack.isCancel(proceed)) {
                clack.outro(t.provider.keySetupAborted);
                return;
            }
        }

        const inputKey = await clack.text({
            message: t.key.enterPrompt,
            validate(value) {
                if (!value) {
                    return t.key.keyRequired;
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
                return t.key.weightMustBeNumber;
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
    spinnerKey.start(t.key.adding);
    try {
        await apiClient.addProviderKey(
            providerId,
            key,
            weightInput ? Number(weightInput) : 1,
            (desc as string) || undefined
        );

        spinnerKey.stop(t.key.success);
    } catch (err: any) {
        spinnerKey.stop(t.key.errorAdding);
        clack.log.error(`${t.common.error} ${err.message}`);
    }
}