#!/usr/bin/env node
import * as clack from "@clack/prompts";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { ApiClient } from "./ApiClient";
import { t } from "./i18n/index";
import { addProviderWizard } from "./commands/AddProviderWizard";
import {
    addRouteWizard,
    editRouteWizard,
    deleteRouteWizard,
    listRoutesWizard
} from "./commands/RouteWizard";
import { generateClientKeyWizard, listUsersWizard } from "./commands/AddUserWizard";
import { helpWizard } from "./commands/HelpWizard";
import { startBackendWizard, stopBackendWizard } from "./commands/StartWizard";
import { managePluginsWizard } from "./commands/PluginWizard";
import { listProvidersWizard } from "./commands/ListProvidersWizard";
import { checkServerReady } from "./utils/ProcessUtils";
import { handleCancel } from "./utils/ProcessUtils";

const apiClient = new ApiClient();

/**
 * Runs the interactive menu organized by categories.
 */
async function runInteractiveMenu() {
    clack.intro(t.menu.welcome);

    while (true) {
        const category = await clack.select({
            message: t.menu.selectAction,
            options: [
                { value: "server", label: t.menu.serverCategory },
                { value: "provider", label: t.menu.providerCategory },
                { value: "route", label: t.menu.routeCategory },
                { value: "client", label: t.menu.clientCategory },
                { value: "system", label: t.menu.systemCategory },
                { value: "exit", label: t.menu.exit }
            ]
        });

        handleCancel(category);
        if (category === "exit") {
            clack.outro(t.common.bye);
            break;
        }

        if (category === "server") {
            const running = await checkServerReady(undefined, 200);
            const serverAction = await clack.select({
                message: t.menu.serverCategory,
                options: [
                    running
                        ? { value: "stop", label: t.menu.stopServer }
                        : { value: "start", label: t.menu.startServer },
                    { value: "back", label: t.menu.back }
                ]
            });

            if (clack.isCancel(serverAction) || serverAction === "back") {
                continue;
            }

            if (serverAction === "start") {
                await startBackendWizard(apiClient);
            } else
            if (serverAction === "stop") {
                await stopBackendWizard();
            }
        } else
        if (category === "provider") {
            while (true) {
                const providerAction = await clack.select({
                    message: t.menu.providerCategory,
                    options: [
                        { value: "add", label: t.menu.addProvider },
                        { value: "list", label: t.menu.listProviders },
                        { value: "back", label: t.menu.back }
                    ]
                });

                if (clack.isCancel(providerAction) || providerAction === "back") {
                    break;
                }

                if (providerAction === "add") {
                    await addProviderWizard(apiClient);
                } else
                if (providerAction === "list") {
                    await listProvidersWizard(apiClient);
                }
            }
        } else
        if (category === "route") {
            while (true) {
                const routeAction = await clack.select({
                    message: t.menu.routeCategory,
                    options: [
                        { value: "add", label: t.menu.addRoute },
                        { value: "edit", label: t.menu.editRoute },
                        { value: "delete", label: t.menu.deleteRoute },
                        { value: "list", label: t.menu.listRoutes },
                        { value: "back", label: t.menu.back }
                    ]
                });

                if (clack.isCancel(routeAction) || routeAction === "back") {
                    break;
                }

                switch (routeAction) {
                    case "add":
                        await addRouteWizard(apiClient);
                        break;
                    case "edit":
                        await editRouteWizard(apiClient);
                        break;
                    case "delete":
                        await deleteRouteWizard(apiClient);
                        break;
                    case "list":
                        await listRoutesWizard(apiClient);
                        break;
                }

           
            }
        } else
        if (category === "client") {
            while (true) {
                const clientAction = await clack.select({
                    message: t.menu.clientCategory,
                    options: [
                        { value: "add", label: t.menu.addUser },
                        { value: "list", label: t.menu.listUsers },
                        { value: "back", label: t.menu.back }
                    ]
                });

                if (clack.isCancel(clientAction) || clientAction === "back") {
                    break;
                }

                if (clientAction === "add") {
                    await generateClientKeyWizard(apiClient);
                } else
                if (clientAction === "list") {
                    await listUsersWizard(apiClient);
                }
            }
        } else
        if (category === "system") {
            const systemAction = await clack.select({
                message: t.menu.systemCategory,
                options: [
                    { value: "plugin", label: t.menu.managePlugins },
                    { value: "help", label: t.menu.helpGuide },
                    { value: "back", label: t.menu.back }
                ]
            });

            if (clack.isCancel(systemAction) || systemAction === "back") {
                continue;
            }

            if (systemAction === "plugin") {
                await managePluginsWizard(apiClient);
            } else
            if (systemAction === "help") {
                await helpWizard();
            }
        }
    }
}

/**
 * Main entry point of the CLI application. Parses command line arguments and routes actions.
 */
async function main() {
    const argv = await yargs(hideBin(process.argv))
        .scriptName("mpx")
        .usage("$0 [command] [action]")
        .command(
            "start",
            t.yargs.startDesc,
            () => {},
            async () => {
                await startBackendWizard(apiClient);
            }
        )
        .command(
            "stop",
            t.yargs.stopDesc,
            () => {},
            async () => {
                await stopBackendWizard();
            }
        )
        .command(
            "provider",
            t.yargs.providerDesc,
            (y) => {
                return y
                    .command(
                        "add",
                        "Register a new provider and its keys",
                        () => {},
                        async () => {
                            await addProviderWizard(apiClient);
                        }
                    )
                    .command(
                        "list",
                        "List all supported and active providers",
                        () => {},
                        async () => {
                            await listProvidersWizard(apiClient);
                        }
                    )
                    .demandCommand(1, "Specify an action: add or list");
            }
        )
        .command(
            "route",
            t.yargs.routeDesc,
            (y) => {
                return y
                    .command(
                        "add",
                        "Configure a new model routing rule",
                        () => {},
                        async () => {
                            await addRouteWizard(apiClient);
                        }
                    )
                    .command(
                        "edit",
                        "Edit an existing model routing rule",
                        () => {},
                        async () => {
                            await editRouteWizard(apiClient);
                        }
                    )
                    .command(
                        "delete",
                        "Delete an existing model routing rule",
                        () => {},
                        async () => {
                            await deleteRouteWizard(apiClient);
                        }
                    )
                    .command(
                        "list",
                        "List all configured model routing rules",
                        () => {},
                        async () => {
                            await listRoutesWizard(apiClient);
                        }
                    )
                    .demandCommand(1, "Specify an action: add, edit, delete or list");
            }
        )
        .command(
            "user",
            t.yargs.userDesc,
            (y) => {
                return y
                    .command(
                        "create",
                        "Generate a new client API key",
                        () => {},
                        async () => {
                            await generateClientKeyWizard(apiClient);
                        }
                    )
                    .command(
                        "list",
                        "List all client users and their active keys",
                        () => {},
                        async () => {
                            await listUsersWizard(apiClient);
                        }
                    )
                    .demandCommand(1, "Specify an action: create or list");
            }
        )
        .command(
            "plugin",
            t.yargs.pluginDesc,
            (y) => {
                return y
                    .command(
                        "toggle",
                        "Enable or disable user plugins (e.g. Caveman)",
                        () => {},
                        async () => {
                            await managePluginsWizard(apiClient);
                        }
                    )
                    .demandCommand(1, "Specify an action: toggle");
            }
        )
        .command(
            "help",
            t.yargs.helpDesc,
            () => {},
            async () => {
                await helpWizard();
            }
        )
        .help()
        .parseAsync();

    if (hideBin(process.argv).length === 0) {
        await runInteractiveMenu();
    }
}

main().catch(err => {
    console.error(t.common.error, err);
});
