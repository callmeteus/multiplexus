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
    const languageRule = isPt
        ? [
            "## Idioma",
            "- Respostas em texto (chat): use o idioma da última mensagem do usuário.",
            "- Código: siga SEMPRE os padrões e o idioma já usados no arquivo/projeto.",
            "- Não traduza identificadores, comentários, strings i18n ou mensagens de log só porque o usuário escreveu em português."
        ]
        : [
            "## Language",
            "- Text replies (chat): use the language of the user's last message.",
            "- Code: ALWAYS follow the patterns and language already used in the file/project.",
            "- Do not translate identifiers, comments, i18n strings, or log messages just because the user wrote in another language."
        ];

    const fileRules = isPt
        ? [
            "## Edição de arquivos (estratégia preferida)",
            "- Arquivo JÁ EXISTE → read_file, depois find_and_replace com old_string copiado exatamente do arquivo.",
            "- NUNCA use write_file em arquivo existente.",
            "- write_file só para arquivos NOVOS.",
            "- find_and_replace: old_string deve ser único no arquivo; inclua linhas de contexto se preciso.",
            "- Diffs mínimos: uma mudança por find_and_replace quando possível.",
            "- Sem placeholders (\"...\", \"conteúdo atualizado\", etc.)."
        ]
        : [
            "## File editing (preferred strategy)",
            "- File ALREADY EXISTS → read_file, then find_and_replace with old_string copied exactly from the file.",
            "- NEVER use write_file on an existing file.",
            "- write_file only for NEW files.",
            "- find_and_replace: old_string must be unique; include surrounding lines for context if needed.",
            "- Minimal diffs: one change per find_and_replace when possible.",
            "- No placeholders (\"...\", \"updated content\", etc.)."
        ];

    const usage = isPt
        ? [
            "Para usar ferramentas, responda SOMENTE com blocos <tool_call> JSON — sem texto misturado:",
            ...examples,
            "O usuário não vê os blocos <tool_call>; ele vê apenas o status da ferramenta.",
            "Após <tool_result>, continue até concluir.",
            "Quando terminar, responda em texto normal sem <tool_call>."
        ]
        : [
            "To use tools, respond ONLY with <tool_call> JSON blocks — no mixed prose:",
            ...examples,
            "The user does not see <tool_call> blocks; they only see tool status.",
            "After <tool_result>, continue until done.",
            "When finished, reply in plain text without <tool_call>."
        ];

    return [
        ...intro,
        "",
        ...languageRule,
        "",
        ...buildPlanningGuidance(lang),
        "",
        ...fileRules,
        "",
        toolsHeader,
        ...toolLines,
        "",
        ...usage
    ].join("\n");
}
