import { Dictionary } from "./en";

export const pt: Dictionary = {
    common: {
        error: "Ocorreu um erro:",
        invalidChoice: "Escolha inválida.",
        bye: "Até logo!"
    },

    menu: {
        welcome: "Bem-vindo ao multiplexus LLM Router!",
        selectAction: "O que você deseja fazer?",
        serverCategory: "Gerenciamento do Servidor Router",
        providerCategory: "Configurações de Providers",
        routeCategory: "Configurações de Rotas de Modelos",
        clientCategory: "Configurações de Usuários Clientes",
        systemCategory: "Configurações do Sistema",
        startServer: "Iniciar Servidor Router Local",
        stopServer: "Parar Servidor Router Local",
        addProvider: "Adicionar Provider e Credenciais",
        listProviders: "Listar Providers Ativos",
        addRoute: "Adicionar Destino de Roteamento",
        editRoute: "Editar Rota de Modelo",
        deleteRoute: "Excluir Rota de Modelo",
        listRoutes: "Listar Rotas Configuradas",
        addUser: "Criar Chave API de Cliente",
        listUsers: "Listar Chaves API de Clientes",
        managePlugins: "Gerenciar Plugins do Servidor",
        helpGuide: "Visualizar Guia de Setup de Providers",
        exit: "Sair",
        back: "Voltar para o Menu Principal"
    },

    provider: {
        namePrompt: "Digite o nome customizado do provider:",
        typePrompt: "Selecione o tipo de API:",
        baseUrlPrompt: "Digite a URL Base da API (deixe em branco para o padrão):",
        selectPrompt: "Selecione um provider:",
        freeTierBadge: "grátis",
        freeTierLegend: "tier gratuito disponível",
        success: "Provider registrado com sucesso!",
        nameRequired: "Nome do provider é obrigatório",
        baseUrlRequired: "URL Base é obrigatória para providers customizados",
        registering: "Registrando provider...",
        registeringDefault: "Registrando provider padrão...",
        errorRegistering: "Erro ao registrar provider",
        cloudflareAccountIdPrompt: "Digite seu Cloudflare Account ID:",
        cloudflareAccountIdRequired: "Account ID é obrigatório",
        keyAuthMethodPrompt: "Como você gostaria de adicionar a chave de API/Token?",
        keyAuthMethodManual: "Digitar chave manualmente",
        keyAuthMethodOAuth: "Entrar via navegador web (OAuth/Conexão)",
        oauthStarting: "Iniciando fluxo OAuth no navegador...",
        oauthFailed: "Conexão OAuth falhou",
        customGuideText: "Siga as instruções de configuração para seu provider customizado '{name}' para gerar uma chave API válida.",
        customGuideTitle: "Guia Customizado",
        keyReadyConfirm: "Você tem a chave API em mãos?",
        keySetupAborted: "Configuração de chave abortada"
    },

    key: {
        directOrGuidedPrompt: "Como você gostaria de adicionar a chave de API?",
        directInput: "Digitar chave diretamente",
        stepByStep: "Seguir o guia de instalação passo-a-passo",
        enterPrompt: "Cole sua chave API:",
        weightPrompt: "Digite o peso da chave (para balanceamento, padrão: 1):",
        descPrompt: "Digite uma descrição para a chave (opcional):",
        success: "Chave API adicionada ao provider com sucesso!",
        keyRequired: "Chave API não pode ser vazia",
        weightMustBeNumber: "O peso deve ser um número",
        adding: "Adicionando chave API ao banco de dados...",
        errorAdding: "Erro ao adicionar chave"
    },

    route: {
        routerModelPrompt: "Digite o nome do modelo exposto:",
        providerModelPrompt: "Digite o nome real do modelo no provider:",
        priorityPrompt: "Digite a prioridade (menor é tentado primeiro, ex: 1 para primário, 2 para failover):",
        weightPrompt: "Digite o peso da rota (para balanceamento, padrão: 1):",
        success: "Rota de modelo configurada com sucesso!",
        addAnotherPrompt: "Deseja adicionar outro modelo de destino a esta rota?",
        noConfiguredProviders: "Por favor, configure pelo menos um provider com uma chave API antes de configurar rotas.",
        configuring: "Configurando rota de modelo...",
        errorConfiguring: "Erro ao configurar rota",
        routerModelRequired: "O nome do modelo exposto é obrigatório",
        providerModelRequired: "O nome real do modelo no provider é obrigatório",
        priorityMustBeNumber: "A prioridade deve ser um número",
        weightMustBeNumber: "O peso deve ser um número",
        editSelect: "Selecione a rota de modelo para editar:",
        editPrompt: "O que você deseja atualizar?",
        editAddTarget: "Adicionar modelo de destino à rota",
        editProviderModel: "Nome Real do Modelo no Provider",
        editPriority: "Prioridade de Roteamento",
        editWeight: "Peso de Roteamento",
        editStatus: "Status de Ativação",
        editSuccess: "Rota de modelo atualizada com sucesso!",
        deleteSelect: "Selecione a rota de modelo para excluir:",
        deleteConfirm: "Você tem certeza de que deseja excluir esta rota?",
        deleteSuccess: "Rota de modelo excluída com sucesso!",
        listEmpty: "Nenhuma rota de modelo configurada ainda.",
        listTitle: "Rotas de Modelos Configuradas:",
        statusActive: "Ativa",
        statusInactive: "Inativa",
        modelFilterPrompt: "Filtrar modelos por nome ou ID"
    },

    user: {
        namePrompt: "Digite um nome para o cliente/dono da chave:",
        rolePrompt: "Selecione o papel do usuário:",
        roleAdmin: "Admin (pode configurar o roteador)",
        roleUser: "Usuário (só pode fazer chat completions)",
        success: "Chave do cliente gerada com sucesso! Copie-a agora:",
        listTitle: "Chaves de API de Clientes Ativas:",
        listEmpty: "Nenhuma chave de API de cliente configurada.",
        nameRequired: "Nome do cliente é obrigatório",
        generating: "Gerando chave de API do cliente...",
        errorGenerating: "Erro ao gerar chave de cliente",
        loading: "Carregando chaves de API dos clientes...",
        loadedSuccess: "Usuários ativos carregados com sucesso!",
        errorLoading: "Erro ao carregar chaves de clientes"
    },

    help: {
        title: "multiplexus Help — Guia de Setup de Providers",
        workflowTitle: "Fluxo de Uso",
        workflow: [
            "1. Registre um provider e adicione sua chave de API.",
            "2. Defina rotas de modelo.",
            "3. Crie chaves de API de cliente para apps que usarão o roteador."
        ],
        providers: [
            {
                name: "Google Gemini",
                tier: "TIER GRATUITO",
                description: "Oferece modelos rápidos e capazes (Gemini Flash) completamente grátis para desenvolvimento.",
                keyUrl: "https://aistudio.google.com/"
            },
            {
                name: "OpenRouter",
                tier: "INCLUI MODELOS GRATUITOS",
                description: "Agrega vários providers. Oferece acesso gratuito a modelos open-weights (Llama, Gemma, etc).",
                keyUrl: "https://openrouter.ai/keys"
            },
            {
                name: "z.ai",
                tier: "INCLUI MODELOS GRATUITOS",
                description: "Hospeda diversos modelos incluindo opções gratuitas.",
                keyUrl: "https://z.ai"
            },
            {
                name: "OpenAI",
                tier: "PAGO",
                description: "Modelos padrão da indústria. Requer configuração de faturamento.",
                keyUrl: "https://platform.openai.com/api-keys"
            },
            {
                name: "Anthropic",
                tier: "PAGO",
                description: "Modelos Claude. Requer configuração de faturamento.",
                keyUrl: "https://console.anthropic.com/settings/keys"
            }
        ]
    },

    start: {
        searchingBackend: "Procurando o servidor backend multiplexus...",
        backendNotFound: "Não foi possível encontrar o diretório backend do multiplexus. Certifique-se de que você está executando este comando de dentro do projeto multiplexus.",
        starting: "Iniciando o servidor multiplexus...",
        waitingReady: "Aguardando o servidor ficar pronto...",
        ready: "Servidor está online e rodando!",
        alreadyRunning: "O servidor já está rodando na porta 3000.",
        failed: "O backend não respondeu na porta 3000.",
        checkLogs: "Veja o log de spawn: {spawnLog}\nOu o log de runtime: {combinedLog}",
        credentialsStale: "Servidor está rodando, mas as credenciais de admin estão ausentes ou desatualizadas. Rode 'mpx stop' e depois 'mpx start', ou veja packages/backend/initial-credentials.data.",
        credentialsLoaded: "Credenciais de administrador carregadas e salvas na configuração da CLI.",
        credentialsMissing: "Servidor iniciado, mas o arquivo de credenciais iniciais ainda não foi gerado. Aguarde um momento e execute 'mpx start' novamente.",
        instructionsTitle: "Como usar com ferramentas de IA",
        baseUrl: "Base URL (compatível com OpenAI):",
        apiKey: "Sua chave de API de cliente (gere uma com 'mpx user create'):",
        tools: [
            {
                name: "Claude Code",
                instruction: "Defina a variável de ambiente ANTHROPIC_BASE_URL ou use o argumento '--openai-base-url'. Ou configure globalmente via: claude config set -g api.openaiBaseUrl <URL>"
            },
            {
                name: "Cursor",
                instruction: "Configurações > Models > Adicione o modelo > Defina a URL Base e a Chave de API."
            },
            {
                name: "Continue.dev",
                instruction: "No arquivo ~/.continue/config.json, defina 'apiBase' como a URL Base e 'apiKey' como sua chave de API de cliente."
            },
            {
                name: "Open WebUI",
                instruction: "Painel de Admin > Configurações > Conexões > Adicione uma conexão compatível com OpenAI."
            },
            {
                name: "Qualquer SDK da OpenAI",
                instruction: "new OpenAI({ baseURL: '<URL Base>', apiKey: '<chave de cliente>' })"
            }
        ]
    },

    stop: {
        searchingBackend: "Procurando processo do backend multiplexus...",
        stopping: "Parando servidor multiplexus...",
        stopped: "Servidor parado.",
        notRunning: "Nenhum servidor multiplexus está rodando.",
        stalePid: "Arquivo PID obsoleto removido. O servidor não está rodando.",
        runningWithoutPid: "O servidor está na porta 3000, mas não foi iniciado com 'mpx start'. Pare manualmente (ex: yarn dev).",
        failed: "Não foi possível parar o processo do servidor.",
        stillResponding: "O processo foi encerrado, mas a porta 3000 ainda responde."
    },

    setup: {
        title: "multiplexus Configuração Necessária",
        keyWarn: "Não conseguimos detectar sua chave de admin inicial automaticamente. Por favor, configure sua conexão.",
        urlPrompt: "Digite a URL do Roteador multiplexus:",
        urlRequired: "URL é obrigatória",
        keyPrompt: "Digite a Chave de API de Admin:",
        keyRequired: "A Chave de API de Admin é obrigatória",
        adminKeyPrompt: "Digite a Chave de API de Admin (de initial-credentials.data ou 'mpx start'):",
        adminKeyWarn: "Permissões de admin são necessárias. Use a chave de Admin, não uma chave de cliente.",
        adminKeyInvalid: "A chave salva não tem permissões de admin. Tentando recarregar as credenciais do projeto...",
        adminKeyRefreshed: "Credenciais de admin recarregadas do projeto.",
        adminKeyRequired: "Chave de Admin obrigatória. Rode 'mpx start' ou veja packages/backend/initial-credentials.data.",
        success: "Credenciais salvas localmente!"
    },

    yargs: {
        startDesc: "Inicia o servidor roteador multiplexus local em segundo plano",
        stopDesc: "Para o servidor roteador multiplexus na porta 3000",
        providerDesc: "Gerenciar providers",
        providerActionDesc: "Ação: add | list",
        routeDesc: "Gerenciar rotas de modelos",
        routeActionDesc: "Ação: add",
        userDesc: "Gerenciar usuários/clientes",
        userActionDesc: "Ação: create | list",
        helpDesc: "Exibe o guia de ajuda de setup de providers",
        pluginDesc: "Gerenciar plugins de clientes",
        pluginActionDesc: "Ação: toggle"
    },
    plugin: {
        selectUserPrompt: "Selecione a chave de cliente para gerenciar os plugins:",
        title: "Gerenciar Plugins",
        statusPrompt: "Selecione o plugin para alternar (ativar/desativar):",
        success: "Plugin atualizado com sucesso!",
        emptyUsers: "Nenhum usuário/cliente cadastrado ainda. Gere uma chave de cliente primeiro."
    }
};