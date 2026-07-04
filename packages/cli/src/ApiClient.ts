import * as fs from "fs";
import * as path from "path";

/**
 * Tries to read the credentials file from the current directory or the backend package directory.
 * @returns The credentials if found, otherwise null.
 */
function tryReadCredentialsFile(): { apiKey: string; url: string } | null {
    let currentDir = process.cwd();

    for (let i = 0; i < 4; i++) {
        const pathsToTry = [
            path.join(currentDir, "initial-credentials.data"),
            path.join(currentDir, "packages", "backend", "initial-credentials.data"),
            path.join(currentDir, "backend", "initial-credentials.data")
        ];

        for (const filePath of pathsToTry) {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, "utf-8");
                const keyMatch = content.match(/Admin API Key:\s+(sk-mux-[a-f0-9]+)/);
                const urlMatch = content.match(/Router URL:\s+(http\S+)/);

                if (keyMatch) {
                    return {
                        apiKey: keyMatch[1],
                        url: urlMatch ? urlMatch[1] : "http://localhost:3000"
                    };
                }
            }
        }

        const parentDir = path.dirname(currentDir);

        if (parentDir === currentDir) {
            break;
        }
        currentDir = parentDir;
    }
    return null;
}

export class ApiClient {
    private baseUrl: string = "http://localhost:3000";
    private adminKey: string = "";

    constructor() {
        // Load from env or attempt to read credentials file
        const creds = tryReadCredentialsFile();
        if (creds) {
            this.baseUrl = process.env.MULTIPLEXUS_URL || creds.url;
            this.adminKey = process.env.MULTIPLEXUS_ADMIN_KEY || creds.apiKey;
        } else {
            this.baseUrl = process.env.MULTIPLEXUS_URL || "http://localhost:3000";
            this.adminKey = process.env.MULTIPLEXUS_ADMIN_KEY || "";
        }
    }

    setCredentials(url: string, key: string) {
        this.baseUrl = url;
        this.adminKey = key;
    }

    hasCredentials(): boolean {
        return !!this.adminKey;
    }

    getBaseUrl(): string {
        return this.baseUrl;
    }

    private async request(endpoint: string, method: string = "GET", body?: any): Promise<any> {
        const headers: Record<string, string> = {
            "Content-Type": "application/json"
        };
        if (this.adminKey) {
            headers["Authorization"] = `Bearer ${this.adminKey}`;
        }

        const url = `${this.baseUrl}${endpoint}`;
        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `HTTP Error ${response.status}`;

            try {
                const errJson = JSON.parse(errorText);
                if (errJson.error) {
                    errorMessage = errJson.error;
                }
            } catch (e) {
                if (errorText) {
                    errorMessage = errorText;
                }
            }

            throw new Error(errorMessage);
        }

        return response.json();
    }

    /**
     * Gets the providers.
     * @returns The providers.
     */
    async getProviders(): Promise<any[]> {
        return this.request("/api/providers");
    }

    /**
     * Creates a provider.
     * @param name The name of the provider.
     * @param apiType The API type of the provider.
     * @param baseUrl The base URL of the provider.
     * @returns The provider.
     */
    async createProvider(name: string, apiType: string, baseUrl?: string): Promise<any> {
        return this.request("/api/providers", "POST", { name, apiType, baseUrl });
    }

    /**
     * Gets the provider keys.
     * @returns The provider keys.
     */
    async getProviderKeys(): Promise<any[]> {
        return this.request("/api/providers/keys");
    }

    /**
     * Adds a provider key.
     * @param providerId The ID of the provider.
     * @param keyValue The value of the provider key.
     * @param weight The weight of the provider key.
     * @param description The description of the provider key.
     * @returns The provider key.
     */
    async addProviderKey(
        providerId: number,
        keyValue: string,
        weight?: number,
        description?: string
    ): Promise<any> {
        return this.request("/api/providers/keys", "POST", { providerId, keyValue, weight, description });
    }

    /**
     * Gets the model routes.
     * @returns The model routes.
     */
    async getModelRoutes(): Promise<any[]> {
        return this.request("/api/model/routes");
    }

    /**
     * Creates a model route.
     * @param routerModel The model to route.
     * @param providerId The ID of the provider.
     * @param providerModel The model to use for the request.
     * @param priority The priority of the model route.
     * @param weight The weight of the model route.
     * @returns The model route.
     */
    async createModelRoute(
        routerModel: string,
        providerId: number,
        providerModel: string,
        priority?: number,
        weight?: number
    ): Promise<any> {
        return this.request("/api/model/routes", "POST", {
            routerModel,
            providerId,
            providerModel,
            priority,
            weight
        });
    }

    /**
     * Gets the users.
     * @returns The users.
     */
    async getUsers(): Promise<any[]> {
        return this.request("/api/users");
    }

    /**
     * Creates a user.
     * @param name The name of the user.
     * @param role The role of the user.
     * @returns The user.
     */
    async createUser(name: string, role: string = "user"): Promise<any> {
        return this.request("/api/users", "POST", { name, role });
    }

    /**
     * Deletes a user.
     * @param id The ID of the user.
     * @returns The user.
     */
    async deleteUser(id: number): Promise<any> {
        return this.request(`/api/users/${id}`, "DELETE");
    }

    async getUserPlugins(userId: number): Promise<any[]> {
        return this.request(`/api/users/${userId}/plugins`);
    }

    async toggleUserPlugin(userId: number, pluginName: string, isEnabled: boolean): Promise<any> {
        return this.request(`/api/users/${userId}/plugins`, "POST", { pluginName, isEnabled });
    }
}
