import * as fs from "fs";
import * as path from "path";
import { resolveSkillPath } from "../../../utils/SkillPathUtils";
import { Skill, SkillContext, ToolResult } from "../../Types";

const PLACEHOLDER_RE = /\.\.\.\s*(updated|content|existing|arquivo|file)?\s*(\.\.\.)?/i;

/**
 * Rejects placeholder or truncated file content from model output.
 * @param content The proposed file content.
 */
function assertRealFileContent(content: string): void {
    if (!content || content.trim().length < 8) {
        throw new Error("content is too short or empty");
    }

    if (PLACEHOLDER_RE.test(content)) {
        throw new Error("placeholder content rejected - use find_and_replace with exact old_string from read_file");
    }
}

/**
 * Writes a new text file in the project.
 */
export const writeFileSkill: Skill = {
    name: "write_file",
    description: "Create a new file only - never use on existing files (use find_and_replace instead)",
    example: '{"name":"write_file","arguments":{"path":"...","content":"..."}}',
    requiresApproval: true,

    execute(args: Record<string, string>, ctx: SkillContext): ToolResult {
        try {
            const content = args.content ?? "";
            const target = resolveSkillPath(ctx, args.path);

            if (fs.existsSync(target)) {
                throw new Error("file already exists - use find_and_replace after read_file");
            }

            assertRealFileContent(content);
            fs.mkdirSync(path.dirname(target), { recursive: true });
            fs.writeFileSync(target, content, "utf-8");
            return { name: this.name, ok: true, output: `Wrote ${args.path}` };
        } catch (err: any) {
            return { name: this.name, ok: false, output: err.message || String(err) };
        }
    }
};
