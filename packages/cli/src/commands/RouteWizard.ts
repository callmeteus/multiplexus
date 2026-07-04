import * as clack from "@clack/prompts";
import chalk from "chalk";
import { ApiClient } from "../ApiClient";
import { ensureCredentials } from "../config/LocalConfig";
import { t } from "../i18n/index";
import { handleCancel } from "../utils/ProcessUtils";
import { promptProviderModel } from "../utils/ModelDiscovery";

/**
 * Prompts for routing target details and registers the target route.
 * @param apiClient The API client.
 * @param routerModel The exposed router model name.
 * @param configuredProviders The list of providers with keys.
 * @returns A promise that resolves to true if a route was created, false otherwise.
 */
async function promptAndAddTargetRoute(
    apiClient: ApiClient,
    routerModel: string,
    configuredProviders: any[]
): Promise<boolean> {
    const providerSelection = await clack.select({
        message: t.provider.selectPrompt,
        options: configuredProviders.map((p: any) => ({ value: p.id, label: p.name }))
    });

    handleCancel(providerSelection);

    const selectedProvider = configuredProviders.find((p: any) => p.id === providerSelection)!;

    const providerModel = await promptProviderModel(
        apiClient,
        Number(providerSelection),
        selectedProvider.name
    );

    if (!providerModel) {
        return false;
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

    handleCancel(priorityInput);

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

    handleCancel(weightInput);

    const spinner = clack.spinner();
    spinner.start(t.route.configuring);

    try {
        await apiClient.createModelRoute(
            routerModel,
            Number(providerSelection),
            providerModel,
            priorityInput ? Number(priorityInput) : 1,
            weightInput ? Number(weightInput) : 1
        );

        spinner.stop(t.route.success);
        return true;
    } catch (err: any) {
        spinner.stop("");
        clack.log.error(chalk.red(`${t.route.errorConfiguring}: ${err.message}`));
        return false;
    }
}

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

    while (true) {
        const success = await promptAndAddTargetRoute(apiClient, routerModel, configuredProviders);
        if (!success) {
            break;
        }

        const addAnother = await clack.confirm({
            message: t.route.addAnotherPrompt
        });

        if (clack.isCancel(addAnother) || !addAnother) {
            break;
        }
    }
}

/**
 * Starts the wizard to edit an existing model route.
 * @param apiClient The API client.
 */
export async function editRouteWizard(apiClient: ApiClient) {
    await ensureCredentials(apiClient, { requireAdmin: true });
    clack.intro(t.menu.editRoute);

    const routes = await apiClient.getModelRoutes().catch(() => [] as any[]);
    if (routes.length === 0) {
        clack.log.warn(t.route.listEmpty);
        clack.outro("");
        return;
    }

    const selection = await clack.select({
        message: t.route.editSelect,
        options: routes.map((r: any) => {
            const providerName = r.provider?.name || "unknown";
            const statusLabel = r.isActive ? t.route.statusActive : t.route.statusInactive;
            return {
                value: r.id,
                label: `${r.routerModel} -> ${providerName} (${r.providerModel}) [Priority: ${r.priority}, Weight: ${r.weight}] (${statusLabel})`
            };
        })
    });

    if (clack.isCancel(selection)) {
        return;
    }

    const routeId = Number(selection);

    const providers = await apiClient.getProviders().catch(() => [] as any[]);
    const keys = await apiClient.getProviderKeys().catch(() => [] as any[]);
    const configuredProviders = providers.filter((p: any) => {
        return keys.some((key: any) => {
            const pObj = key.provider || key.Provider;
            return pObj && pObj.id === p.id;
        });
    });

    while (true) {
        // Fetch fresh route list to present updated state on each loop iteration
        const currentRoutes = await apiClient.getModelRoutes().catch(() => [] as any[]);
        const currentRoute = currentRoutes.find((r: any) => r.id === routeId);

        if (!currentRoute) {
            break;
        }

        const activeCheckbox = currentRoute.isActive ? chalk.green("[x]") : chalk.gray("[ ]");

        const fieldSelection = await clack.select({
            message: t.route.editPrompt,
            options: [
                { value: "addTargetModel", label: t.route.editAddTarget },
                { value: "providerModel", label: `${t.route.editProviderModel} (current: ${currentRoute.providerModel})` },
                { value: "priority", label: `${t.route.editPriority} (current: ${currentRoute.priority})` },
                { value: "weight", label: `${t.route.editWeight} (current: ${currentRoute.weight})` },
                { value: "isActive", label: `${activeCheckbox} ${t.route.editStatus}` },
                { value: "back", label: t.menu.back }
            ]
        });

        if (clack.isCancel(fieldSelection) || fieldSelection === "back") {
            break;
        }

        const field = fieldSelection as string;

        if (field === "addTargetModel") {
            await promptAndAddTargetRoute(apiClient, currentRoute.routerModel, configuredProviders);
            continue;
        }

        const updates: any = {};

        if (field === "providerModel") {
            const value = await clack.text({
                message: t.route.providerModelPrompt,
                defaultValue: currentRoute.providerModel,
                validate(val) {
                    if (!val) {
                        return t.route.providerModelRequired;
                    }
                }
            });

            if (clack.isCancel(value)) {
                continue;
            }
            updates.providerModel = value;
        } else
        if (field === "priority") {
            const value = await clack.text({
                message: t.route.priorityPrompt,
                defaultValue: String(currentRoute.priority),
                validate(val) {
                    if (!val || isNaN(Number(val))) {
                        return t.route.priorityMustBeNumber;
                    }
                }
            });

            if (clack.isCancel(value)) {
                continue;
            }
            updates.priority = Number(value);
        } else
        if (field === "weight") {
            const value = await clack.text({
                message: t.route.weightPrompt,
                defaultValue: String(currentRoute.weight),
                validate(val) {
                    if (!val || isNaN(Number(val))) {
                        return t.route.weightMustBeNumber;
                    }
                }
            });

            if (clack.isCancel(value)) {
                continue;
            }
            updates.weight = Number(value);
        } else
        if (field === "isActive") {
            updates.isActive = !currentRoute.isActive;
        }

        const spinner = clack.spinner();
        spinner.start(t.route.configuring);
        try {
            await apiClient.updateModelRoute(routeId, updates);
            spinner.stop(t.route.editSuccess);
        } catch (err: any) {
            spinner.stop(""); // Avoid showing green mark for error message
            clack.log.error(chalk.red(`${t.route.errorConfiguring}: ${err.message}`));
            if (err.stack) {
                clack.log.error(chalk.gray(err.stack));
            }
        }
    }
}

/**
 * Starts the wizard to delete a model route.
 * @param apiClient The API client.
 */
export async function deleteRouteWizard(apiClient: ApiClient) {
    await ensureCredentials(apiClient, { requireAdmin: true });
    clack.intro(t.menu.deleteRoute);

    const routes = await apiClient.getModelRoutes().catch(() => [] as any[]);
    if (routes.length === 0) {
        clack.log.warn(t.route.listEmpty);
        clack.outro("");
        return;
    }

    const selection = await clack.select({
        message: t.route.deleteSelect,
        options: routes.map((r: any) => {
            const providerName = r.provider?.name || "unknown";
            const statusLabel = r.isActive ? t.route.statusActive : t.route.statusInactive;
            return {
                value: r.id,
                label: `${r.routerModel} -> ${providerName} (${r.providerModel}) (${statusLabel})`
            };
        })
    });

    if (clack.isCancel(selection)) {
        return;
    }

    const routeId = Number(selection);

    const confirm = await clack.confirm({
        message: t.route.deleteConfirm
    });

    if (!confirm || clack.isCancel(confirm)) {
        return;
    }

    const spinner = clack.spinner();
    spinner.start(t.route.configuring);
    try {
        await apiClient.deleteModelRoute(routeId);
        spinner.stop(t.route.deleteSuccess);
    } catch (err: any) {
        spinner.stop(t.route.errorConfiguring);
        clack.log.error(`${t.common.error} ${err.message}`);
    }
}

/**
 * Starts the wizard to list configured model routes.
 * @param apiClient The API client.
 */
export async function listRoutesWizard(apiClient: ApiClient) {
    await ensureCredentials(apiClient, { requireAdmin: true });
    clack.intro(t.menu.listRoutes);

    const spinner = clack.spinner();
    spinner.start("Loading routes...");
    try {
        const routes = await apiClient.getModelRoutes();
        spinner.stop("Loaded routes successfully!");

        if (routes.length === 0) {
            clack.log.info(t.route.listEmpty);
            clack.outro("");
            return;
        }

        const listContent = routes
            .map((r: any) => {
                const providerName = r.provider?.name || "unknown";
                const statusLabel = r.isActive ? t.route.statusActive : t.route.statusInactive;
                return `- Exposed Model: ${r.routerModel}\n  Target:        ${providerName} (${r.providerModel})\n  Priority:      ${r.priority} | Weight: ${r.weight} | Status: ${statusLabel}`;
            })
            .join("\n\n");

        clack.note(listContent, t.route.listTitle);
    } catch (err: any) {
        spinner.stop("Error loading routes");
        clack.log.error(`${t.common.error} ${err.message}`);
    }

    clack.outro("");
}
