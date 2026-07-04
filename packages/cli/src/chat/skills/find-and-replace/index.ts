import * as fs from "fs";
import { resolveSkillPath } from "../../../utils/SkillPathUtils";
import { Skill, SkillContext, ToolResult } from "../../Types";

/**
 * Preferred way to edit existing files: swap one unique, exact snippet for another.
 */
export const findAndReplaceSkill: Skill = {
    name: "find_and_replace",
    description: "Edit existing files - replace one unique old_string with new_string (preferred over write_file)",
    example: '{"name":"find_and_replace","arguments":{"path":"packages/cli/src/index.ts","old_string":"const x = 1;","new_string":"const x = 2;"}}',

    execute(args: Record<string, string>, ctx: SkillContext): ToolResult {
        try {
            const target = resolveSkillPath(ctx, args.path);
            const oldString = args.old_string ?? "";
            const newString = args.new_string ?? "";
            const content = fs.readFileSync(target, "utf-8");

            if (!oldString) {
                throw new Error("old_string is required");
            }

            if (!content.includes(oldString)) {
                throw new Error("old_string not found in file");
            }

            const occurrences = content.split(oldString).length - 1;
            if (occurrences > 1) {
                throw new Error("old_string is not unique - include more surrounding context");
            }

            fs.writeFileSync(target, content.replace(oldString, newString), "utf-8");
            return { name: this.name, ok: true, output: `Updated ${args.path}` };
        } catch (err: any) {
            return { name: this.name, ok: false, output: err.message || String(err) };
        }
    }
};
