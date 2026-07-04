export interface PluginMetadata {
    id: string;
    capabilities: string[];
    i18n: {
        en: {
            name: string;
            description: string;
        };
        pt: {
            name: string;
            description: string;
        };
    };
    apply: (body: any) => void;
}

export function definePlugin(metadata: PluginMetadata): PluginMetadata {
    return metadata;
}