import * as fs from "fs";
import { resolveSkillPath } from "../SkillPathUtils";
import { Skill, SkillContext, ToolResult } from "../Types";

/**
 * Replaces a unique string occurrence inside a file.
 */
export const searchReplaceSkill: Skill = {
    name: "search_replace",
    description: "Replace a unique old_string with new_string in a file",
    example: '{"name":"search_replace","arguments":{"path":"...","old_string":"...","new_string":"..."}}',

    execute(args: Record<string, string>, ctx: SkillContext): ToolResult {
        try {
            const target = resolveSkillPath(ctx, args.path);
            const oldString = args.old_string ?? "";
            const newString = args.new_string ?? "";
            const content = fs.readFileSync(target, "utf-8");

            if (!content.includes(oldString)) {
                throw new Error("old_string not found in file");
            }

            const occurrences = content.split(oldString).length - 1;
            if (occurrences > 1) {
                throw new Error("old_string is not unique in file");
            }

            fs.writeFileSync(target, content.replace(oldString, newString), "utf-8");
            return { name: this.name, ok: true, output: `Updated ${args.path}` };
        } catch (err: any) {
            return { name: this.name, ok: false, output: err.message || String(err) };
        }
    }
};
