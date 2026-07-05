import { BaseProvider } from "./BaseProvider";
import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { ApiType } from "@multiplexus/shared";

const REGISTRY: Record<string, BaseProvider> = {
    [ApiType.OPENAI]: new OpenAIProvider(),
    [ApiType.ANTHROPIC]: new AnthropicProvider()
};

/**
 * Gets a provider based on the API type.
 * @param apiType The API type.
 * @returns The provider.
 */
export function getProvider(apiType: string): BaseProvider {
    const provider = REGISTRY[apiType.toUpperCase()];

    if (!provider) {
        throw new Error(`Unsupported API type: ${apiType}`);
    }
    return provider;
}
