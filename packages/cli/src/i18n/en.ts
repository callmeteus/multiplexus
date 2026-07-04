export const en = {
    common: {
        error: "An error occurred:",
        invalidChoice: "Invalid choice.",
        bye: "Goodbye!"
    },

    menu: {
        welcome: "Welcome to multiplexus LLM Router!",
        selectAction: "What would you like to do?",
        addProvider: "Add Provider",
        addProviderKey: "Add API Key to Provider",
        addRoute: "Configure Model Route",
        addUser: "Generate Client API Key",
        listUsers: "List Client API Keys",
        managePlugins: "Manage Client Plugins (e.g. Caveman)",
        helpGuide: "Help & Setup Guide",
        startServer: "Start Local Router Server",
        stopServer: "Stop Local Router Server",
        exit: "Exit"
    },

    provider: {
        namePrompt: "Enter provider name (e.g. openrouter, local-ollama):",
        typePrompt: "Select API Type preset:",
        baseUrlPrompt: "Enter API Base URL (leave empty for default):",
        selectPrompt: "Select a provider:",
        freeTierBadge: "★ free",
        freeTierLegend: "★ = free tier available",
        success: "Provider successfully registered!"
    },

    key: {
        directOrGuidedPrompt: "How would you like to add the API key?",
        directInput: "Enter key directly",
        stepByStep: "Follow step-by-step setup guide",
        enterPrompt: "Paste your API Key:",
        weightPrompt: "Enter key weight (for load balancing, default: 1):",
        descPrompt: "Enter key description (optional):",
        success: "API key successfully added to provider!"
    },

    route: {
        routerModelPrompt: "Enter the exposed model name (e.g. gpt-4o, smart-model):",
        providerModelPrompt: "Enter the provider's actual model name (e.g. gpt-4o-mini, claude-3-5-sonnet-latest):",
        priorityPrompt: "Enter priority (lower is tried first, e.g. 1 for primary, 2 for failover):",
        weightPrompt: "Enter routing weight (for load balancing, default: 1):",
        success: "Model route configured successfully!"
    },

    user: {
        namePrompt: "Enter a name for the client/key owner (e.g. frontend-app):",
        rolePrompt: "Select user role:",
        roleAdmin: "Admin (can configure router)",
        roleUser: "User (can only query chat completions)",
        success: "Client key generated successfully! Copy it now:",
        listTitle: "Active Client API Keys:",
        listEmpty: "No client API keys configured."
    },

    help: {
        title: "multiplexus Help — Provider Setup Guide",
        workflowTitle: "Usage Workflow",

        workflow: [
            "1. Register a provider and add its API key.",
            "2. Define model routes (e.g. map 'gpt-4o' → 'openai/gpt-4o-mini').",
            "3. Create client API keys for apps that will use the router."
        ],

        providers: [
            {
                name: "Google Gemini",
                tier: "FREE TIER",
                description: "Offers fast and capable models (Gemini Flash) completely free for development.",
                keyUrl: "https://aistudio.google.com/"
            },
            {
                name: "OpenRouter",
                tier: "INCLUDES FREE MODELS",
                description: "Aggregates many providers. Hosts free access to open-weights models (Llama, Gemma, etc).",
                keyUrl: "https://openrouter.ai/keys"
            },
            {
                name: "z.ai",
                tier: "INCLUDES FREE MODELS",
                description: "Hosts various models including free-tier options.",
                keyUrl: "https://z.ai"
            },
            {
                name: "OpenAI",
                tier: "PAID",
                description: "Industry-standard models. Requires billing configuration.",
                keyUrl: "https://platform.openai.com/api-keys"
            },
            {
                name: "Anthropic",
                tier: "PAID",
                description: "Claude models. Requires billing configuration.",
                keyUrl: "https://console.anthropic.com/settings/keys"
            }
        ]
    },

    start: {
        searchingBackend: "Searching for multiplexus backend...",
        backendNotFound: "Could not find the multiplexus backend. Make sure you are running this command from inside the multiplexus project.",
        starting: "Starting multiplexus server...",
        waitingReady: "Waiting for server to be ready...",
        ready: "Server is up and running!",
        alreadyRunning: "Router server is already running on port 3000.",
        failed: "Backend failed to respond on port 3000.",
        credentialsLoaded: "Admin credentials loaded and saved to CLI config.",
        credentialsMissing: "Server started but credentials file not found yet. Wait a moment and run 'mpx start' again.",
        instructionsTitle: "How to use with AI tools",
        baseUrl: "Base URL (OpenAI-compatible):",
        apiKey: "Your client API key (generate with 'mpx user create'):",

        tools: [
            {
                name: "Claude Code",
                instruction: "Set ANTHROPIC_BASE_URL or use '--openai-base-url' flag. Or configure via: claude config set -g api.openaiBaseUrl <URL>"
            },
            {
                name: "Cursor",
                instruction: "Settings > Models > Add model > set Base URL and API Key."
            },
            {
                name: "Continue.dev",
                instruction: "In ~/.continue/config.json, set 'apiBase' to the Base URL and 'apiKey' to your client key."
            },
            {
                name: "Open WebUI",
                instruction: "Admin Panel > Settings > Connections > Add OpenAI-compatible connection."
            },
            {
                name: "Any OpenAI SDK",
                instruction: "new OpenAI({ baseURL: '<Base URL>', apiKey: '<client key>' })"
            }
        ]
    },

    stop: {
        searchingBackend: "Looking for multiplexus backend process...",
        stopping: "Stopping multiplexus server...",
        stopped: "Server stopped.",
        notRunning: "No multiplexus server is running.",
        stalePid: "Stale PID file removed. Server is not running.",
        runningWithoutPid: "Server is running on port 3000, but was not started by 'mpx start'. Stop it manually (e.g. yarn dev).",
        failed: "Could not stop the server process.",
        stillResponding: "Process was killed but port 3000 is still responding."
    },

    setup: {
        title: "multiplexus Setup Required",
        keyWarn: "We couldn't detect your initial admin key automatically. Please configure your connection.",
        urlPrompt: "Enter multiplexus Router URL:",
        urlRequired: "URL is required",
        keyPrompt: "Enter Admin API Key:",
        keyRequired: "Admin API Key is required",
        success: "Credentials saved locally!"
    },

    yargs: {
        startDesc: "Start the local multiplexus router server in background",
        stopDesc: "Stop the local multiplexus router server on port 3000",
        providerDesc: "Manage providers",
        providerActionDesc: "Action: add",
        routeDesc: "Manage model routes",
        routeActionDesc: "Action: add",
        userDesc: "Manage client users",
        userActionDesc: "Action: create | list",
        helpDesc: "Show provider setup guide",
        pluginDesc: "Manage client plugins (e.g. caveman)",
        pluginActionDesc: "Action: toggle"
    },
    plugin: {
        selectUserPrompt: "Select a client key to manage plugins for:",
        title: "Manage Plugins",
        statusPrompt: "Select a plugin to toggle:",
        success: "Plugin updated successfully!",
        emptyUsers: "No clients/users registered yet. Generate a client key first."
    }
};

export type Dictionary = typeof en;
