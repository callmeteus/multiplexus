import * as fs from "fs";
import { resolveSkillPath } from "../SkillPathUtils";
import { Skill, SkillContext, ToolResult } from "../Types";

/**
 * Lists files and directories at a path.
 */
export const listDirSkill: Skill = {
    name: "list_dir",
    description: "List entries in a directory (omit path for cwd)",
    example: '{"name":"list_dir","arguments":{"path":"packages/cli"}}',

    execute(args: Record<string, string>, ctx: SkillContext): ToolResult {
        try {
            const dirPath = args.path ? resolveSkillPath(ctx, args.path) : ctx.cwd;
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            const lines = entries.map(e => `${e.isDirectory() ? "[dir]" : "[file]"} ${e.name}`);
            return { name: this.name, ok: true, output: lines.join("\n") || "(empty)" };
        } catch (err: any) {
            return { name: this.name, ok: false, output: err.message || String(err) };
        }
    }
};
