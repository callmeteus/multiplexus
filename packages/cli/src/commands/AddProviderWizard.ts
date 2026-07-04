import * as clack from "@clack/prompts";
import { ApiType } from "@multiplexus/shared";
import { ApiClient } from "../ApiClient";
import { ensureCredentials } from "../config/LocalConfig";
import { t } from "../i18n/index";

/**
 * Adds a provider wizard.
 * @param apiClient The API client.
 */
export async function addProviderWizard(apiClient: ApiClient) {
    await ensureCredentials(apiClient);
    clack.intro(t.menu.addProvider);

    const providers = await apiClient.getProviders().catch(() => [] as any[]);

    const options = [
        { value: "openai", label: "OpenAI" },
        { value: "anthropic", label: "Anthropic" },
        { value: "gemini", label: "Google Gemini (Generous free tier)" },
        { value: "openrouter", label: "OpenRouter (Includes free models)" },
        { value: "z_ai", label: "z.ai" },
        { value: "custom", label: "Custom OpenAI-compatible provider" }
    ];

    const selection = await clack.select({
        message: t.provider.selectPrompt,
        options
    });

    if (clack.isCancel(selection)) {
        return;
    }

    let providerId: number = 0;
    let providerName = selection as string;

    if (selection === "custom") {
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

        const baseUrl = await clack.text({
            message: t.provider.baseUrlPrompt,
            placeholder: "https://api.groq.com/openai/v1",
            validate(value) {
                if (!value) {
                    return "Base URL is required for custom providers";
                }
            }
        });

        if (clack.isCancel(baseUrl)) {
            return;
        }

        const spinner = clack.spinner();
        spinner.start("Registering provider...");

        try {
            const res = await apiClient.createProvider(name as string, ApiType.OPENAI, baseUrl as string);
            providerId = res.id;
            providerName = res.name;
            spinner.stop(t.provider.success);
        } catch (err: any) {
            spinner.stop("Error registering provider");
            clack.log.error(`${t.common.error} ${err.message}`);
            return;
        }
    } else {
        const existing = providers.find((p: any) => p.name === selection);
        if (existing) {
            providerId = existing.id;
        } else {
            const spinner = clack.spinner();
            spinner.start("Registering default provider...");

            try {
                let apiType = ApiType.OPENAI;
                let baseUrl = "";
                if (selection === "anthropic") {
                    apiType = ApiType.ANTHROPIC;
                } else
                if (selection === "gemini") {
                    baseUrl = "https://generativelanguage.googleapis.com/v1beta/openai/v1";
                } else
                if (selection === "openrouter") {
                    baseUrl = "https://openrouter.ai/api/v1";
                } else
                if (selection === "z_ai") {
                    baseUrl = "https://api.z.ai/v1";
                }
 
                const res = await apiClient.createProvider(selection as string, apiType, baseUrl || undefined);
                providerId = res.id;
                spinner.stop(t.provider.success);
            } catch (err: any) {
                spinner.stop("Error registering provider");
                clack.log.error(`${t.common.error} ${err.message}`);
                return;
            }
        }
    }

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
        const guides: Record<string, { step1: string; step2: string; step3: string } | undefined> = t.provider.guides;
        const guide = guides[providerName];

        if (guide) {
            clack.note(`${guide.step1}\n${guide.step2}\n${guide.step3}`, `${providerName} Guide`);
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

    const key = await clack.text({
        message: t.key.enterPrompt,
        validate(value) {
            if (!value) {
                return "API Key cannot be empty";
            }
        }
    });

    if (clack.isCancel(key)) {
        return;
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

    const spinner = clack.spinner();
    spinner.start("Adding API Key to database...");

    try {
        await apiClient.addProviderKey(
            providerId,
            key as string,
            weightInput ? Number(weightInput) : 1,
            (desc as string) || undefined
        );

        spinner.stop(t.key.success);
    } catch (err: any) {
        spinner.stop("Error adding key");
        clack.log.error(`${t.common.error} ${err.message}`);
    }
}
