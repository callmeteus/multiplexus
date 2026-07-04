export interface ProviderResponse {
    /**
     * The status code of the response.
     */
    status: number;

    /**
     * The headers of the response.
     */
    headers: Record<string, string>;

    /**
     * The body of the response.
     */
    body: ReadableStream<Uint8Array> | string;

    /**
     * Whether the response is a stream.
     */
    isStream: boolean;
}

export interface BaseProvider {
    /**
     * Executes a request to the provider.
     * @param payload The payload to send to the provider.
     * @param apiKey The API key to use for the request.
     * @param providerModel The model to use for the request.
     * @param baseUrl The base URL to use for the request.
     * @returns The response from the provider.
     */
    execute(
        payload: any,
        apiKey: string,
        providerModel: string,
        baseUrl?: string
    ): Promise<ProviderResponse>;
}
