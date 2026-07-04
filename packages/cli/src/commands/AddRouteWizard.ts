import * as clack from "@clack/prompts";
import { ApiClient } from "../ApiClient";
import { ensureCredentials } from "../config/LocalConfig";
import { t } from "../i18n/index";

/**
 * Starts the wizard to register routing targets for an exposed model.
 * @param apiClient The API client.
 */
export async function addRouteWizard(apiClient: ApiClient) {
    await ensureCredentials(apiClient, { requireAdmin: true });
    clack.intro(t.menu.addRoute);

    const providers = await apiClient.getProviders().catch(() => [] as any[]);
    const keys = await apiClient.getProviderKeys().catch(() => [] as any[]);

    const configuredProviders = providers.filter((p: any) => {
        return keys.some((key: any) => {
            const pObj = key.provider || key.Provider;
            return pObj && pObj.id === p.id;
        });
    });

    if (configuredProviders.length === 0) {
        clack.log.warn(t.route.noConfiguredProviders);
        clack.outro("");
        return;
    }

    const routerModel = await clack.text({
        message: t.route.routerModelPrompt,
        placeholder: "gpt-4o",
        validate(value) {
            if (!value) {
                return t.route.routerModelRequired;
            }
        }
    });

    if (clack.isCancel(routerModel)) {
        return;
    }

    // Loop to support configuring multiple target models for the same exposed route model
    while (true) {
        const providerSelection = await clack.select({
            message: t.provider.selectPrompt,
            options: configuredProviders.map((p: any) => ({ value: p.id, label: p.name }))
        });

        if (clack.isCancel(providerSelection)) {
            break;
        }

        const providerModel = await clack.text({
            message: t.route.providerModelPrompt,
            placeholder: "gpt-4o-mini",
            validate(value) {
                if (!value) {
                    return t.route.providerModelRequired;
                }
            }
        });

        if (clack.isCancel(providerModel)) {
            break;
        }

        const priorityInput = await clack.text({
            message: t.route.priorityPrompt,
            placeholder: "1",
            defaultValue: "1",
            validate(value) {
                if (value && isNaN(Number(value))) {
                    return t.route.priorityMustBeNumber;
                }
            }
        });

        if (clack.isCancel(priorityInput)) {
            break;
        }

        const weightInput = await clack.text({
            message: t.route.weightPrompt,
            placeholder: "1",
            defaultValue: "1",
            validate(value) {
                if (value && isNaN(Number(value))) {
                    return t.route.weightMustBeNumber;
                }
            }
        });

        if (clack.isCancel(weightInput)) {
            break;
        }

        const spinner = clack.spinner();
        spinner.start(t.route.configuring);
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
            spinner.stop(t.route.errorConfiguring);
            clack.log.error(`${t.common.error} ${err.message}`);
        }

        const addAnother = await clack.confirm({
            message: t.route.addAnotherPrompt
        });

        if (clack.isCancel(addAnother) || !addAnother) {
            break;
        }
    }
}
