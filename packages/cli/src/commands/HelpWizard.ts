import * as clack from "@clack/prompts";
import { t } from "../i18n/index";

/**
 * Helps the user with the CLI.
 */
export async function helpWizard() {
    clack.intro(t.help.title);

    for (const provider of t.help.providers) {
        clack.note(
            `${provider.description}\nGet your key: ${provider.keyUrl}`,
            `${provider.name}  [${provider.tier}]`
        );
    }

    clack.note(t.help.workflow.join("\n"), t.help.workflowTitle);
    clack.outro("");
}
