import { execSync } from "child_process";
import { resolveSkillDir } from "../../../utils/SkillPathUtils";
import { Skill, SkillContext, ToolResult } from "../../Types";

const MAX_OUTPUT = 512 * 1024;
const TIMEOUT_MS = 120_000;

/**
 * Runs a shell command in the project (requires user approval before execution).
 */
export const runCommandSkill: Skill = {
    name: "run_command",
    description: "Run a shell command in cwd or an optional working directory (requires user approval)",
    example: '{"name":"run_command","arguments":{"command":"npm run build -w packages/cli"}}',
    requiresApproval: true,

    execute(args: Record<string, string>, ctx: SkillContext): ToolResult {
        const command = args.command?.trim();

        if (!command) {
            return { name: this.name, ok: false, output: "command is required" };
        }

        try {
            const workDir = resolveSkillDir(ctx, args.cwd);
            const shell = process.platform === "win32"
                ? (process.env.ComSpec || "cmd.exe")
                : "/bin/sh";
            const output = execSync(command, {
                cwd: workDir,
                encoding: "utf-8",
                maxBuffer: MAX_OUTPUT,
                timeout: TIMEOUT_MS,
                shell,
                windowsHide: true,
                stdio: ["ignore", "pipe", "pipe"]
            });

            return {
                name: this.name,
                ok: true,
                output: output.trim() || "(no output)"
            };
        } catch (err: any) {
            const stdout = err.stdout?.toString?.() ?? "";
            const stderr = err.stderr?.toString?.() ?? "";
            const parts = [stdout, stderr, err.message].filter(Boolean);
            return {
                name: this.name,
                ok: false,
                output: parts.join("\n").trim() || "Command failed"
            };
        }
    }
};
