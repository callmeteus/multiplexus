import * as clack from "@clack/prompts";
import chalk from "chalk";
import * as readline from "readline";
import { ApiClient } from "../ApiClient";
import { consumeChatStream, formatModelLabel } from "../chat/ChatStream";
import {
    buildChatSystemPrompt,
    executeToolCalls,
    formatToolResults,
    hasToolCalls,
    SkillContext
} from "../chat/skills";
import { resolveBackend } from "../config/BackendResolution";
import { ensureCredentials } from "../config/LocalConfig";
import { t } from "../i18n/index";
import { handleCancel } from "../utils/ProcessUtils";

const MAX_TOOL_ROUNDS = 8;

/**
 * Starts the interactive chat client in the terminal.
 * Allows selecting the exposed router and chatting with it interactively with streaming output.
 * @param apiClient The API client.
 */
export async function chatWizard(apiClient: ApiClient) {
    await ensureCredentials(apiClient, { requireAdmin: true });

    const routes = await apiClient.getModelRoutes().catch(() => [] as any[]);
    if (routes.length === 0) {
        clack.log.warn(t.chat.noRoutes);
        clack.outro("");
        return;
    }

    const uniqueModels = Array.from(new Set(routes.map((r: any) => r.routerModel as string)));

    const selectedModel = await clack.select({
        message: t.chat.selectRouter,
        options: uniqueModels.map(m => ({ value: m, label: m }))
    });

    handleCancel(selectedModel);

    const model = selectedModel as string;
    const resolution = resolveBackend();
    const projectRoot = resolution?.projectRoot ?? process.cwd();
    const skillContext: SkillContext = {
        projectRoot,
        cwd: process.cwd()
    };
    const isPt = t.menu.welcome.includes("Bem-vindo");
    const lang = isPt ? "pt" : "en";

    console.clear();
    console.log(chalk.bold.cyan("=================================================="));
    console.log(chalk.bold.cyan("              multiplexus Chat Client             "));
    console.log(chalk.bold.cyan("=================================================="));
    console.log(chalk.gray(t.chat.welcome.replace("{model}", chalk.yellow(model))));
    console.log(chalk.gray(t.chat.cwdHint.replace("{cwd}", skillContext.cwd)));
    console.log(chalk.gray(t.chat.skillsHint));
    console.log(chalk.bold.cyan("=================================================="));
    console.log();

    const messages: { role: string; content: string }[] = [
        { role: "system", content: buildChatSystemPrompt(skillContext, lang) }
    ];

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: chalk.blue.bold(t.chat.prompt)
    });

    rl.prompt();

    rl.on("line", async (line) => {
        const input = line.trim();

        if (input.toLowerCase() === "/exit") {
            rl.close();
            return;
        }

        if (!input) {
            rl.prompt();
            return;
        }

        messages.push({ role: "user", content: input });

        const spinner = clack.spinner();
        spinner.start(t.chat.thinking);

        try {
            let round = 0;
            let lastProvider = "";
            let lastTargetModel = "";

            while (round < MAX_TOOL_ROUNDS) {
                round++;
                const response = await apiClient.sendChatCompletionStream(model, messages);

                if (!response.ok) {
                    spinner.stop("");
                    const errorText = await response.text().catch(() => "");
                    console.log(chalk.red(`\n${t.chat.error.replace("{message}", response.statusText + " " + errorText)}`));
                    messages.pop();
                    rl.prompt();
                    return;
                }

                if (!response.body) {
                    spinner.stop("");
                    console.log(chalk.red(`\n${t.chat.error.replace("{message}", "No response body received")}`));
                    messages.pop();
                    rl.prompt();
                    return;
                }

                lastProvider = response.headers.get("x-mux-provider") || response.headers.get("X-Mux-Provider") || "";
                lastTargetModel = response.headers.get("x-mux-model") || response.headers.get("X-Mux-Model") || "";

                if (lastTargetModel && lastProvider) {
                    spinner.message(
                        t.chat.responding
                            .replace("{model}", lastTargetModel)
                            .replace("{provider}", lastProvider)
                    );
                }

                let headerPrinted = false;
                const { text: assistantResponse } = await consumeChatStream(response, () => {
                    spinner.stop("");
                    if (!headerPrinted) {
                        process.stdout.write(`${formatModelLabel(model, lastProvider, lastTargetModel)} ${chalk.gray(">")} `);
                        headerPrinted = true;
                    }
                });

                if (!headerPrinted) {
                    spinner.stop("");
                    process.stdout.write(`${formatModelLabel(model, lastProvider, lastTargetModel)} ${chalk.gray(">")} `);
                }

                console.log();
                console.log();

                if (!assistantResponse) {
                    break;
                }

                messages.push({ role: "assistant", content: assistantResponse });

                if (!hasToolCalls(assistantResponse)) {
                    break;
                }

                const toolResults = executeToolCalls(skillContext, assistantResponse);

                for (const result of toolResults) {
                    const status = result.ok ? chalk.green("✓") : chalk.red("✗");
                    console.log(chalk.gray(`${status} ${result.name}: ${result.output.split("\n")[0]}`));
                }

                messages.push({ role: "user", content: formatToolResults(toolResults) });
                spinner.start(t.chat.runningTools);
            }
        } catch (err: any) {
            spinner.stop("");
            console.log(chalk.red(`\n${t.chat.error.replace("{message}", err.message)}`));
            messages.pop();
        }

        rl.prompt();
    });

    rl.on("SIGINT", () => {
        rl.close();
    });

    rl.on("close", () => {
        console.log();
        clack.outro(t.common.bye);
    });

    await new Promise<void>((resolve) => {
        rl.on("close", () => {
            resolve();
        });
    });
}
