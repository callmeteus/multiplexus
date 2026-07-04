import caveman from "./caveman/index";
export { PluginMetadata, definePlugin } from "./PluginTypes";

export const PLUGINS: Record<string, typeof caveman> = {
    caveman
};

export const SUPPORTED_PLUGINS = Object.keys(PLUGINS);