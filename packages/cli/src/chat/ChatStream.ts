import chalk from "chalk";

export interface StreamResult {
    text: string;
    provider: string;
    targetModel: string;
}

/**
 * Consumes an SSE chat completion stream and writes tokens to stdout.
 * @param response The fetch Response with a readable body.
 * @param onFirstToken Optional callback fired when the first token arrives.
 * @returns The full assistant text and routing metadata.
 */
export async function consumeChatStream(
    response: Response,
    onFirstToken?: () => void
): Promise<StreamResult> {
    const provider = response.headers.get("x-mux-provider") || response.headers.get("X-Mux-Provider") || "";
    const targetModel = response.headers.get("x-mux-model") || response.headers.get("X-Mux-Model") || "";

    let assistantResponse = "";
    let firstToken = true;
    const decoder = new TextDecoder();
    let buffer = "";

    const processLines = (text: string): string => {
        const lines = text.split("\n");
        const remaining = lines.pop() || "";

        for (const line of lines) {
            const cleanLine = line.trim();

            if (!cleanLine || !cleanLine.startsWith("data: ")) {
                continue;
            }

            const dataStr = cleanLine.substring(6).trim();

            if (dataStr === "[DONE]") {
                break;
            }

            try {
                const parsed = JSON.parse(dataStr);
                const content = parsed.choices?.[0]?.delta?.content || "";

                if (content) {
                    if (firstToken) {
                        firstToken = false;
                        onFirstToken?.();
                    }

                    assistantResponse += content;
                    process.stdout.write(content);
                }
            } catch (_) {
                // Ignore partial SSE lines
            }
        }

        return remaining;
    };

    const body = response.body as any;

    if (body && typeof body.getReader === "function") {
        const reader = body.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            buffer += decoder.decode(value, { stream: true });
            buffer = processLines(buffer);
        }
    } else if (body && typeof body[Symbol.asyncIterator] === "function") {
        for await (const chunk of body) {
            buffer += decoder.decode(chunk, { stream: true });
            buffer = processLines(buffer);
        }
    }

    buffer = processLines(buffer + "\n");

    return { text: assistantResponse, provider, targetModel };
}

/**
 * Formats the responding model label for chat output.
 * @param routerModel The exposed router model name.
 * @param provider The upstream provider name.
 * @param targetModel The upstream provider model name.
 * @returns A chalk-formatted label string.
 */
export function formatModelLabel(routerModel: string, provider: string, targetModel: string): string {
    if (targetModel && provider) {
        return chalk.magenta.bold(`${routerModel}`) + chalk.gray(` → ${targetModel} via ${provider}`);
    }

    return chalk.magenta.bold(routerModel);
}
