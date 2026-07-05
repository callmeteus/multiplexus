/** Stored in ProviderKey when the upstream preset has requiresApiKey: false. */
export const NO_API_KEY_MARKER = "__none__";

/**
 * Returns true when the provider key should not be sent as a Bearer token.
 * @param apiKey The stored provider key value.
 */
export function isKeylessApiKey(apiKey: string): boolean {
    return apiKey === NO_API_KEY_MARKER || apiKey === "__keyless__" || apiKey === "not-needed" || apiKey === "";
}
