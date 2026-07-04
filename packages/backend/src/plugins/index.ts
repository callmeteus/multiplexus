import caveman from "./caveman/index";
export type { PluginMetadata } from "./PluginTypes";
export { definePlugin } from "./PluginTypes";

export const PLUGINS: Record<string, typeof caveman> = {
    caveman
};

export const SUPPORTED_PLUGINS = Object.keys(PLUGINS);