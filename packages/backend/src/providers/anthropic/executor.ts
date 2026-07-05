import { BaseProvider, ProviderResponse } from "../BaseProvider";

class AnthropicToOpenAIStreamTransformer {
    private decoder = new TextDecoder();
    private encoder = new TextEncoder();
    private buffer = "";
    private messageId = "anthropic-msg";
    private modelName = "claude";

    constructor(modelName: string) {
        this.modelName = modelName;
    }

    transform(chunk: Uint8Array, controller: TransformStreamDefaultController<Uint8Array>) {
        this.buffer += this.decoder.decode(chunk, { stream: true });
        const lines = this.buffer.split("\n");
        this.buffer = lines.pop() || "";

        let currentEvent = "";

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
                continue;
            }
            if (trimmed.startsWith("event:")) {
                currentEvent = trimmed.slice(6).trim();
            } else
            if (trimmed.startsWith("data:")) {
                const dataStr = trimmed.slice(5).trim();
                try {
                    const dataObj = JSON.parse(dataStr);
                    const openAILine = this.translateEvent(currentEvent, dataObj);
                    if (openAILine) {
                        controller.enqueue(this.encoder.encode(`data: ${JSON.stringify(openAILine)}\n\n`));
                    }
                } catch (e) {
                    // Ignore parsing errors
                }
            }
        }
    }

    flush(controller: TransformStreamDefaultController<Uint8Array>) {
        controller.enqueue(this.encoder.encode("data: [DONE]\n\n"));
    }

    private translateEvent(event: string, data: any): any {
        if (data.type === "message_start") {
            this.messageId = data.message?.id || this.messageId;
            return {
                id: `chatcmpl-${this.messageId}`,
                object: "chat.completion.chunk",
                created: Math.floor(Date.now() / 1000),
                model: this.modelName,
                choices: [{
                    index: 0,
                    delta: { role: "assistant", content: "" },
                    finish_reason: null
                }]
            };
        } else
        if (data.type === "content_block_delta") {
            const content = data.delta?.text || "";
            return {
                id: `chatcmpl-${this.messageId}`,
                object: "chat.completion.chunk",
                created: Math.floor(Date.now() / 1000),
                model: this.modelName,
                choices: [{
                    index: 0,
                    delta: { content },
                    finish_reason: null
                }]
            };
        } else
        if (data.type === "message_delta") {
            let finishReason = "stop";
            if (data.delta?.stop_reason === "max_tokens") {
                finishReason = "length";
            }
            return {
                id: `chatcmpl-${this.messageId}`,
                object: "chat.completion.chunk",
                created: Math.floor(Date.now() / 1000),
                model: this.modelName,
                choices: [{
                    index: 0,
                    delta: {},
                    finish_reason: finishReason
                }]
            };
        }
        return null;
    }
}

export class AnthropicProvider implements BaseProvider {
    async execute(
        payload: any,
        apiKey: string,
        providerModel: string,
        baseUrl?: string
    ): Promise<ProviderResponse> {
        const targetUrl = `${baseUrl || "https://api.anthropic.com/v1"}/messages`;

        let systemPrompt = "";
        const anthropicMessages: any[] = [];

        if (payload.messages && Array.isArray(payload.messages)) {
            for (const msg of payload.messages) {
                if (msg.role === "system" || msg.role === "developer") {
                    systemPrompt += (systemPrompt ? "\n" : "") + msg.content;
                } else {
                    anthropicMessages.push({
                        role: msg.role === "assistant" ? "assistant" : "user",
                        content: msg.content
                    });
                }
            }
        }

        const anthropicPayload = {
            model: providerModel,
            system: systemPrompt || undefined,
            messages: anthropicMessages,
            max_tokens: payload.max_tokens || 4096,
            temperature: payload.temperature ?? 1.0,
            stream: payload.stream || false
        };

        const headers: Record<string, string> = {
            "content-type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01"
        };

        const response = await fetch(targetUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(anthropicPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Anthropic provider error (${response.status}): ${errorText}`);
        }

        const isStream = payload.stream === true;
        const responseHeaders: Record<string, string> = {
            "Content-Type": isStream ? "text/event-stream" : "application/json"
        };

        if (isStream && response.body) {
            const transformer = new AnthropicToOpenAIStreamTransformer(providerModel);
            const ts = new TransformStream({
                transform(chunk, controller) {
                    transformer.transform(chunk, controller);
                },
                flush(controller) {
                    transformer.flush(controller);
                }
            });

            const transformedStream = response.body.pipeThrough(ts as any);

            return {
                status: response.status,
                headers: responseHeaders,
                body: transformedStream as any,
                isStream: true
            };
        }

        const rawJsonText = await response.text();
        const anthropicRes = JSON.parse(rawJsonText);

        const openAIRes = {
            id: `chatcmpl-${anthropicRes.id}`,
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            model: providerModel,
            choices: [
                {
                    index: 0,
                    message: {
                        role: "assistant",
                        content: anthropicRes.content[0]?.text || ""
                    },
                    finish_reason: "stop"
                }
            ],
            usage: {
                prompt_tokens: anthropicRes.usage?.input_tokens || 0,
                completion_tokens: anthropicRes.usage?.output_tokens || 0,
                total_tokens: (anthropicRes.usage?.input_tokens || 0) + (anthropicRes.usage?.output_tokens || 0)
            }
        };

        return {
            status: 200,
            headers: responseHeaders,
            body: JSON.stringify(openAIRes),
            isStream: false
        };
    }
}
