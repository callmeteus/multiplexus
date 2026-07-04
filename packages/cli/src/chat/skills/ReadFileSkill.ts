import * as fs from "fs";
import { resolveSkillPath } from "./pathUtils";
import { Skill, SkillContext, ToolResult } from "./types";

/**
 * Reads a text file from the project.
 */
export const readFileSkill: Skill = {
    name: "read_file",
    description: "Read a file (path relative to cwd or absolute within project)",
    example: '{"name":"read_file","arguments":{"path":"packages/cli/src/index.ts"}}',

    execute(args: Record<string, string>, ctx: SkillContext): ToolResult {
        try {
            const target = resolveSkillPath(ctx, args.path);
            const content = fs.readFileSync(target, "utf-8");
            return { name: this.name, ok: true, output: content };
        } catch (err: any) {
            return { name: this.name, ok: false, output: err.message || String(err) };
        }
    }
};
