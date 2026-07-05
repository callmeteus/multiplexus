import { ChildProcess, execFileSync, spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

export interface BackgroundProcessOptions {
    /** Working directory for the background process. */
    cwd: string;
    /** Log file path (stdout and stderr are appended here). */
    logFile: string;
    /** Windows launcher filename inside the log file directory. */
    launcherName?: string;
}

export interface BackgroundProcessHandle {
    /** PID of the root background process. */
    pid: number | null;
    /** Unix detached child; null on Windows after Start-Process. */
    child: ChildProcess | null;
}

/**
 * Quotes a value for safe use inside a Windows cmd argument.
 * @param value The value to quote.
 */
function quoteCmdArg(value: string): string {
    if (/[\s"]/u.test(value)) {
        return `"${value.replace(/"/g, "\"\"")}"`;
    }

    return value;
}

/**
 * Writes a Windows launcher script that redirects output to a log file.
 * @param launcherPath The launcher script path.
 * @param cwd The working directory.
 * @param command The executable path.
 * @param args The command arguments.
 * @param logFile The log file path.
 */
function writeWindowsLauncher(
    launcherPath: string,
    cwd: string,
    command: string,
    args: string[],
    logFile: string
): void {
    const invocation = [quoteCmdArg(command), ...args.map(quoteCmdArg)].join(" ");
    const launcherContent = [
        "@echo off",
        `cd /d ${quoteCmdArg(cwd)}`,
        `${invocation} 1>>${quoteCmdArg(logFile)} 2>&1`
    ].join("\r\n");

    fs.writeFileSync(launcherPath, launcherContent, "utf-8");
}

/**
 * Starts a hidden background process on Windows via PowerShell Start-Process.
 * @param launcherPath The launcher script path.
 * @param cwd The working directory.
 * @returns The PID of the started process, or null on failure.
 */
function startHiddenWindowsProcess(launcherPath: string, cwd: string): number | null {
    try {
        const escapedLauncher = launcherPath.replace(/"/g, "\"\"");
        const escapedCwd = cwd.replace(/'/g, "''");
        const script = [
            "$p = Start-Process",
            "-FilePath 'cmd.exe'",
            `-ArgumentList '/d /s /c "${escapedLauncher}"'`,
            `-WorkingDirectory '${escapedCwd}'`,
            "-WindowStyle Hidden",
            "-PassThru",
            "; Write-Output $p.Id"
        ].join(" ");

        const output = execFileSync(
            "powershell.exe",
            ["-NoProfile", "-ExecutionPolicy", "Bypass", "-WindowStyle", "Hidden", "-Command", script],
            { encoding: "utf-8", windowsHide: true }
        );

        const pid = Number.parseInt(output.trim(), 10);
        return Number.isInteger(pid) && pid > 0 ? pid : null;
    } catch (_) {
        return null;
    }
}

/**
 * Spawns a detached background process without a visible console window.
 * On Windows, uses PowerShell Start-Process with -WindowStyle Hidden.
 * On Linux and macOS, uses a detached child process with log redirection.
 * @param command The executable path.
 * @param args The command arguments.
 * @param options Spawn options.
 * @returns The spawned process handle.
 */
export function spawnBackgroundProcess(
    command: string,
    args: string[],
    options: BackgroundProcessOptions
): BackgroundProcessHandle {
    const { cwd, logFile, launcherName = "background.cmd" } = options;

    fs.mkdirSync(path.dirname(logFile), { recursive: true });

    if (process.platform === "win32") {
        const launcherPath = path.join(path.dirname(logFile), launcherName);
        writeWindowsLauncher(launcherPath, cwd, command, args, logFile);

        return {
            pid: startHiddenWindowsProcess(launcherPath, cwd),
            child: null
        };
    }

    const logFd = fs.openSync(logFile, "a");

    try {
        const child = spawn(command, args, {
            cwd,
            detached: true,
            stdio: ["ignore", logFd, logFd],
            windowsHide: true
        });

        child.unref();

        return {
            pid: child.pid ?? null,
            child
        };
    } catch (_) {
        try {
            fs.closeSync(logFd);
        } catch (_) {
            // Ignore
        }

        return {
            pid: null,
            child: null
        };
    }
}
