import chalk from "chalk";
import * as readline from "readline";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

/**
 * Lightweight stdout-only spinner that does not touch stdin (safe with readline).
 */
export class ChatSpinner {
    private timer: ReturnType<typeof setInterval> | null = null;
    private frame = 0;
    private message = "";

    /**
     * Starts the spinner with a status message.
     * @param message The message to display.
     */
    start(message: string): void {
        this.stop();
        this.message = message;
        this.frame = 0;
        this.timer = setInterval(() => {
            const icon = FRAMES[this.frame++ % FRAMES.length];
            process.stdout.write(`\r\x1b[2K${chalk.cyan(icon)} ${this.message}`);
        }, 80);
    }

    /**
     * Updates the spinner message in place.
     * @param message The new message.
     */
    update(message: string): void {
        this.message = message;
    }

    /**
     * Stops the spinner and optionally prints a final line.
     * @param finalMessage Optional line to print after clearing the spinner.
     */
    stop(finalMessage?: string): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        process.stdout.write("\r\x1b[2K");

        if (finalMessage) {
            console.log(finalMessage);
        }
    }
}

/**
 * Ensures stdin and readline are ready to accept input again after async work.
 * @param rl The readline interface.
 */
export function ensureReadlineReady(rl: readline.Interface): void {
    if (process.stdin.isPaused()) {
        process.stdin.resume();
    }

    rl.resume();
}

/**
 * Asks a yes/no question without clack (safe alongside readline).
 * @param rl The readline interface.
 * @param message The prompt message.
 * @returns True when the user answered yes.
 */
export function askYesNo(rl: readline.Interface, message: string): Promise<boolean> {
    return new Promise((resolve) => {
        rl.question(`${message}\n${chalk.gray("[y/N]")} `, (answer) => {
            resolve(/^y(es)?$/i.test(answer.trim()));
        });
    });
}
