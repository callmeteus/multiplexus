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
            "## Execução",
            "- Pedido de ação/correção: use ferramentas IMEDIATAMENTE — não pare só dizendo o que vai fazer.",
            "- Primeira resposta a uma tarefa: <tool_call>(s) para explorar (list_dir, read_file), não texto de intenção.",
            "- Não peça mais detalhes se você pode explorar o código com ferramentas.",
            "- Nunca diga que não pode ajudar — você PODE ler e editar arquivos do projeto.",
            "- Explore antes de editar; depois find_and_replace com diff mínimo.",
            "- Após read_file/list_dir, SEMPRE aplique find_and_replace antes de responder em texto.",
            "- NUNCA escreva tutorial, passo-a-passo ou blocos de código no chat — use find_and_replace.",
            "- NUNCA invente arquivos novos nem sugira npm install para corrigir bugs.",
            "- Siga convenções do código existente; não refatore o que não foi pedido.",
            "- Continue chamando ferramentas até concluir; só então resuma em texto."
        ];
    }

    return [
        "## Execution",
        "- Action/fix request: use tools IMMEDIATELY — never stop at intent-only replies.",
        "- First response to a task: <tool_call>(s) to explore (list_dir, read_file), not prose about what you will do.",
        "- Do not ask for more details if you can explore the code with tools.",
        "- Never say you cannot help — you CAN read and edit project files.",
        "- Explore before editing; then find_and_replace with minimal diffs.",
        "- After read_file/list_dir, ALWAYS apply find_and_replace before replying in text.",
        "- NEVER write tutorials, step-by-step guides, or code blocks in chat — use find_and_replace.",
        "- NEVER invent new files or suggest npm install to fix bugs.",
        "- Match existing code conventions; don't refactor unrelated code.",
        "- Keep calling tools until done; only then summarize in plain text."
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

    const formatRules = isPt
        ? [
            "## Formato de ferramentas (obrigatório)",
            "CORRETO:",
            '<tool_call>{"name":"read_file","arguments":{"path":"packages/cli/src/index.ts"}}</tool_call>',
            "ERRADO: ```python, ```json, JSON solto, <|tool_call_start|>, [find_and_replace(...)], ou texto misturado.",
            "Tarefa nova: primeira resposta = só <tool_call>(s) de exploração (list_dir, read_file).",
            "O usuário não vê <tool_call>; vê apenas ✓/✗ da ferramenta.",
            "Após <tool_result>, continue com mais ferramentas até terminar.",
            "Só no final: texto normal sem <tool_call>."
        ]
        : [
            "## Tool format (required)",
            "CORRECT:",
            '<tool_call>{"name":"read_file","arguments":{"path":"packages/cli/src/index.ts"}}</tool_call>',
            "WRONG: ```python, ```json, bare JSON, <|tool_call_start|>, [find_and_replace(...)], or mixed prose.",
            "New task: first reply = only exploration <tool_call>(s) (list_dir, read_file).",
            "The user does not see <tool_call>; only tool ✓/✗ status.",
            "After <tool_result>, keep using tools until done.",
            "Only at the end: plain text without <tool_call>."
        ];

    const usage = isPt
        ? [
            "Exemplos por ferramenta:",
            ...examples
        ]
        : [
            "Examples per tool:",
            ...examples
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
        ...formatRules,
        "",
        ...usage
    ].join("\n");
}
