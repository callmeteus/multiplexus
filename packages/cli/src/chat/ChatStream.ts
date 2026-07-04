import chalk from "chalk";

export interface StreamResult {
    text: string;
    provider: string;
    targetModel: string;
}

export interface StreamOptions {
    /** Called when the first visible (non-tool_call) token arrives. */
    onFirstVisibleToken?: () => void;
    /** Called with the full accumulated text on each content delta. */
    onTextUpdate?: (fullText: string, visibleDelta: string) => void;
}

/**
 * Consumes an SSE chat completion stream.
 * Tool_call blocks are kept in the full text but excluded from visible deltas.
 * @param response The fetch Response with a readable body.
 * @param options Stream display options.
 * @returns The full assistant text and routing metadata.
 */
export async function consumeChatStream(
    response: Response,
    options?: StreamOptions
): Promise<StreamResult> {
    const provider = response.headers.get("x-mux-provider") || response.headers.get("X-Mux-Provider") || "";
    const targetModel = response.headers.get("x-mux-model") || response.headers.get("X-Mux-Model") || "";

    let assistantResponse = "";
    let firstVisible = true;
    const decoder = new TextDecoder();
    let buffer = "";

    const emitVisibleDelta = (content: string) => {
        if (!content) {
            return;
        }

        const prevVisible = stripPartialToolCalls(assistantResponse);
        assistantResponse += content;
        const nextVisible = stripPartialToolCalls(assistantResponse);
        const delta = nextVisible.startsWith(prevVisible)
            ? nextVisible.slice(prevVisible.length)
            : nextVisible;

        if (!delta) {
            return;
        }

        if (firstVisible) {
            firstVisible = false;
            options?.onFirstVisibleToken?.();
        }

        options?.onTextUpdate?.(assistantResponse, delta);
    };

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
                emitVisibleDelta(content);
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
 * Strips tool_call blocks and partial openings from display text.
 * @param text The raw assistant text.
 */
function stripPartialToolCalls(text: string): string {
    return text
        .replace(/<tool_call>[\s\S]*?<\/tool_call>/g, "")
        .replace(/<tool_call>[\s\S]*$/g, "")
        .trim();
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
