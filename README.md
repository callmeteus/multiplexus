<div align="center">

# 🔀 multiplexus

**A lightweight, self-hosted, OpenAI-compatible LLM router with automatic multi-key rotation, failover fallback, and load balancing.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NPM Workspaces](https://img.shields.io/badge/NPM-Workspaces-blue.svg)](#)
[![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-green.svg)](#)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](#)

---

**multiplexus** acts as a middleman between your AI-powered tools (like Claude Code, Cursor, Continue.dev, or custom applications) and LLM providers. By exposing a single OpenAI-compatible endpoint, it distributes requests, rotates multiple API keys, and seamlessly falls back to alternative models or providers when rate limits or server errors occur.

[Quick Start](#-quick-start) • [Key Features](#-key-features) • [Plugin System](#-plugin-system) • [Tool Configuration](#%EF%B8%8F-connecting-your-tools) • [Architecture](#-architecture)

</div>

---

## ✨ Key Features

*   **🔌 OpenAI-Compatible API:** Zero configuration changes needed in your favorite development tools-just point the base URL to your multiplexus instance.
*   **⚖️ Weight-Based Load Balancing:** Register multiple keys for the same provider and assign them weights to distribute your traffic and optimize rate limits.
*   **🛡️ Robust Fallback & Failover:** Group routes by priority. If a primary provider fails, is rate-limited (429), or faces downtime, multiplexus tries alternative keys, fallback models, or secondary providers sequentially.
*   **🔌 Client-Key Plugin System:** Enable and toggle specialized modifiers and system prompts **per client key**.
*   **💻 Interactive CLI Wizard:** Entirely manageable via an interactive terminal interface supporting multiple languages.
*   **⚡ Running Local Server with One Command:** Launch the backend server in background directly via `mpx start`.

---

## 💀 Plugin System

multiplexus supports a modular **Plugin System** configurable **per client API Key** (e.g., enable a plugin for one client app, and keep full verbose responses for another).

To enable plugins for any client key:
1. Open the multiplexus CLI wizard: `npx mpx`
2. Select **Manage Client Plugins**.
3. Select your target client key, choose your plugin, and toggle it to `ENABLED`.
4. *All subsequent API requests using that client key will now automatically use the plugin!*

---

## 🚀 Quick Start

Ensure you have **Node.js (v20+)** and **npm** installed. Clone this repository locally.

### 1. Install dependencies
```bash
npm install
```

### 2. Launch multiplexus
Start the local router server in the background and configure the CLI client automatically:
```bash
npx mpx start
```
*This command launches the backend server, waits for the health check, reads generated admin credentials, and saves them locally.*

### 3. Add a Provider and API Key
Run the interactive wizard to set up your first provider:
```bash
npx mpx
```
Choose **Add Provider**, select a preset (e.g., Gemini, OpenAI, OpenRouter) or Custom, and follow the step-by-step key generator guide.

---

## 🛠️ Connecting Your Tools

Point your editor or tool to the multiplexus base URL and provide a client API key.

```
  [ Claude Code / Cursor ]
             │
             ▼ (OpenAI compatibility request)
    [ multiplexus Router ]
             │
             ▼ (Check priorities & rotate keys)
      { Select Route }
             ├───► Try Key 1 ──────► [ Provider A - OpenAI ]
             ├───► Fallback ───────► [ Provider A - Key 2 ]
             └───► Failover ───────► [ Provider B - Gemini ]
```

### 1. Claude Code
Run Claude Code pointing to your local multiplexus instance:
```bash
claude --openai-base-url http://localhost:3000/v1 --openai-api-key <your-client-api-key>
```
Or configure it globally:
```bash
claude config set -g api.openaiBaseUrl http://localhost:3000/v1
```

### 2. Cursor
Go to **Settings** > **Models**:
1. Enable OpenAI compatibility.
2. Set the Base URL to: `http://localhost:3000/v1`
3. Enter your multiplexus client API Key.

### 3. Continue.dev
In your `~/.continue/config.json`, configure your models:
```json
{
  "models": [
    {
      "title": "multiplexus-gpt-4o",
      "provider": "openai",
      "model": "gpt-4o",
      "apiBase": "http://localhost:3000/v1",
      "apiKey": "sk-mux-..."
    }
  ]
}
```

---

## 📂 Architecture

multiplexus is organized as a monorepo using npm workspaces:

*   `packages/shared`: Common types, schemas, and enums used by both CLI and Backend.
*   `packages/backend`: Fastify server utilizing Sequelize-TypeScript with SQLite. Manages completions routing, load balancing, and logging.
*   `packages/cli`: Interactive console prompt wizard client built with `@clack/prompts` and `yargs`.

---

## 🧪 Running Tests

multiplexus includes an integration test suite using Vitest with isolated in-memory SQLite:

```bash
npm run test -w packages/backend
```

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.