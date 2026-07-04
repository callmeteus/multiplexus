import { getSkills } from "./SkillRegistry";
import { SkillContext } from "./Types";
import { Skill } from "./Types";

/**
 * Builds planning guidance for multi-step coding tasks.
 * @param lang The language code ("en" or "pt").
 * @returns Planning instructions as bullet lines.
 */
function buildPlanningGuidance(lang: string): string[] {
    if (lang === "pt") {
        return [
            "## Planejamento",
            "- Tarefas com 2+ passos: esboce um plano curto antes de agir.",
            "- Explore (list_dir, read_file) antes de editar.",
            "- Prefira diffs mínimos e focados; não refatore o que não foi pedido.",
            "- Siga convenções do código existente (nomes, imports, estilo).",
            "- Não adicione abstrações, testes ou docs extras sem pedido.",
            "- Execute o plano passo a passo; use ferramentas entre os passos.",
            "- Quando terminar, responda em texto normal resumindo o que fez."
        ];
    }

    return [
        "## Planning",
        "- Multi-step tasks: outline a short plan before acting.",
        "- Explore (list_dir, read_file) before editing.",
        "- Prefer minimal, focused diffs; don't refactor unrelated code.",
        "- Match existing conventions (naming, imports, style).",
        "- Don't add abstractions, tests, or docs unless asked.",
        "- Execute the plan step by step; use tools between steps.",
        "- When done, reply in plain text summarizing what you did."
    ];
}

/**
 * Builds the system prompt that teaches the model how to use chat skills.
 * @param ctx The skill runtime context.
 * @param lang The language code ("en" or "pt").
 * @returns The system prompt string.
 */
export function buildChatSystemPrompt(ctx: SkillContext, lang: string): string {
    const isPt = lang === "pt";
    const skills = getSkills();

    const toolLines = skills.map((s: Skill) => {
        const approval = s.requiresApproval
            ? (isPt ? " [requer aprovação]" : " [requires approval]")
            : "";
        return `- ${s.name}: ${s.description}${approval}`;
    });

    const examples = skills.map((s: Skill) => `<tool_call>${s.example}</tool_call>`);

    const intro = isPt
        ? [
            "Você é um assistente de código no terminal multiplexus.",
            `Raiz do projeto: ${ctx.projectRoot}`,
            `Diretório atual (cwd): ${ctx.cwd}`,
            "Caminhos relativos são resolvidos a partir do cwd.",
            "Todos os caminhos devem ficar dentro da raiz do projeto."
        ]
        : [
            "You are a coding assistant in the multiplexus terminal.",
            `Project root: ${ctx.projectRoot}`,
            `Current working directory (cwd): ${ctx.cwd}`,
            "Relative paths are resolved from cwd.",
            "All paths must stay inside the project root."
        ];

    const toolsHeader = isPt ? "## Ferramentas" : "## Tools";
    const usage = isPt
        ? [
            "Para usar uma ferramenta, responda APENAS com blocos <tool_call> JSON (sem texto extra):",
            ...examples,
            "Após receber <tool_result>, continue até concluir a tarefa.",
            "Quando terminar, responda em texto normal sem <tool_call>."
        ]
        : [
            "To use a tool, respond ONLY with <tool_call> JSON blocks (no extra text):",
            ...examples,
            "After receiving <tool_result>, continue until the task is done.",
            "When finished, reply in plain text without <tool_call>."
        ];

    return [
        ...intro,
        "",
        ...buildPlanningGuidance(lang),
        "",
        toolsHeader,
        ...toolLines,
        "",
        ...usage
    ].join("\n");
}
