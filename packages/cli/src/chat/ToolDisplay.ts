import chalk from "chalk";

const TOOL_CALL_RE = /<tool_call>[\s\S]*?<\/tool_call>/g;
const PARTIAL_TOOL_CALL_RE = /<tool_call>[\s\S]*$/;

/**
 * Removes tool_call blocks from text for chat display.
 * @param text The raw assistant message.
 * @returns Text safe to show in the terminal.
 */
export function stripToolCallsForDisplay(text: string): string {
    return text
        .replace(TOOL_CALL_RE, "")
        .replace(PARTIAL_TOOL_CALL_RE, "")
        .trim();
}

/**
 * Returns true when the message is only tool calls with no visible prose.
 * @param text The raw assistant message.
 */
export function isToolOnlyMessage(text: string): boolean {
    return stripToolCallsForDisplay(text).length === 0 && TOOL_CALL_RE.test(text);
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
