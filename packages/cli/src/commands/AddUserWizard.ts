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
    await ensureCredentials(apiClient);
    clack.intro(t.menu.addUser);

    const name = await clack.text({
        message: t.user.namePrompt,
        placeholder: "frontend-app",
        validate(value) {
            if (!value) {
                return "Client name is required";
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
    spinner.start("Generating client API Key...");
    try {
        const newUser = await apiClient.createUser(name as string, roleSelection as string);
        spinner.stop(t.user.success);
        clack.note(newUser.apiKey, "Client API Key");
    } catch (err: any) {
        spinner.stop("Error generating client key");
        clack.log.error(`${t.common.error} ${err.message}`);
    }
}

/**
 * Lists users wizard.
 * @param apiClient The API client.
 */
export async function listUsersWizard(apiClient: ApiClient) {
    await ensureCredentials(apiClient);
    clack.intro(t.menu.listUsers);

    const spinner = clack.spinner();
    spinner.start("Loading client API keys...");
    try {
        const users = await apiClient.getUsers();
        spinner.stop("Loaded active users successfully!");
        const listContent = users
            .map((u: any) => `- Name: ${u.name}\n  Key:  ${u.apiKey}\n  Role: ${u.role}`)
            .join("\n\n");
        clack.note(listContent || t.user.listEmpty, t.user.listTitle);
    } catch (err: any) {
        spinner.stop("Error loading client keys");
        clack.log.error(`${t.common.error} ${err.message}`);
    }

    clack.outro("");
}
