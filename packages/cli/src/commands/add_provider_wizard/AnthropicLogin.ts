import { createServer } from "http";
import { renderHtmlTemplate } from "../../utils/ResponseRenderer";
import { openUrlInBrowser } from "../../utils/ProcessUtils";

/**
 * Logs in to Anthropic.
 * @returns The OAuth token.
 */
export async function loginAnthropic(): Promise<string> {
    return new Promise((resolve, reject) => {
        const port = 5678;
        const server = createServer((req, res) => {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET");

            const urlObj = new URL(req.url || "", `http://localhost:${port}`);
            if (urlObj.pathname === "/callback") {
                const token = urlObj.searchParams.get("token") || "mock-oauth-anthropic-token-123";
                
                const html = renderHtmlTemplate(
                    "Connected Successfully!",
                    "🐜",
                    "#ff6b6b",
                    "Anthropic Claude connection was established successfully in your multiplexus CLI."
                );

                res.writeHead(200, { "Content-Type": "text/html" });
                res.end(html);
                
                server.close();
                resolve(token);
                return;
            }
            res.writeHead(400);
            res.end("Invalid callback");
        });

        server.listen(port, () => {
            const targetUrl = `https://decolua.github.io/9router/connect?provider=anthropic&port=${port}`;
            openUrlInBrowser(targetUrl);
        });
    });
}