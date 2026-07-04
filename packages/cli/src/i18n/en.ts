export const en = {
    common: {
        error: "An error occurred:",
        invalidChoice: "Invalid choice.",
        bye: "Goodbye!"
    },

    menu: {
        welcome: "Welcome to multiplexus LLM Router!",
        selectAction: "What would you like to do?",
        serverCategory: "Server Router Management",
        providerCategory: "Provider Settings",
        routeCategory: "Model Route Settings",
        clientCategory: "Client Users Settings",
        systemCategory: "System Settings",
        startServer: "Start Local Router Server",
        stopServer: "Stop Local Router Server",
        addProvider: "Add Provider Preset & Credentials",
        listProviders: "List Active Providers",
        addRoute: "Add Routing Target",
        editRoute: "Edit Model Route",
        deleteRoute: "Delete Model Route",
        listRoutes: "List Configured Routes",
        addUser: "Create Client API Key",
        listUsers: "List Client API Keys",
        managePlugins: "Manage Server Plugins",
        helpGuide: "View Provider Setup Guide",
        exit: "Exit",
        back: "Back to Main Menu",
        chatCategory: "Interactive Chat Client"
    },

    chat: {
        selectRouter: "Select the router (exposed model) to chat with:",
        noRoutes: "No model routes configured yet. Please configure a route first.",
        welcome: "Chatting with {model}\nType '/exit' or press Ctrl+C to quit.",
        prompt: "You > ",
        error: "Error: {message}",
        thinking: "Thinking...",
        responding: "{model} via {provider} is typing...",
        runningTools: "Running tools...",
        approveCommand: "Run this command?\n{command}\n(cwd: {cwd})",
        approveSkill: "Allow skill '{skill}' to run?"
    },

    provider: {
        namePrompt: "Enter provider custom name:",
        typePrompt: "Select API Type preset:",
        baseUrlPrompt: "Enter API Base URL (leave empty for default):",
        selectPrompt: "Select a provider:",
        freeTierBadge: "free",
        freeTierLegend: "free tier available",
        success: "Provider successfully registered!",
        nameRequired: "Provider name is required",
        baseUrlRequired: "Base URL is required for custom providers",
        registering: "Registering provider...",
        registeringDefault: "Registering default provider...",
        errorRegistering: "Error registering provider",
        cloudflareAccountIdPrompt: "Enter your Cloudflare Account ID:",
        cloudflareAccountIdRequired: "Account ID is required",
        keyAuthMethodPrompt: "How would you like to add the API Key/Token?",
        keyAuthMethodManual: "Enter key manually",
        keyAuthMethodOAuth: "Log in via Web Browser (OAuth/Connection)",
        oauthStarting: "Starting browser OAuth flow...",
        oauthFailed: "OAuth connection failed",
        customGuideText: "Follow setup instructions for your custom provider '{name}' to generate a valid API key.",
        customGuideTitle: "Custom Guide",
        keyReadyConfirm: "Do you have the API Key ready?",
        keySetupAborted: "Aborted key setup",
        presetsOffline: "Backend presets unreachable. Loaded presets from local offline cache.",
        freeTierOfferingsTitle: "{name} Free Tier Offerings",
        guideTitle: "{name} Guide",
        listTitle: "Supported multiplexus Providers",
        loadingKeys: "Loading active keys from database...",
        loadedSuccess: "Loaded successfully!",
        offlineStatus: "Unreachable database - displaying offline status.",
        statusConfigured: "CONFIGURED/ACTIVE",
        statusNotConfigured: "Not configured"
    },

    key: {
        directOrGuidedPrompt: "How would you like to add the API key?",
        directInput: "Enter key directly",
        stepByStep: "Follow step-by-step setup guide",
        enterPrompt: "Paste your API Key:",
        weightPrompt: "Enter key weight (for load balancing, default: 1):",
        descPrompt: "Enter key description (optional):",
        success: "API key successfully added to provider!",
        keyRequired: "API Key cannot be empty",
        weightMustBeNumber: "Weight must be a number",
        adding: "Adding API Key to database...",
        errorAdding: "Error adding key"
    },

    route: {
        routerModelPrompt: "Enter the exposed model name (e.g. gpt-4o, smart-model):",
        providerModelPrompt: "Enter the provider's actual model name (e.g. gpt-4o-mini, claude-3-5-sonnet-latest):",
        priorityPrompt: "Enter priority (lower is tried first):",
        weightPrompt: "Enter routing weight (for load balancing, default: 1):",
        success: "Model route configured successfully!",
        addAnotherPrompt: "Do you want to add another target model to this route?",
        noConfiguredProviders: "Please configure at least one provider with an API key first before configuring routes.",
        configuring: "Configuring model route...",
        errorConfiguring: "Error configuring route",
        routerModelRequired: "Router model name is required",
        providerModelRequired: "Provider model name is required",
        priorityMustBeNumber: "Priority must be a number",
        weightMustBeNumber: "Weight must be a number",
        editSelect: "Select the model route to edit:",
        editPrompt: "What would you like to update?",
        editAddTarget: "Add target model to route",
        editProviderModel: "Provider Model Name",
        editPriority: "Routing Priority",
        editWeight: "Routing Weight",
        editStatus: "Is Active Status",
        editSuccess: "Model route updated successfully!",
        deleteSelect: "Select the model route to delete:",
        deleteConfirm: "Are you sure you want to delete this route?",
        deleteSuccess: "Model route successfully deleted!",
        listEmpty: "No model routes configured yet.",
        listTitle: "Configured Model Routes:",
        statusActive: "Active",
        statusInactive: "Inactive",
        modelFilterPrompt: "Filter models by name or ID",
        loading: "Loading routes...",
        loadedSuccess: "Loaded routes successfully!",
        errorLoading: "Error loading routes",
        editSelectDetail: "[Priority: {priority}, Weight: {weight}]",
        listItemFormat: "- Exposed Model: {routerModel}\n  Target:        {providerName} ({providerModel})\n  Priority:      {priority} | Weight: {weight} | Status: {status}",
        priceFree: "FREE",
        priceFreeBadge: "[FREE]",
        noPricingInfo: "[no pricing info]",
        fetchingModels: "Fetching available models from {providerName}...",
        foundModels: "Found {count} models for {providerName}.",
        discoveryNotSupported: "Model discovery not supported, entering manually.",
        fetchModelsFailed: "Could not fetch models, entering manually.",
        filterShowAll: "Enter to show all",
        noModelsMatched: "No models matched \"{filter}\". Showing all.",
        enterManually: "Enter model ID manually..."
    },

    user: {
        namePrompt: "Enter a name for the client/key owner:",
        rolePrompt: "Select user role:",
        roleAdmin: "Admin (can configure router)",
        roleUser: "User (can only query chat completions)",
        success: "Client key generated successfully! Copy it now:",
        listTitle: "Active Client API Keys:",
        listEmpty: "No client API keys configured.",
        nameRequired: "Client name is required",
        generating: "Generating client API Key...",
        errorGenerating: "Error generating client key",
        loading: "Loading client API keys...",
        loadedSuccess: "Loaded active users successfully!",
        errorLoading: "Error loading client keys",
        apiKeyTitle: "Client API Key",
        listItemFormat: "- Name: {name}\n  Key:  {key}\n  Role: {role}"
    },

    help: {
        title: "multiplexus Help - Provider Setup Guide",
        workflowTitle: "Usage Workflow",

        workflow: [
            "1. Register a provider and add its API key.",
            "2. Define model routes.",
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
        ],
        getKeyLabel: "Get your key:"
    },

    start: {
        searchingBackend: "Searching for multiplexus backend...",
        backendNotFound: "Could not find the multiplexus backend. Make sure you are running this command from inside the multiplexus project.",
        starting: "Starting multiplexus server...",
        waitingReady: "Waiting for server to be ready...",
        ready: "Server is up and running!",
        alreadyRunning: "Router server is already running on port 3000.",
        failed: "Backend failed to respond on port 3000.",
        checkLogs: "Check spawn log: {spawnLog}\nOr runtime log: {combinedLog}",
        credentialsStale: "Server is running, but admin credentials are missing or outdated. Run 'mpx stop' then 'mpx start', or check packages/backend/initial-credentials.data.",
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
        ],
        noEntrypoint: "Could not find a runnable backend entrypoint.",
        tsxNotInstalled: "tsx is not installed. Run npm install in the multiplexus project root.",
        processStartFailed: "Could not start backend process.",
        connectionFailed: "Could not establish connection with router backend.",
        loadingCredentials: "Loading router administrative credentials..."
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
        adminKeyPrompt: "Enter Admin API Key (from initial-credentials.data or 'mpx start'):",
        adminKeyWarn: "Admin privileges are required. Use the Admin API Key, not a client key.",
        adminKeyInvalid: "The saved key does not have admin permissions. Trying to reload from project credentials...",
        adminKeyRefreshed: "Admin credentials refreshed from project.",
        adminKeyRequired: "Admin API Key is required. Run 'mpx start' or check packages/backend/initial-credentials.data.",
        success: "Credentials saved locally!"
    },

    yargs: {
        startDesc: "Start the local multiplexus router server in background",
        stopDesc: "Stop the local multiplexus router server on port 3000",
        providerDesc: "Manage providers",
        providerActionDesc: "Action: add | list",
        routeDesc: "Manage model routes",
        routeActionDesc: "Action: add",
        userDesc: "Manage client users",
        userActionDesc: "Action: create | list",
        helpDesc: "Show provider setup guide",
        pluginDesc: "Manage client plugins",
        pluginActionDesc: "Action: toggle",
        providerAddDesc: "Register a new provider and its keys",
        providerListDesc: "List all supported and active providers",
        providerDemand: "Specify an action: add or list",
        routeAddDesc: "Configure a new model routing rule",
        routeEditDesc: "Edit an existing model routing rule",
        routeDeleteDesc: "Delete an existing model routing rule",
        routeListDesc: "List all configured model routing rules",
        routeDemand: "Specify an action: add, edit, delete or list",
        userCreateDesc: "Generate a new client API key",
        userListDesc: "List all client users and their active keys",
        userDemand: "Specify an action: create or list",
        pluginToggleDesc: "Enable or disable user plugins (e.g. Caveman)",
        pluginDemand: "Specify an action: toggle",
        chatDesc: "Start an interactive terminal chat session with a router model"
    },
    plugin: {
        selectUserPrompt: "Select a client key to manage plugins for:",
        title: "Manage Plugins",
        statusPrompt: "Select a plugin to toggle:",
        success: "Plugin updated successfully!",
        emptyUsers: "No clients/users registered yet. Generate a client key first.",
        statusEnabled: "ENABLED",
        statusDisabled: "DISABLED",
        updating: "Updating plugin status...",
        errorUpdating: "Error updating plugin",
        backOption: "< Back"
    }
};

export type Dictionary = typeof en;
