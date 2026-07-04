import * as fs from "fs";
import * as path from "path";

export function renderHtmlTemplate(
    title: string,
    emoji: string,
    color: string,
    message: string
): string {
    let currentDir = __dirname;
    let templatePath = "";
    
    for (let i = 0; i < 5; i++) {
        const checkPath = path.join(currentDir, "static", "template.html");
        if (fs.existsSync(checkPath)) {
            templatePath = checkPath;
            break;
        }
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) {
            break;
        }
        currentDir = parentDir;
    }

    if (!templatePath) {
        return `<html><body><h1>${emoji} ${title}</h1><p>${message}</p></body></html>`;
    }

    let html = fs.readFileSync(templatePath, "utf-8");
    html = html
        .replace(/\{\{\s*TITLE\s*\}\}/g, title)
        .replace(/\{\{\s*EMOJI\s*\}\}/g, emoji)
        .replace(/\{\{\s*COLOR\s*\}\}/g, color)
        .replace(/\{\{\s*MESSAGE\s*\}\}/g, message);

    return html;
}