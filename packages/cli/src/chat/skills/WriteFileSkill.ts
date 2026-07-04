import * as fs from "fs";
import * as path from "path";
import { resolveSkillPath } from "./pathUtils";
import { Skill, SkillContext, ToolResult } from "./types";

/**
 * Writes or overwrites a text file in the project.
 */
export const writeFileSkill: Skill = {
    name: "write_file",
    description: "Write or overwrite a file",
    example: '{"name":"write_file","arguments":{"path":"...","content":"..."}}',

    execute(args: Record<string, string>, ctx: SkillContext): ToolResult {
        try {
            const target = resolveSkillPath(ctx, args.path);
            fs.mkdirSync(path.dirname(target), { recursive: true });
            fs.writeFileSync(target, args.content ?? "", "utf-8");
            return { name: this.name, ok: true, output: `Wrote ${args.path}` };
        } catch (err: any) {
            return { name: this.name, ok: false, output: err.message || String(err) };
        }
    }
};
