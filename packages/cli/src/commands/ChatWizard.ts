import * as clack from "@clack/prompts";
import chalk from "chalk";
import * as readline from "readline";
import { ApiClient } from "../ApiClient";
import { ChatSpinner, askYesNo, ensureReadlineReady } from "../chat/ChatSpinner";
import { consumeChatStream, formatModelLabel } from "../chat/ChatStream";
import {
    buildChatSystemPrompt,
    executeToolCalls,
    formatToolResults,
    parseToolCalls,
    SkillContext
} from "../chat/skills";
import { buildAgentNudgeMessage, buildContinueNudge, buildFailedEditNudge, buildMalformedToolNudge, buildTutorialNudge, detectUserLang, formatToolLabel, looksLikeMalformedToolAttempt, printTransientOutput, shouldNudgeAfterExploration, shouldNudgeAgentContinue, shouldNudgeFailedEdit, shouldNudgeListDirLoop, shouldNudgeTutorialInsteadOfTools, stripToolCallsForDisplay } from "../chat/ToolDisplay";
import { resolveBackend } from "../config/BackendResolution";
import { ensureCredentials } from "../config/LocalConfig";
import { t } from "../i18n/index";
import { handleCancel } from "../utils/ProcessUtils";

const MAX_TOOL_ROUNDS = 5;
const MAX_AGENT_NUDGES = 2;

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
    const cwd = process.cwd();
    const defaultLang = t.menu.welcome.includes("Bem-vindo") ? "pt" : "en";

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
        crlfDelay: Infinity,
        prompt: chalk.blue.bold(t.chat.prompt)
    });

    let sessionLang = defaultLang;
    let processing = false;
    let exiting = false;
    let activeSpinner: ChatSpinner | null = null;

    const skillContext: SkillContext = {
        projectRoot,
        cwd,
        approve: async (skillName, args) => {
            activeSpinner?.stop();

            let message = t.chat.approveSkill.replace("{skill}", skillName);

            if (skillName === "run_command") {
                message = t.chat.approveCommand
                    .replace("{command}", args.command ?? "")
                    .replace("{cwd}", args.cwd || cwd);
            } else if (skillName === "write_file") {
                message = sessionLang === "pt"
                    ? `Escrever/sobrescrever arquivo?\n${args.path}`
                    : `Write/overwrite file?\n${args.path}`;
            }

            return askYesNo(rl, message);
        }
    };

    console.clear();
    console.log(chalk.bold.cyan("=================================================="));
    console.log(chalk.bold.cyan("              multiplexus Chat Client             "));
    console.log(chalk.bold.cyan("=================================================="));
    console.log(chalk.gray(t.chat.welcome.replace("{model}", chalk.yellow(model))));
    console.log(chalk.bold.cyan("=================================================="));
    console.log();

    const messages: { role: string; content: string }[] = [
        { role: "system", content: buildChatSystemPrompt(skillContext, sessionLang) }
    ];

    rl.prompt();

    rl.on("line", async (line) => {
        if (processing || exiting) {
            return;
        }

        const input = line.trim();

        if (input.toLowerCase() === "/exit") {
            exiting = true;
            rl.close();
            return;
        }

        if (!input) {
            ensureReadlineReady(rl);
            rl.prompt();
            return;
        }

        processing = true;
        sessionLang = detectUserLang(input);
        messages[0] = { role: "system", content: buildChatSystemPrompt(skillContext, sessionLang) };
        messages.push({ role: "user", content: input });

        const spinner = new ChatSpinner();
        activeSpinner = spinner;
        let nudgeCount = 0;
        let awaitingPostToolReply = false;
        let turnHeaderPrinted = false;
        let turnLineOpen = false;

        const formatThinkingLabel = (round: number, provider: string, targetModel: string): string => {
            const progress = chalk.gray(`(${round}/${MAX_TOOL_ROUNDS})`);
            if (targetModel && provider) {
                return `${t.chat.thinking} ${progress} ${chalk.gray(`→ ${targetModel} via ${provider}`)}`;
            }

            return `${t.chat.thinking} ${progress}`;
        };

        try {
            let round = 0;
            let lastProvider = "";
            let lastTargetModel = "";

            while (round < MAX_TOOL_ROUNDS) {
                round++;
                spinner.start(formatThinkingLabel(round, lastProvider, lastTargetModel));
                activeSpinner = spinner;

                const response = await apiClient.sendChatCompletionStream(model, messages);

                if (!response.ok) {
                    spinner.stop();
                    const errorText = await response.text().catch(() => "");
                    console.log(chalk.red(`\n${t.chat.error.replace("{message}", response.statusText + " " + errorText)}`));
                    messages.pop();
                    return;
                }

                if (!response.body) {
                    spinner.stop();
                    console.log(chalk.red(`\n${t.chat.error.replace("{message}", "No response body received")}`));
                    messages.pop();
                    return;
                }

                lastProvider = response.headers.get("x-mux-provider") || response.headers.get("X-Mux-Provider") || "";
                lastTargetModel = response.headers.get("x-mux-model") || response.headers.get("X-Mux-Model") || "";

                if (lastTargetModel && lastProvider) {
                    spinner.update(formatThinkingLabel(round, lastProvider, lastTargetModel));
                }

                const { text: assistantResponse } = await consumeChatStream(response, {
                    onFirstVisibleToken: () => {
                        if (awaitingPostToolReply) {
                            return;
                        }

                        spinner.stop();
                        if (!turnHeaderPrinted) {
                            process.stdout.write(`${formatModelLabel(model, lastProvider, lastTargetModel)} ${chalk.gray(">")} `);
                            turnHeaderPrinted = true;
                            turnLineOpen = true;
                        }
                    },
                    onTextUpdate: (full, delta) => {
                        if (parseToolCalls(full).length > 0 || awaitingPostToolReply) {
                            return;
                        }

                        if (delta) {
                            process.stdout.write(delta);
                        }
                    }
                });

                const visibleText = stripToolCallsForDisplay(assistantResponse);
                const hasTools = parseToolCalls(assistantResponse).length > 0;
                spinner.stop();

                if (visibleText && !turnHeaderPrinted && !hasTools) {
                    process.stdout.write(`${formatModelLabel(model, lastProvider, lastTargetModel)} ${chalk.gray(">")} `);
                    process.stdout.write(visibleText);
                    turnHeaderPrinted = true;
                    turnLineOpen = true;
                }

                if (turnLineOpen && visibleText && !hasTools) {
                    console.log();
                    turnLineOpen = false;
                }

                if (!assistantResponse.trim()) {
                    if (nudgeCount < MAX_AGENT_NUDGES && (awaitingPostToolReply || shouldNudgeAfterExploration(messages, input))) {
                        nudgeCount++;
                        messages.push({ role: "user", content: buildContinueNudge(sessionLang, awaitingPostToolReply, input) });
                        awaitingPostToolReply = false;
                        spinner.start(formatThinkingLabel(round, lastProvider, lastTargetModel));
                        continue;
                    }

                    break;
                }

                awaitingPostToolReply = false;

                const parsedCalls = parseToolCalls(assistantResponse);
                const isTutorial = parsedCalls.length === 0
                    && shouldNudgeTutorialInsteadOfTools(input, assistantResponse);

                if (isTutorial) {
                    console.log(chalk.yellow(sessionLang === "pt"
                        ? "\n↳ Tutorial ignorado — redirecionando para ferramentas..."
                        : "\n↳ Tutorial ignored — redirecting to tools..."));
                    messages.push({
                        role: "assistant",
                        content: sessionLang === "pt"
                            ? "(resposta com tutorial omitida)"
                            : "(tutorial response omitted)"
                    });
                } else {
                    messages.push({ role: "assistant", content: assistantResponse });
                }

                if (parsedCalls.length === 0) {
                    if (nudgeCount < MAX_AGENT_NUDGES && isTutorial) {
                        nudgeCount++;
                        messages.push({ role: "user", content: buildTutorialNudge(sessionLang, input) });
                        spinner.start(formatThinkingLabel(round, lastProvider, lastTargetModel));
                        continue;
                    }

                    if (nudgeCount < MAX_AGENT_NUDGES && looksLikeMalformedToolAttempt(assistantResponse)) {
                        nudgeCount++;
                        messages.push({ role: "user", content: buildMalformedToolNudge(sessionLang) });
                        spinner.start(formatThinkingLabel(round, lastProvider, lastTargetModel));
                        continue;
                    }

                    if (nudgeCount < MAX_AGENT_NUDGES && shouldNudgeAgentContinue(input, assistantResponse)) {
                        nudgeCount++;
                        messages.push({ role: "user", content: buildAgentNudgeMessage(sessionLang, input) });
                        spinner.start(formatThinkingLabel(round, lastProvider, lastTargetModel));
                        continue;
                    }

                    if (nudgeCount < MAX_AGENT_NUDGES && shouldNudgeAfterExploration(messages, input)) {
                        nudgeCount++;
                        messages.push({ role: "user", content: buildContinueNudge(sessionLang, true, input) });
                        spinner.start(formatThinkingLabel(round, lastProvider, lastTargetModel));
                        continue;
                    }

                    break;
                }

                const toolSpinner = new ChatSpinner();
                activeSpinner = toolSpinner;

                const toolResults = await executeToolCalls(skillContext, assistantResponse, {
                    onStart: (call) => {
                        toolSpinner.start(formatToolLabel(call.name, call.arguments));
                    },
                    onEnd: (call, result) => {
                        if (call.name === "run_command" && result.output) {
                            printTransientOutput(result.output);
                        }

                        const status = result.ok ? chalk.green("✓") : chalk.red("✗");
                        const label = formatToolLabel(call.name, call.arguments);
                        const suffix = !result.ok && result.output ? chalk.gray(` — ${result.output}`) : "";
                        toolSpinner.stop(`${status} ${label}${suffix}`);
                    }
                });

                activeSpinner = null;
                messages.push({ role: "user", content: formatToolResults(toolResults) });

                const visibleProse = stripToolCallsForDisplay(assistantResponse);
                if (nudgeCount < MAX_AGENT_NUDGES && visibleProse && shouldNudgeTutorialInsteadOfTools(input, visibleProse)) {
                    nudgeCount++;
                    messages.push({ role: "user", content: buildTutorialNudge(sessionLang, input) });
                } else if (nudgeCount < MAX_AGENT_NUDGES && visibleProse && shouldNudgeAgentContinue(input, visibleProse)) {
                    nudgeCount++;
                    messages.push({ role: "user", content: buildAgentNudgeMessage(sessionLang, input) });
                } else if (nudgeCount < MAX_AGENT_NUDGES && shouldNudgeFailedEdit(messages)) {
                    nudgeCount++;
                    messages.push({ role: "user", content: buildFailedEditNudge(sessionLang) });
                } else if (nudgeCount < MAX_AGENT_NUDGES && shouldNudgeListDirLoop(messages)) {
                    nudgeCount++;
                    messages.push({ role: "user", content: buildContinueNudge(sessionLang, true, input) });
                }

                awaitingPostToolReply = true;
                spinner.start(formatThinkingLabel(round, lastProvider, lastTargetModel));
                activeSpinner = spinner;
            }

            if (round >= MAX_TOOL_ROUNDS && awaitingPostToolReply) {
                spinner.stop();
                console.log(chalk.yellow(`\n${sessionLang === "pt"
                    ? `Limite de ${MAX_TOOL_ROUNDS} rodadas atingido — envie outra mensagem para continuar.`
                    : `Reached ${MAX_TOOL_ROUNDS} round limit — send another message to continue.`}`));
            }
        } catch (err: any) {
            spinner.stop();
            console.log(chalk.red(`\n${t.chat.error.replace("{message}", err.message)}`));
            messages.pop();
        } finally {
            processing = false;
            activeSpinner = null;
            ensureReadlineReady(rl);
            rl.prompt();
        }
    });

    rl.on("SIGINT", () => {
        if (exiting) {
            return;
        }

        exiting = true;
        activeSpinner?.stop();
        console.log();
        rl.close();
    });

    rl.on("close", () => {
        if (!exiting) {
            return;
        }

        console.log();
        clack.outro(t.common.bye);
    });

    await new Promise<void>((resolve) => {
        rl.on("close", () => {
            resolve();
        });
    });
}
