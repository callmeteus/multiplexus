import * as clack from "@clack/prompts";
import chalk from "chalk";
import { ApiClient } from "../ApiClient";
import { handleCancel } from "./ProcessUtils";
import { t } from "../i18n/index";

/**
 * A single model option ready for display in clack.select.
 */
export interface ModelOption {
    value: string;
    label: string;
    hint?: string;
}

/**
 * Formats a price in dollars-per-million-tokens into a compact human-readable string.
 * @param pricePerM Price per million tokens in USD.
 * @returns Formatted string like "$0.50/1M" or "FREE".
 */
function formatPricePerM(pricePerM: number | null): string {
    if (pricePerM === null) {
        return "";
    }

    if (pricePerM === 0) {
        return chalk.green("FREE");
    }

    if (pricePerM < 0.01) {
        return chalk.cyan(`$${(pricePerM).toFixed(4)}/1M`);
    }

    return chalk.yellow(`$${pricePerM.toFixed(2)}/1M`);
}

/**
 * Converts raw discovered model data to clack select options with pricing labels.
 * @param models Raw models from the backend discovery endpoint.
 * @returns Formatted options array.
 */
function buildModelOptions(models: any[]): ModelOption[] {
    return models.map((m) => {
        let pricing: string;

        if (m.isFree) {
            pricing = ` ${chalk.green("[FREE]")}`;
        } else
        if (m.promptPricePerM !== null && m.completionPricePerM !== null) {
            pricing = ` ${chalk.gray(`[in: ${formatPricePerM(m.promptPricePerM)} | out: ${formatPricePerM(m.completionPricePerM)}]`)}`;
        } else {
            pricing = ` ${chalk.gray("[no pricing info]")}`;
        }

        return {
            value: m.id as string,
            label: `${m.id}${pricing}`,
            hint: m.name !== m.id ? m.name : undefined
        };
    });
}

/**
 * Runs an interactive model selection prompt for a given provider.
 * If the provider supports model discovery, shows a searchable select with pricing.
 * Falls back to a plain text input if discovery is not supported or fails.
 *
 * @param apiClient The API client.
 * @param providerId The numeric ID of the selected provider.
 * @param providerName The display name of the provider.
 * @returns The selected or manually entered model ID, or null if cancelled.
 */
export async function promptProviderModel(
    apiClient: ApiClient,
    providerId: number,
    providerName: string
): Promise<string | null> {
    // Try to fetch models from backend discovery endpoint
    let models: any[] | null = null;

    const spinner = clack.spinner();
    spinner.start(`Fetching available models from ${providerName}...`);
    try {
        models = await apiClient.getProviderModels(providerId);

        if (models && models.length > 0) {
            spinner.stop(`Found ${models.length} models for ${providerName}.`);
        } else {
            spinner.stop("Model discovery not supported, entering manually.");
        }
    } catch (_err) {
        spinner.stop("Could not fetch models, entering manually.");
        models = null;
    }

    if (!models || models.length === 0) {
        // Fallback: plain text input
        const value = await clack.text({
            message: t.route.providerModelPrompt,
            placeholder: "gpt-4o-mini",
            validate(val) {
                if (!val) {
                    return t.route.providerModelRequired;
                }
            }
        });

        handleCancel(value);
        return value as string;
    }

    // Filter step — let the user narrow down the list before selecting
    const filterInput = await clack.text({
        message: `${t.route.modelFilterPrompt} (${chalk.gray("Enter to show all")})`,
        placeholder: "e.g. gpt, claude, gemini...",
        defaultValue: ""
    });

    handleCancel(filterInput);

    const filterText = (filterInput as string).toLowerCase().trim();
    const filteredModels = filterText
        ? models.filter((m) =>
            m.id.toLowerCase().includes(filterText) ||
            (m.name && m.name.toLowerCase().includes(filterText))
        )
        : models;

    if (filteredModels.length === 0) {
        clack.log.warn(`No models matched "${filterText}". Showing all.`);
    }

    const displayModels = filteredModels.length > 0 ? filteredModels : models;
    const options = buildModelOptions(displayModels);

    // Append manual entry option at the bottom
    options.push({
        value: "__manual__",
        label: chalk.gray("Enter model ID manually...")
    });

    const selection = await clack.select({
        message: t.route.providerModelPrompt,
        options,
        maxItems: 12
    });

    handleCancel(selection);

    if (selection === "__manual__") {
        const value = await clack.text({
            message: t.route.providerModelPrompt,
            placeholder: "gpt-4o-mini",
            validate(val) {
                if (!val) {
                    return t.route.providerModelRequired;
                }
            }
        });

        handleCancel(value);
        return value as string;
    }

    return selection as string;
}
