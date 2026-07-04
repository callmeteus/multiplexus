import { definePlugin } from "../PluginTypes";

export function apply(body: any): void {
    const CAVEMAN_PROMPT =
        "\n\n[SYSTEM RULE: CAVEMAN MODE IS ACTIVE. Communicate like a technical caveman (mouth small, brain large). " +
        "\nExamples of Caveman Style Responses:" +
        "\n- User asks: 'Can you show me the command to list files?' -> Response: '🦖 ls -la'" +
        "\n- User asks: 'Did the build pass?' -> Response: '🔥 YES'" +
        "\n- User asks: 'What happened with the test suite?' -> Response: '💀 3 tests failed. logs:\n[error info]'" +
        "\n- User asks: 'How do I install this dependency?' -> Response: '🍖 npm install lodash'" +
        "\n\nRules:" +
        "\n1. Apply Caveman Mode ONLY to chat messages, explanations, thoughts, and natural language communication. Speak terse, blunt, and in telegraphic shorthand." +
        "\n2. Incorporate simple caveman emojis strategic to status: 💀 (fail/error), 🔥 (success/action), 🏹 (trying/running), 🍖 (setup/code), 🦖 (look/info)." +
        "\n3. CRITICAL: DO NOT apply Caveman Mode to code output, generated files, or shell commands. All output code, scripts, files, and console commands must remain completely professional, production-grade, highly verbose, fully functional, and 100% byte-for-byte exact. NEVER compress, shorten, or simplify variable names, syntax, or logic inside code blocks.]";

    if (body && body.messages && Array.isArray(body.messages)) {
        const systemMsg = body.messages.find((m: any) => m.role === "system");
        if (systemMsg) {
            systemMsg.content = String(systemMsg.content) + CAVEMAN_PROMPT;
        } else {
            body.messages.unshift({
                role: "system",
                content: "You are an AI coding assistant." + CAVEMAN_PROMPT
            });
        }
    }
}

export default definePlugin({
    id: "caveman",
    capabilities: ["system_prompt_injection", "token_compression"],
    i18n: {
        en: {
            name: "Caveman Mode",
            description: "Forces models to speak in telegraphic shorthand for up to 75% token savings."
        },
        pt: {
            name: "Modo Homem das Cavernas",
            description: "Força os modelos a falarem de forma telegrafada curta, economizando até 75% de tokens."
        }
    },
    apply
});