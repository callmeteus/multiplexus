#!/usr/bin/env node
import * as clack from "@clack/prompts";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { ApiClient } from "./ApiClient";
import { t } from "./i18n/index";
import { addProviderWizard } from "./commands/AddProviderWizard";
import { addRouteWizard } from "./commands/AddRouteWizard";
import { generateClientKeyWizard, listUsersWizard } from "./commands/AddUserWizard";
import { helpWizard } from "./commands/HelpWizard";
import { startBackendWizard, stopBackendWizard } from "./commands/StartWizard";
import { managePluginsWizard } from "./commands/PluginWizard";
import { listProvidersWizard } from "./commands/ListProvidersWizard";

const apiClient = new ApiClient();

/**
 * Runs the interactive menu.
 */
async function runInteractiveMenu() {
    clack.intro(t.menu.welcome);

    const action = await clack.select({
        message: t.menu.selectAction,
        options: [
            { value: "start", label: t.menu.startServer },
            { value: "stop", label: t.menu.stopServer },
            { value: "provider", label: t.menu.addProvider },
            { value: "provider-list", label: "List Supported Providers" },
            { value: "route", label: t.menu.addRoute },
            { value: "client", label: t.menu.addUser },
            { value: "list", label: t.menu.listUsers },
            { value: "plugin", label: t.menu.managePlugins },
            { value: "help", label: t.menu.helpGuide },
            { value: "exit", label: t.menu.exit }
        ]
    });

    if (clack.isCancel(action) || action === "exit") {
        clack.outro(t.common.bye);
        return;
    }

    if (action === "start") {
        await startBackendWizard(apiClient);
    } else
    if (action === "stop") {
        await stopBackendWizard();
    } else
    if (action === "provider") {
        await addProviderWizard(apiClient);
    } else
    if (action === "provider-list") {
        await listProvidersWizard(apiClient);
    } else
    if (action === "route") {
        await addRouteWizard(apiClient);
    } else
    if (action === "client") {
        await generateClientKeyWizard(apiClient);
    } else
    if (action === "list") {
        await listUsersWizard(apiClient);
    } else
    if (action === "plugin") {
        await managePluginsWizard(apiClient);
    } else
    if (action === "help") {
        await helpWizard();
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
                    .demandCommand(1, "Specify an action: add");
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
