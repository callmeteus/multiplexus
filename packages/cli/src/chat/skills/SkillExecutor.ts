import { SKILL_REGISTRY } from "./SkillRegistry";
import { SkillContext, ToolCall, ToolResult } from "./types";

const TOOL_CALL_RE = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/g;

/**
 * Parses tool call blocks from an assistant message.
 * @param content The assistant message content.
 * @returns Parsed tool calls.
 */
export function parseToolCalls(content: string): ToolCall[] {
    const calls: ToolCall[] = [];
    let match: RegExpExecArray | null;

    TOOL_CALL_RE.lastIndex = 0;
    while ((match = TOOL_CALL_RE.exec(content)) !== null) {
        try {
            const parsed = JSON.parse(match[1].trim()) as { name?: string; arguments?: Record<string, string> };
            if (parsed.name) {
                calls.push({
                    name: parsed.name,
                    arguments: parsed.arguments ?? {}
                });
            }
        } catch (_) {
            // Ignore malformed tool blocks
        }
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
export function executeToolCall(ctx: SkillContext, call: ToolCall): ToolResult {
    const skill = SKILL_REGISTRY.get(call.name);

    if (!skill) {
        return { name: call.name, ok: false, output: `Unknown tool: ${call.name}` };
    }

    return skill.execute(call.arguments, ctx);
}

/**
 * Executes all tool calls from an assistant message.
 * @param ctx The skill runtime context.
 * @param content The assistant message containing tool calls.
 * @returns Tool execution results.
 */
export function executeToolCalls(ctx: SkillContext, content: string): ToolResult[] {
    return parseToolCalls(content).map(call => executeToolCall(ctx, call));
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
