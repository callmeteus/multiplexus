/**
 * Runtime context passed to every skill execution.
 */
export interface SkillContext {
    /** The multiplexus monorepo root. */
    projectRoot: string;
    /** The shell working directory when the chat session started. */
    cwd: string;
    /**
     * Prompts the user before running skills that require approval.
     * @param skillName The skill being invoked.
     * @param args The tool arguments from the model.
     * @returns True when the user approved execution.
     */
    approve?: (skillName: string, args: Record<string, string>) => Promise<boolean>;
}

/**
 * A parsed tool invocation from the assistant message.
 */
export interface ToolCall {
    name: string;
    arguments: Record<string, string>;
}

/**
 * The result of executing a single skill.
 */
export interface ToolResult {
    name: string;
    ok: boolean;
    output: string;
}

/**
 * Contract that every chat skill must implement.
 */
export interface Skill {
    /** Unique skill name used in tool_call JSON. */
    readonly name: string;
    /** Short description shown in the system prompt. */
    readonly description: string;
    /** Example tool_call JSON for the system prompt. */
    readonly example: string;
    /** When true, execution pauses for user approval via SkillContext.approve. */
    readonly requiresApproval?: boolean;
    /**
     * Executes the skill.
     * @param args The tool arguments from the model.
     * @param ctx The skill runtime context.
     */
    execute(args: Record<string, string>, ctx: SkillContext): ToolResult | Promise<ToolResult>;
}
