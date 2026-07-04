import * as clack from "@clack/prompts";
import { ApiClient } from "../ApiClient";
import { ensureCredentials } from "../config/LocalConfig";
import { t } from "../i18n/index";

export async function managePluginsWizard(apiClient: ApiClient) {
    await ensureCredentials(apiClient, { requireAdmin: true });
    clack.intro(t.plugin.title);

    const users = await apiClient.getUsers().catch(() => [] as any[]);
    if (users.length === 0) {
        clack.log.warn(t.plugin.emptyUsers);
        clack.outro("");
        return;
    }

    const userOptions = users.map((u: any) => ({
        value: u.id,
        label: `${u.name} (${u.role})`
    }));

    const selectedUserId = await clack.select({
        message: t.plugin.selectUserPrompt,
        options: userOptions
    });

    if (clack.isCancel(selectedUserId)) {
        return;
    }

    const userId = Number(selectedUserId);

    while (true) {
        const plugins = await apiClient.getUserPlugins(userId).catch(() => [] as any[]);
        const pluginOptions = plugins.map((p: any) => ({
            value: p.name,
            label: `${p.displayName || p.name} [${p.isEnabled ? "ENABLED" : "DISABLED"}] - ${p.description || ""}`
        }));

        pluginOptions.push({
            value: "back",
            label: "< Back"
        });

        const choice = await clack.select({
            message: t.plugin.statusPrompt,
            options: pluginOptions
        });

        if (clack.isCancel(choice) || choice === "back") {
            break;
        }

        const pluginName = choice as string;
        const targetPlugin = plugins.find((p: any) => p.name === pluginName);
        const newStatus = targetPlugin ? !targetPlugin.isEnabled : true;

        const spinner = clack.spinner();
        spinner.start("Updating plugin status...");
        try {
            await apiClient.toggleUserPlugin(userId, pluginName, newStatus);
            spinner.stop(t.plugin.success);
        } catch (err: any) {
            spinner.stop("Error updating plugin");
            clack.log.error(`${t.common.error} ${err.message}`);
        }
    }

    clack.outro("");
}