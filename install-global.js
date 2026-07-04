import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const rootDir = process.cwd();

console.log("=== multiplexus Global CLI Installer ===");

try {
    // 1. Ensure private is false in packages/cli/package.json to prevent npm link issues
    const cliPackagePath = path.join(rootDir, "packages", "cli", "package.json");
    if (fs.existsSync(cliPackagePath)) {
        const cliPkg = JSON.parse(fs.readFileSync(cliPackagePath, "utf-8"));
        if (cliPkg.private) {
            cliPkg.private = false;
            fs.writeFileSync(cliPackagePath, JSON.stringify(cliPkg, null, 4), "utf-8");
            console.log("- Set private: false in packages/cli/package.json");
        }
    }

    // 2. Build the project
    console.log("- Building project packages...");
    execSync("npm run build", { stdio: "inherit", cwd: rootDir });

    // 3. Link packages/shared first
    console.log("- Linking @multiplexus/shared...");
    execSync("npm link", { stdio: "inherit", cwd: path.join(rootDir, "packages", "shared") });

    // 4. Link CLI package and bind shared dependency
    console.log("- Linking @multiplexus/cli globally...");
    const cliDir = path.join(rootDir, "packages", "cli");
    execSync("npm link @multiplexus/shared", { stdio: "inherit", cwd: cliDir });
    
    // Run global link execution
    const isWindows = process.platform === "win32";
    execSync("npm link", { stdio: "inherit", cwd: cliDir, shell: isWindows });

    console.log("\n=== Success! ===");
    console.log("multiplexus CLI ('mp' or 'multiplexus') has been linked globally.");
    console.log("You can now open a new terminal window and run: mp");
} catch (error) {
    console.error("\nInstallation failed:", error.message);
    process.exit(1);
}
