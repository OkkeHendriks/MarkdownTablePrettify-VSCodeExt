import * as assert from "assert";
import { ChildProcess, spawn } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { MAX_COLUMN_PADDING } from "../../../mcp/markdownFileFormatter";

interface ServerOutput {
    stdout: string;
    stderr: string;
    exitCode: number | null;
}

function runServer(messages: unknown[], workspaceRoot: string): Promise<ServerOutput> {
    const serverPath = path.resolve(__dirname, "../../../mcp/server.js");

    return new Promise((resolve, reject) => {
        const server: ChildProcess = spawn(process.execPath, [serverPath], {
            cwd: workspaceRoot,
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
    test("serves modern MCP discovery, tool listing, and formatting over stdio", async () => {
        const serverPath = path.resolve(__dirname, "../../../mcp/server.js");
        assert.ok(fs.readFileSync(serverPath, "utf8").startsWith("#!/usr/bin/env node"));

        const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "markdown-table-prettify-mcp-"));
        fs.writeFileSync(path.join(workspaceRoot, "README.md"), "hello|world\n-|-\nfoo|bar", "utf8");
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
                            name: "format_markdown_file",
                            arguments: { path: "README.md" },
                            _meta: metadata
                        }
                    }
                ],
                workspaceRoot
            );
            const responses = output.stdout.trim().split(/\r?\n/).map(line => JSON.parse(line));

            assert.strictEqual(output.exitCode, 0);
            assert.strictEqual(output.stderr, "");
            assert.deepStrictEqual(responses[0].result.supportedVersions, ["2026-07-28"]);
            assert.strictEqual(responses[1].result.tools[0].name, "format_markdown_file");
            assert.strictEqual(responses[1].result.tools[0].inputSchema.properties.columnPadding.maximum, MAX_COLUMN_PADDING);
            assert.strictEqual(responses[2].result.structuredContent.formattedMarkdown, "hello | world\n------|------\nfoo   | bar");
        } finally {
            fs.rmSync(workspaceRoot, { recursive: true, force: true });
        }
    });
});
