import chalk from "chalk";
import { parseToolCalls } from "./SkillExecutor";
import { SKILL_REGISTRY } from "./SkillRegistry";

const TOOL_CALL_RE = /<tool_call>[\s\S]*?<\/tool_call>/g;
const PARTIAL_TOOL_CALL_RE = /<tool_call>[\s\S]*$/;
const FENCE_RE = /```(?:json|python|javascript|typescript|tool)?\s*([\s\S]*?)\s*```/gi;
const KIMI_TOOL_RE = /<\|tool_call_start\|>[\s\S]*?<\|[^>]*\|>/gi;
const PARTIAL_KIMI_RE = /<\|tool_call_start\|>[\s\S]*$/;
const BRACKET_TOOL_RE = new RegExp(
    `\\[(?:${[...SKILL_REGISTRY.keys()].join("|")})\\([\\s\\S]*?\\)\\]`,
    "gi"
);
const PARTIAL_BRACKET_TOOL_RE = new RegExp(
    `\\[(?:${[...SKILL_REGISTRY.keys()].join("|")})\\([\\s\\S]*$`
);

/**
 * Returns true when fenced or inline JSON looks like a tool invocation.
 * @param raw The JSON string to inspect.
 */
function isToolLikeJson(raw: string): boolean {
    try {
        const parsed = JSON.parse(raw.trim()) as Record<string, unknown>;
        return typeof parsed.name === "string"
            || typeof parsed.path === "string"
            || typeof parsed.command === "string";
    } catch (_) {
        return false;
    }
}

/**
 * Strips incomplete tool markers still being streamed token-by-token.
 * @param text The raw assistant text accumulated so far.
 * @returns Text with trailing partial tool syntax removed.
 */
function stripTrailingPartialToolMarkers(text: string): string {
    return text
        .replace(/<tool_call>[\s\S]*$/g, "")
        .replace(/<tool_call[\s\S]*$/g, "")
        .replace(/<\|tool[\s\S]*$/g, "")
        .replace(/<tool[\s\S]*$/g, "");
}

/**
 * Removes tool_call blocks and tool-like code fences from text for chat display.
 * @param text The raw assistant message.
 * @returns Text safe to show in the terminal.
 */
export function stripToolCallsForDisplay(text: string): string {
    let result = text
        .replace(TOOL_CALL_RE, "")
        .replace(PARTIAL_TOOL_CALL_RE, "")
        .replace(KIMI_TOOL_RE, "")
        .replace(PARTIAL_KIMI_RE, "")
        .replace(BRACKET_TOOL_RE, "")
        .replace(PARTIAL_BRACKET_TOOL_RE, "");

    FENCE_RE.lastIndex = 0;
    result = result.replace(FENCE_RE, (block, inner: string) => (
        isToolLikeJson(inner) ? "" : block
    ));

    result = stripTrailingPartialToolMarkers(result);

    return result.trim();
}

/**
 * Returns true when the message is only tool calls with no visible prose.
 * @param text The raw assistant message.
 */
export function isToolOnlyMessage(text: string): boolean {
    return stripToolCallsForDisplay(text).length === 0 && parseToolCalls(text).length > 0;
}

/**
 * Builds a short label for a tool invocation.
 * @param name The skill name.
 * @param args The tool arguments.
 * @returns A compact label for spinners.
 */
export function formatToolLabel(name: string, args: Record<string, string>): string {
    switch (name) {
        case "read_file":
            return `read_file · ${args.path ?? ""}`;
        case "write_file":
            return `write_file · ${args.path ?? ""}`;
        case "find_and_replace":
            return `find_and_replace · ${args.path ?? ""}`;
        case "list_dir":
            return `list_dir · ${args.path || "."}`;
        case "run_command":
            return `run_command · ${args.command ?? ""}`;
        default:
            return name;
    }
}

/**
 * Prints a block of lines and clears them afterward using ANSI escape sequences.
 * @param text The output text to show transiently.
 */
export function printTransientOutput(text: string): void {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) {
        return;
    }

    for (const line of lines) {
        process.stdout.write(chalk.gray(`│ ${line}`) + "\n");
    }

    process.stdout.write(`\x1b[${lines.length}A`);
    for (let i = 0; i < lines.length; i++) {
        process.stdout.write("\x1b[2K");
        if (i < lines.length - 1) {
            process.stdout.write("\x1b[1B");
        }
    }
    process.stdout.write(`\x1b[${lines.length}A`);
}

/**
 * Detects whether user text is likely Portuguese.
 * @param text The user message.
 * @returns "pt" or "en".
 */
export function detectUserLang(text: string): "pt" | "en" {
    if (/[ãõçáéíóúâêô]|(?:\b(não|nao|pra|tá|ta|está|esta|você|voce|porque|também|tambem|arquivo|corrigir|login)\b)/i.test(text)) {
        return "pt";
    }

    return "en";
}

/**
 * Detects when the model replied with intent-only prose instead of using tools.
 * @param userMessage The user's request.
 * @param assistantText The model's reply without tool calls.
 * @returns True when the agent should be nudged to continue with tools.
 */
export function shouldNudgeAgentContinue(userMessage: string, assistantText: string): boolean {
    const taskRequest = /\b(arrumar|corrigir|consertar|fix|implementar|adicionar|remover|atualizar|explorar|encontrar|mudar|alterar|oauth|url|funcionando)\b/i.test(userMessage);
    const intentOnly = /\b(vou |preciso |primeiro|let me |I'll |I will |i need to|posso ajudar|can help)\b/i.test(assistantText);
    const refusal = /\b(não tenho capacidade|nao tenho capacidade|não posso|nao posso|cannot help|can't help|unable to|lamentavelmente|unfortunately|i cannot|i can't)\b/i.test(assistantText);
    const adviceOnly = /\b(recomendo|certifique-se|verifique|check your|documentação|documentation oficial)\b/i.test(assistantText);
    const asksUser = /\?/.test(assistantText);
    const asksForDetails = /\b(could you please|can you provide|need more information|more information|more details|provide more|precisa de mais|mais informações|mais detalhes|to help you fix)\b/i.test(assistantText);

    return taskRequest && (intentOnly || asksUser || asksForDetails || refusal || adviceOnly);
}

/**
 * Detects when the model wrote a tutorial or invented code instead of using tools.
 * @param userMessage The user's request.
 * @param assistantText The model's reply without tool calls.
 * @returns True when the agent should be redirected to tools.
 */
export function shouldNudgeTutorialInsteadOfTools(userMessage: string, assistantText: string): boolean {
    const taskRequest = /\b(arrumar|corrigir|consertar|fix|oauth|url|funcionando|errad)\b/i.test(userMessage);
    const tutorial = /\b(step-by-step|here's a|here is a|npm install|create a new file|first, install|don't forget to|not implemented yet|we need to add|passo a passo|crie um arquivo|instale o)\b/i.test(assistantText);
    const fenceCount = (assistantText.match(/```/g) || []).length;
    const longWithFences = assistantText.length > 400 && fenceCount >= 2;

    return taskRequest && (tutorial || fenceCount >= 4 || longWithFences);
}

/**
 * Returns a nudge when the model invented a tutorial instead of editing the codebase.
 * @param lang The session language.
 * @param userMessage The user's original request.
 */
export function buildTutorialNudge(lang: string, userMessage = ""): string {
    const example = '<tool_call>{"name":"read_file","arguments":{"path":"packages/cli/src/commands/add_provider_wizard/GoogleLogin.ts"}}</tool_call>';
    const hint = buildTaskHint(lang, userMessage);

    return lang === "pt"
        ? `PARE de escrever tutorial/código no chat. Corrija o código EXISTENTE com ferramentas — não crie arquivos novos, não sugira npm install.\n${example}${hint}`
        : `STOP writing tutorials/code in chat. Fix EXISTING code with tools — no new files, no npm install.\n${example}${hint}`;
}

/**
 * Detects when the model explored files but stopped before applying edits.
 * @param messages The conversation messages so far.
 * @param userMessage The user's task request.
 * @returns True when the agent should be nudged to edit.
 */
export function shouldNudgeAfterExploration(
    messages: Array<{ role: string; content: string }>,
    userMessage: string
): boolean {
    const taskRequest = /\b(arrumar|corrigir|consertar|fix|implementar|oauth|url|funcionando|errad)\b/i.test(userMessage);
    if (!taskRequest) {
        return false;
    }

    let explored = false;
    let edited = false;

    for (const msg of messages.slice(-16)) {
        const content = msg.content;

        if (content.includes('tool="read_file" ok="true"') || content.includes('tool="list_dir" ok="true"')) {
            explored = true;
        }

        if (content.includes('tool="find_and_replace"') || content.includes('tool="write_file"')) {
            edited = true;
        }
    }

    return explored && !edited;
}

/**
 * Detects repeated list_dir calls without progressing to read/edit.
 * @param messages The conversation messages so far.
 * @returns True when the agent is stuck listing directories.
 */
export function shouldNudgeListDirLoop(messages: Array<{ role: string; content: string }>): boolean {
    let listDirCount = 0;
    let edited = false;

    for (const msg of messages.slice(-12)) {
        const content = msg.content;

        if (content.includes('tool="list_dir"')) {
            listDirCount++;
        }

        if (content.includes('tool="find_and_replace"') || content.includes('tool="write_file"')) {
            edited = true;
        }
    }

    return listDirCount >= 3 && !edited;
}

/**
 * Detects when find_and_replace failed recently.
 * @param messages The conversation messages so far.
 * @returns True when the agent should re-read before editing.
 */
export function shouldNudgeFailedEdit(messages: Array<{ role: string; content: string }>): boolean {
    for (const msg of messages.slice(-6)) {
        if (msg.content.includes('tool="find_and_replace" ok="false"')) {
            return true;
        }
    }

    return false;
}

/**
 * Returns a nudge after find_and_replace failed (wrong old_string, etc.).
 * @param lang The session language.
 */
export function buildFailedEditNudge(lang: string): string {
    const example = '<tool_call>{"name":"read_file","arguments":{"path":"packages/cli/src/commands/add_provider_wizard/GoogleLogin.ts"}}</tool_call>';

    return lang === "pt"
        ? `find_and_replace falhou — leia o arquivo com read_file e copie old_string EXATAMENTE do conteúdo (sem inventar). Depois tente de novo:\n${example}`
        : `find_and_replace failed — read_file the file and copy old_string EXACTLY from its content (do not invent). Then retry:\n${example}`;
}

/**
 * Builds a hint for OAuth-related tasks pointing at the login wizard files.
 * @param lang The session language.
 * @param userMessage The user's request.
 */
function buildTaskHint(lang: string, userMessage: string): string {
    if (!/\b(oauth|github|login|url)\b/i.test(userMessage)) {
        return "";
    }

    return lang === "pt"
        ? "\nDica: OAuth está em packages/cli/src/commands/add_provider_wizard/ (GoogleLogin.ts, AnthropicLogin.ts, XaiLogin.ts)."
        : "\nHint: OAuth is in packages/cli/src/commands/add_provider_wizard/ (GoogleLogin.ts, AnthropicLogin.ts, XaiLogin.ts).";
}

/**
 * Returns the nudge message to push the agent to use tools.
 * @param lang The session language.
 * @param userMessage The user's original request.
 */
export function buildAgentNudgeMessage(lang: string, userMessage = ""): string {
    const example = '<tool_call>{"name":"read_file","arguments":{"path":"packages/cli/src/commands/add_provider_wizard/GoogleLogin.ts"}}</tool_call>';
    const hint = buildTaskHint(lang, userMessage);

    return lang === "pt"
        ? `Não peça mais detalhes — explore e corrija com ferramentas. Formato obrigatório:\n${example}${hint}`
        : `Do not ask for more details — explore and fix with tools. Required format:\n${example}${hint}`;
}

/**
 * Detects when the model attempted tools in the wrong format (fences, partial tags).
 * @param text The raw assistant message.
 * @returns True when a format-correction nudge is warranted.
 */
export function looksLikeMalformedToolAttempt(text: string): boolean {
    if (/<tool_call>/i.test(text) && parseToolCalls(text).length === 0) {
        return true;
    }

    if (/<\|tool_call_start\|>/i.test(text) && parseToolCalls(text).length === 0) {
        return true;
    }

    FENCE_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = FENCE_RE.exec(text)) !== null) {
        if (isToolLikeJson(match[1])) {
            return true;
        }
    }

    return /\b(read_file|list_dir|find_and_replace|run_command)\b/i.test(text)
        && (/```/.test(text) || /\[find_and_replace\(/.test(text));
}

/**
 * Returns a nudge when the model used markdown fences instead of tool_call tags.
 * @param lang The session language.
 */
export function buildMalformedToolNudge(lang: string): string {
    const example = '<tool_call>{"name":"read_file","arguments":{"path":"packages/cli/src/index.ts"}}</tool_call>';

    return lang === "pt"
        ? `Formato errado. Não use \`\`\`python nem JSON solto. Responda SOMENTE assim:\n${example}`
        : `Wrong format. Do not use \`\`\`python or bare JSON. Reply ONLY like this:\n${example}`;
}

/**
 * Returns a nudge when the model stopped after tool results or mid-exploration.
 * @param lang The session language.
 * @param afterTools True when tool results were just delivered.
 */
export function buildContinueNudge(lang: string, afterTools: boolean, userMessage = ""): string {
    const example = '<tool_call>{"name":"find_and_replace","arguments":{"path":"packages/cli/src/commands/add_provider_wizard/GoogleLogin.ts","old_string":"...","new_string":"..."}}</tool_call>';
    const hint = buildTaskHint(lang, userMessage);

    if (lang === "pt") {
        return afterTools
            ? `Você já recebeu os <tool_result> acima. Não pare — aplique find_and_replace agora:\n${example}${hint}`
            : `Continue a tarefa com ferramentas. Leia os arquivos relevantes e aplique find_and_replace:\n${example}${hint}`;
    }

    return afterTools
        ? `You already received the <tool_result> above. Do not stop — apply find_and_replace now:\n${example}${hint}`
        : `Continue the task with tools. Read the relevant files and apply find_and_replace:\n${example}${hint}`;
}
