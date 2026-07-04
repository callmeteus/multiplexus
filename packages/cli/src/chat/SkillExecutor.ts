import { SKILL_REGISTRY } from "./SkillRegistry";
import { SkillContext, ToolCall, ToolResult } from "./Types";

const TOOL_CALL_RE = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/g;
const FENCE_RE = /```(?:json|python|javascript|typescript|tool)?\s*([\s\S]*?)\s*```/gi;
const KIMI_WRAPPER_RE = /<\|tool_call_start\|>\s*(\[[\s\S]*?\])\s*<\|[^>]*\|>/gi;

/**
 * Regex matching bracket-style tool calls emitted by some models (e.g. Kimi).
 */
const BRACKET_TOOL_RE = new RegExp(
    `\\[(${[...SKILL_REGISTRY.keys()].join("|")})\\(([\s\S]*?)\\)\\]`,
    "gi"
);

/**
 * Parses keyword arguments from bracket-style tool calls: key='value', key="value".
 * @param argsStr The argument string inside the parentheses.
 * @returns Parsed argument map.
 */
function parseKeywordArgs(argsStr: string): Record<string, string> {
    const args: Record<string, string> = {};
    let i = 0;
    const s = argsStr.trim();

    while (i < s.length) {
        while (i < s.length && /[\s,]/.test(s[i])) {
            i++;
        }

        if (i >= s.length) {
            break;
        }

        const keyStart = i;
        while (i < s.length && /\w/.test(s[i])) {
            i++;
        }

        const key = s.slice(keyStart, i);
        if (!key) {
            break;
        }

        while (i < s.length && /\s/.test(s[i])) {
            i++;
        }

        if (s[i] !== "=") {
            break;
        }

        i++;
        while (i < s.length && /\s/.test(s[i])) {
            i++;
        }

        const quote = s[i];
        if (quote !== "'" && quote !== '"') {
            break;
        }

        i++;
        let value = "";

        while (i < s.length) {
            if (s[i] === "\\" && i + 1 < s.length) {
                value += s[i + 1];
                i += 2;
                continue;
            }

            if (s[i] === quote) {
                i++;
                break;
            }

            value += s[i++];
        }

        args[key] = value;
    }

    return args;
}

/**
 * Parses bracket-style tool calls: [read_file(path='foo.ts')].
 * @param raw The bracket call string.
 * @returns A tool call, or null when parsing fails.
 */
function parseBracketToolCall(raw: string): ToolCall | null {
    const match = raw.trim().match(/^\[(\w+)\(([\s\S]*)\)\]$/);
    if (!match) {
        return null;
    }

    const name = match[1];
    if (!SKILL_REGISTRY.has(name)) {
        return null;
    }

    const args = parseKeywordArgs(match[2]);
    if (Object.keys(args).length === 0) {
        return null;
    }

    return { name, arguments: args };
}

/**
 * Parses a JSON payload into a tool call, including common shorthand forms.
 * @param raw The JSON string inside a tool_call block or code fence.
 * @returns A tool call, or null when the payload is not tool-like.
 */
function parseToolCallPayload(raw: string): ToolCall | null {
    try {
        const parsed = JSON.parse(raw.trim()) as Record<string, unknown>;

        if (typeof parsed.name === "string") {
            return {
                name: parsed.name,
                arguments: (parsed.arguments as Record<string, string>) ?? {}
            };
        }

        if (typeof parsed.path === "string") {
            if (typeof parsed.old_string === "string") {
                return {
                    name: "find_and_replace",
                    arguments: parsed as Record<string, string>
                };
            }

            if (typeof parsed.content === "string") {
                return {
                    name: "write_file",
                    arguments: parsed as Record<string, string>
                };
            }

            return {
                name: "read_file",
                arguments: { path: parsed.path }
            };
        }

        if (typeof parsed.command === "string") {
            return {
                name: "run_command",
                arguments: { command: parsed.command }
            };
        }
    } catch (_) {
        // Ignore malformed JSON
    }

    return null;
}

/**
 * Returns true when a parsed tool call has the required arguments.
 * @param call The tool call to validate.
 */
function isValidToolCall(call: ToolCall): boolean {
    switch (call.name) {
        case "read_file":
        case "write_file":
        case "find_and_replace":
            return Boolean(call.arguments.path?.trim());
        case "list_dir":
            return true;
        case "run_command":
            return Boolean(call.arguments.command?.trim());
        default:
            return SKILL_REGISTRY.has(call.name);
    }
}

/**
 * Parses tool call blocks from an assistant message.
 * Accepts canonical <tool_call> tags and fenced JSON shorthands from weaker models.
 * @param content The assistant message content.
 * @returns Parsed tool calls.
 */
export function parseToolCalls(content: string): ToolCall[] {
    const seen = new Set<string>();
    const calls: ToolCall[] = [];

    /**
     * Adds a tool call to the list if it is not already present.
     * @param call The tool call to add.
     */
    const add = (call: ToolCall | null) => {
        if (!call || !isValidToolCall(call)) {
            return;
        }

        const key = JSON.stringify(call);
        if (seen.has(key)) {
            return;
        }

        seen.add(key);
        calls.push(call);
    };

    let match: RegExpExecArray | null;

    TOOL_CALL_RE.lastIndex = 0;
    while ((match = TOOL_CALL_RE.exec(content)) !== null) {
        add(parseToolCallPayload(match[1]));
    }

    FENCE_RE.lastIndex = 0;
    while ((match = FENCE_RE.exec(content)) !== null) {
        add(parseToolCallPayload(match[1]));
    }

    KIMI_WRAPPER_RE.lastIndex = 0;
    while ((match = KIMI_WRAPPER_RE.exec(content)) !== null) {
        add(parseBracketToolCall(match[1]));
    }

    BRACKET_TOOL_RE.lastIndex = 0;
    while ((match = BRACKET_TOOL_RE.exec(content)) !== null) {
        const name = match[1];
        if (!SKILL_REGISTRY.has(name)) {
            continue;
        }

        const args = parseKeywordArgs(match[2]);
        if (Object.keys(args).length === 0) {
            continue;
        }

        add({ name, arguments: args });
    }

    return calls;
}

/**
 * Checks whether a message contains tool calls.
 * @param content The assistant message content.
 * @returns True when tool calls are present.
 */
export function hasToolCalls(content: string): boolean {
    return parseToolCalls(content).length > 0;
}

/**
 * Executes a single tool call through the skill registry.
 * @param ctx The skill runtime context.
 * @param call The tool call to execute.
 * @returns The tool execution result.
 */
export async function executeToolCall(ctx: SkillContext, call: ToolCall): Promise<ToolResult> {
    const skill = SKILL_REGISTRY.get(call.name);

    if (!skill) {
        return { name: call.name, ok: false, output: `Unknown tool: ${call.name}` };
    }

    if (skill.requiresApproval) {
        if (!ctx.approve) {
            return { name: call.name, ok: false, output: "Approval handler not available" };
        }

        const approved = await ctx.approve(skill.name, call.arguments);
        if (!approved) {
            return { name: call.name, ok: false, output: "User rejected execution" };
        }
    }

    return await Promise.resolve(skill.execute(call.arguments, ctx));
}

/**
 * Executes all tool calls from an assistant message.
 * @param ctx The skill runtime context.
 * @param content The assistant message containing tool calls.
 * @param hooks Optional per-tool UI hooks.
 * @returns Tool execution results.
 */
export async function executeToolCalls(
    ctx: SkillContext,
    content: string,
    hooks?: {
        onStart?: (call: ToolCall) => void;
        onEnd?: (call: ToolCall, result: ToolResult) => void;
    }
): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const call of parseToolCalls(content)) {
        hooks?.onStart?.(call);
        const result = await executeToolCall(ctx, call);
        hooks?.onEnd?.(call, result);
        results.push(result);
    }

    return results;
}

/**
 * Formats tool results as a user message for the next model turn.
 * @param results The tool execution results.
 * @returns The formatted message content.
 */
export function formatToolResults(results: ToolResult[]): string {
    return results.map(r =>
        `<tool_result tool="${r.name}" ok="${r.ok}">\n${r.output}\n</tool_result>`
    ).join("\n\n");
}
