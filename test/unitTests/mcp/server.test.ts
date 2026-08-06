import * as assert from "assert";
import { ChildProcess, spawn } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

interface ServerOutput {
    stdout: string;
    stderr: string;
    exitCode: number | null;
}

function runServer(messages: unknown[], workingDirectory: string): Promise<ServerOutput> {
    const serverPath = path.resolve(__dirname, "../../../mcp/server.js");

    return new Promise((resolve, reject) => {
        const server: ChildProcess = spawn(process.execPath, [serverPath], {
            cwd: workingDirectory,
            stdio: ["pipe", "pipe", "pipe"]
        });
        let stdout = "";
        let stderr = "";

        server.stdout?.setEncoding("utf8");
        server.stderr?.setEncoding("utf8");
        server.stdout?.on("data", chunk => {
            stdout += chunk;
        });
        server.stderr?.on("data", chunk => {
            stderr += chunk;
        });
        server.once("error", reject);
        server.once("close", exitCode => {
            resolve({ stdout, stderr, exitCode });
        });

        server.stdin?.end(messages.map(message => JSON.stringify(message)).join("\n") + "\n");
    });
}

suite("MCP server tests", () => {
    test("serves modern MCP discovery, tool listing, and batch formatting over stdio", async () => {
        const serverPath = path.resolve(__dirname, "../../../mcp/server.js");
        assert.ok(fs.readFileSync(serverPath, "utf8").startsWith("#!/usr/bin/env node"));

        const serverWorkingDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "markdown-table-prettify-mcp-"));
        const externalWorktree = fs.mkdtempSync(path.join(os.tmpdir(), "markdown-table-prettify-worktree-"));
        fs.writeFileSync(path.join(serverWorkingDirectory, "README.md"), "hello|world\n-|-\nfoo|bar", "utf8");
        const externalFilePath = path.join(externalWorktree, "README.md");
        const missingFilePath = path.join(externalWorktree, "missing.md");
        fs.writeFileSync(externalFilePath, "alpha|beta\n-|-\ngamma|delta", "utf8");
        const metadata = {
            "io.modelcontextprotocol/protocolVersion": "2026-07-28",
            "io.modelcontextprotocol/clientCapabilities": {},
            "io.modelcontextprotocol/clientInfo": {
                name: "markdown-table-prettify-test",
                version: "1.0.0"
            }
        };
        try {
            const output = await runServer(
                [
                    {
                        jsonrpc: "2.0",
                        id: 1,
                        method: "server/discover",
                        params: { _meta: metadata }
                    },
                    {
                        jsonrpc: "2.0",
                        id: 2,
                        method: "tools/list",
                        params: { _meta: metadata }
                    },
                    {
                        jsonrpc: "2.0",
                        id: 3,
                        method: "tools/call",
                        params: {
                            name: "format_markdown_tables",
                            arguments: {
                                paths: ["README.md", externalFilePath]
                            },
                            _meta: metadata
                        }
                    },
                    {
                        jsonrpc: "2.0",
                        id: 4,
                        method: "tools/call",
                        params: {
                            name: "format_markdown_tables",
                            arguments: {
                                paths: ["README.md", externalFilePath, missingFilePath],
                                dryRun: false
                            },
                            _meta: metadata
                        }
                    }
                ],
                serverWorkingDirectory
            );
            const responses = output.stdout.trim().split(/\r?\n/).map(line => JSON.parse(line));

            assert.strictEqual(output.exitCode, 0);
            assert.strictEqual(output.stderr, "");
            assert.deepStrictEqual(responses[0].result.supportedVersions, ["2026-07-28"]);
            assert.strictEqual(responses[1].result.tools[0].name, "format_markdown_tables");
            assert.strictEqual(responses[2].result.structuredContent.files.length, 2);
            assert.strictEqual(responses[2].result.structuredContent.files[0].changed, true);
            assert.strictEqual(responses[2].result.structuredContent.files[0].written, false);
            assert.strictEqual(responses[2].result.structuredContent.files[1].changed, true);
            assert.strictEqual(responses[2].result.structuredContent.files[1].written, false);
            assert.strictEqual(responses[3].result.structuredContent.files.length, 3);
            assert.strictEqual(responses[3].result.structuredContent.files[0].changed, true);
            assert.strictEqual(responses[3].result.structuredContent.files[0].written, true);
            assert.strictEqual(responses[3].result.structuredContent.files[1].changed, true);
            assert.strictEqual(responses[3].result.structuredContent.files[1].written, true);
            assert.strictEqual(responses[3].result.structuredContent.files[2].changed, false);
            assert.strictEqual(responses[3].result.structuredContent.files[2].written, false);
            assert.match(responses[3].result.structuredContent.files[2].error, /ENOENT|cannot find/i);
            assert.strictEqual(fs.readFileSync(externalFilePath, "utf8"), "alpha | beta\n------|------\ngamma | delta");
            assert.strictEqual(fs.readFileSync(path.join(serverWorkingDirectory, "README.md"), "utf8"), "hello | world\n------|------\nfoo   | bar");
        } finally {
            fs.rmSync(serverWorkingDirectory, { recursive: true, force: true });
            fs.rmSync(externalWorktree, { recursive: true, force: true });
        }
    });
});
