import * as caveman from "./caveman/index";

export const PLUGINS: Record<string, { apply: (body: any) => void }> = {
    caveman
};

export const SUPPORTED_PLUGINS = Object.keys(PLUGINS);