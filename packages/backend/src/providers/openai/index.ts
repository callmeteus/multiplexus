import { isKeylessApiKey } from "@multiplexus/shared";
import { DiscoveredModel, ProviderHandler, fetchOpenAICompatibleList, sortModels } from "../../ProviderHandler";
import { BaseProvider, ProviderResponse } from "../BaseProvider";

export const openaiHandler: ProviderHandler = {
    displayName: "OpenAI",

    async fetchModels(apiKey = "", baseUrl = "https://api.openai.com/v1"): Promise<DiscoveredModel[]> {
        const models = await fetchOpenAICompatibleList(baseUrl, apiKey);
        return sortModels(models);
    }
};

export class OpenAIProvider implements BaseProvider {
    async execute(
        payload: any,
        apiKey: string,
        providerModel: string,
        baseUrl?: string
    ): Promise<ProviderResponse> {
        const targetUrl = `${baseUrl || "https://api.openai.com/v1"}/chat/completions`;

        const targetPayload = {
            ...payload,
            model: providerModel
        };

        const headers: Record<string, string> = {
            "Content-Type": "application/json"
        };

        if (!isKeylessApiKey(apiKey)) {
            headers["Authorization"] = `Bearer ${apiKey}`;
        }

        const response = await fetch(targetUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(targetPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI-compatible provider error (${response.status}): ${errorText}`);
        }

        const isStream = payload.stream === true;
        const responseHeaders: Record<string, string> = {
            "Content-Type": response.headers.get("content-type") || "application/json"
        };

        if (isStream && response.body) {
            return {
                status: response.status,
                headers: responseHeaders,
                body: response.body as any,
                isStream: true
            };
        }

        const text = await response.text();
        return {
            status: response.status,
            headers: responseHeaders,
            body: text,
            isStream: false
        };
    }
}
