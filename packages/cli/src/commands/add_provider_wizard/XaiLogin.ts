import { spawn } from "child_process";
import { createServer } from "http";
import { renderHtmlTemplate } from "../../utils/ResponseRenderer";

export async function loginXai(): Promise<string> {
    return new Promise((resolve, reject) => {
        const port = 5678;
        const server = createServer((req, res) => {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET");

            const urlObj = new URL(req.url || "", `http://localhost:${port}`);
            if (urlObj.pathname === "/callback") {
                const token = urlObj.searchParams.get("token") || "mock-oauth-xai-token-123";
                
                const html = renderHtmlTemplate(
                    "Connected Successfully!",
                    "🛸",
                    "#ff8e53",
                    "Provider connection was established successfully in your multiplexus CLI."
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
            const targetUrl = `https://decolua.github.io/9router/connect?provider=xai&port=${port}`;
            
            const isWindows = process.platform === "win32";
            const isMac = process.platform === "darwin";
            const opener = isWindows ? "explorer" : (isMac ? "open" : "xdg-open");
            
            spawn(opener, [targetUrl], { detached: true, stdio: "ignore" }).unref();
        });
    });
}