const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "out");
const isWindows = process.platform === "win32";
const npxCommand = isWindows ? "npx.cmd" : "npx";
const npmCommand = isWindows ? "npm.cmd" : "npm";

function run(command, args, cwd = rootDir) {
    if (isWindows) {
        execFileSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", [command, ...args].join(" ")], {
            cwd,
            stdio: "inherit"
        });
        return;
    }

    execFileSync(command, args, {
        cwd,
        stdio: "inherit"
    });
}

// Keep file operations in Node so npm run dist works on Windows and POSIX shells.
fs.rmSync(outputDir, { recursive: true, force: true });
run(npxCommand, ["tsc", "-p", "./tsconfig.dist.json"]);
run(npxCommand, ["gulp", "merge-packagejson-for-npm-dist"]);
fs.copyFileSync(path.join(rootDir, "README.md"), path.join(outputDir, "README.md"));
fs.copyFileSync(path.join(rootDir, "LICENSE"), path.join(outputDir, "LICENSE"));
run(npmCommand, ["pack"], outputDir);
