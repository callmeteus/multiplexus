import * as clack from "@clack/prompts";
import { UserRole } from "@multiplexus/shared";
import { ApiClient } from "../ApiClient";
import { ensureCredentials } from "../config/LocalConfig";
import { t } from "../i18n/index";

/**
 * Generates a client key wizard.
 * @param apiClient The API client.
 */
export async function generateClientKeyWizard(apiClient: ApiClient) {
    await ensureCredentials(apiClient, { requireAdmin: true });
    clack.intro(t.menu.addUser);

    const name = await clack.text({
        message: t.user.namePrompt,
        placeholder: "frontend-app",
        validate(value) {
            if (!value) {
                return t.user.nameRequired;
            }
        }
    });

    if (clack.isCancel(name)) {
        return;
    }

    const roleSelection = await clack.select({
        message: t.user.rolePrompt,
        options: [
            { value: UserRole.USER, label: t.user.roleUser },
            { value: UserRole.ADMIN, label: t.user.roleAdmin }
        ]
    });

    if (clack.isCancel(roleSelection)) {
        return;
    }

    const spinner = clack.spinner();
    spinner.start(t.user.generating);
    try {
        const newUser = await apiClient.createUser(name as string, roleSelection as string);
        spinner.stop(t.user.success);
        clack.note(newUser.apiKey, "Client API Key");
    } catch (err: any) {
        spinner.stop(t.user.errorGenerating);
        clack.log.error(`${t.common.error} ${err.message}`);
    }
}

/**
 * Lists users wizard.
 * @param apiClient The API client.
 */
export async function listUsersWizard(apiClient: ApiClient) {
    await ensureCredentials(apiClient, { requireAdmin: true });
    clack.intro(t.menu.listUsers);

    const spinner = clack.spinner();
    spinner.start(t.user.loading);

    try {
        const users = await apiClient.getUsers();
        spinner.stop(t.user.loadedSuccess);

        const listContent = users
            .map((u: any) => `- Name: ${u.name}\n  Key:  ${u.apiKey}\n  Role: ${u.role}`)
            .join("\n\n");
        clack.note(listContent || t.user.listEmpty, t.user.listTitle);
    } catch (err: any) {
        spinner.stop(t.user.errorLoading);
        clack.log.error(`${t.common.error} ${err.message}`);
    }

    clack.outro("");
}
