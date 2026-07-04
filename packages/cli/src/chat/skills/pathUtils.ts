import * as path from "path";
import { SkillContext } from "./types";

/**
 * Resolves a user-supplied path relative to cwd, constrained to the project root.
 * @param ctx The skill runtime context.
 * @param filePath The path from the model (relative to cwd or absolute).
 * @returns The resolved absolute path.
 */
export function resolveSkillPath(ctx: SkillContext, filePath: string): string {
    if (!filePath) {
        throw new Error("path is required");
    }

    const root = path.resolve(ctx.projectRoot);
    const resolved = path.isAbsolute(filePath)
        ? path.resolve(filePath)
        : path.resolve(ctx.cwd, filePath);
    const prefix = root.endsWith(path.sep) ? root : root + path.sep;

    if (resolved.toLowerCase() !== root.toLowerCase() && !resolved.toLowerCase().startsWith(prefix.toLowerCase())) {
        throw new Error(`Path outside project root: ${filePath}`);
    }

    return resolved;
}
