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

const apiClient = new ApiClient();

async function runInteractiveMenu() {
    clack.intro(t.menu.welcome);

    while (true) {
        const action = await clack.select({
            message: t.menu.selectAction,
            options: [
                { value: "start", label: t.menu.startServer },
                { value: "stop", label: t.menu.stopServer },
                { value: "provider", label: t.menu.addProvider },
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
            break;
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
}

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
            "provider <action>",
            t.yargs.providerDesc,
            (y) => {
                return y.positional("action", {
                    describe: t.yargs.providerActionDesc,
                    type: "string"
                });
            },
            async (argv) => {
                if (argv.action === "add") {
                    await addProviderWizard(apiClient);
                }
            }
        )
        .command(
            "route <action>",
            t.yargs.routeDesc,
            (y) => {
                return y.positional("action", {
                    describe: t.yargs.routeActionDesc,
                    type: "string"
                });
            },
            async (argv) => {
                if (argv.action === "add") {
                    await addRouteWizard(apiClient);
                }
            }
        )
        .command(
            "user <action>",
            t.yargs.userDesc,
            (y) => {
                return y.positional("action", {
                    describe: t.yargs.userActionDesc,
                    type: "string"
                });
            },
            async (argv) => {
                if (argv.action === "create") {
                    await generateClientKeyWizard(apiClient);
                } else
                if (argv.action === "list") {
                    await listUsersWizard(apiClient);
                }
            }
        )
        .command(
            "plugin <action>",
            t.yargs.pluginDesc,
            (y) => {
                return y.positional("action", {
                    describe: t.yargs.pluginActionDesc,
                    type: "string"
                });
            },
            async (argv) => {
                if (argv.action === "toggle") {
                    await managePluginsWizard(apiClient);
                }
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
