import { BaseProvider } from "./BaseProvider";
import { OpenAIProvider } from "./OpenAIProvider";
import { AnthropicProvider } from "./AnthropicProvider";
import { ApiType } from "@multiplexus/shared";

/**
 * The registry of providers.
 */
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
    const provider = REGISTRY[apiType];
    if (!provider) {
        throw new Error(`Unsupported API type: ${apiType}`);
    }
    return provider;
}
