import * as clack from "@clack/prompts";
import { ApiClient } from "../ApiClient";
import { ensureCredentials } from "../config/LocalConfig";
import { t } from "../i18n/index";

/**
 * Adds a route wizard.
 * @param apiClient The API client.
 */
export async function addRouteWizard(apiClient: ApiClient) {
    await ensureCredentials(apiClient);
    clack.intro(t.menu.addRoute);

    const providers = await apiClient.getProviders().catch(() => [] as any[]);
    if (providers.length === 0) {
        clack.log.warn("Please add a provider first before configuring routes.");
        clack.outro("");
        return;
    }

    const routerModel = await clack.text({
        message: t.route.routerModelPrompt,
        placeholder: "gpt-4o",
        validate(value) {
            if (!value) {
                return "Router model name is required";
            }
        }
    });

    if (clack.isCancel(routerModel)) {
        return;
    }

    const providerSelection = await clack.select({
        message: t.provider.selectPrompt,
        options: providers.map((p: any) => ({ value: p.id, label: p.name }))
    });

    if (clack.isCancel(providerSelection)) {
        return;
    }

    const providerModel = await clack.text({
        message: t.route.providerModelPrompt,
        placeholder: "gpt-4o-mini",
        validate(value) {
            if (!value) {
                return "Provider model name is required";
            }
        }
    });

    if (clack.isCancel(providerModel)) {
        return;
    }

    const priorityInput = await clack.text({
        message: t.route.priorityPrompt,
        placeholder: "1",
        defaultValue: "1",
        validate(value) {
            if (value && isNaN(Number(value))) {
                return "Priority must be a number";
            }
        }
    });

    if (clack.isCancel(priorityInput)) {
        return;
    }

    const weightInput = await clack.text({
        message: t.route.weightPrompt,
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

    const spinner = clack.spinner();
    spinner.start("Configuring model route...");
    try {
        await apiClient.createModelRoute(
            routerModel as string,
            Number(providerSelection),
            providerModel as string,
            priorityInput ? Number(priorityInput) : 1,
            weightInput ? Number(weightInput) : 1
        );
        spinner.stop(t.route.success);
    } catch (err: any) {
        spinner.stop("Error configuring route");
        clack.log.error(`${t.common.error} ${err.message}`);
    }
}
