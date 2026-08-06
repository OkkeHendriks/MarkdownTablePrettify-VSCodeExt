#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { formatMarkdownFiles } from "./markdownFileFormatter";

function createServer(): McpServer {
    const server = new McpServer({
        name: "markdown-table-prettify",
        version: "4.1.0"
    });

    server.registerTool(
        "format_markdown_tables",
        {
            title: "Format Markdown tables in files",
            description: "Formats Markdown tables in one or more existing Markdown files. The tool supports previewing changes with `dryRun=true` and applying changes with `dryRun=false`. Dry-run mode is useful when the scope is broad or uncertain. Direct writes are acceptable when the user explicitly requests formatting and the target files are clear. Non-table Markdown content remains unchanged. Paths may be absolute or relative to the MCP working directory. Returns one result per file with `changed`, `written`, and `error` fields.",
            inputSchema: z.object({
                paths: z.array(z.string().min(1)).min(1).describe("One or more existing Markdown file paths. Relative paths resolve against the MCP working directory."),
                dryRun: z.boolean().default(true).describe("Reports required changes without writing when true. Writes formatted files when false. Defaults to true."),
                columnPadding: z.number().int().min(0).optional().describe("Number of additional spaces around table cell values. Defaults to 0.")
            }),
            outputSchema: z.object({
                files: z.array(z.object({
                    filePath: z.string(),
                    changed: z.boolean(),
                    written: z.boolean(),
                    error: z.string().optional()
                }))
            })
        },
        async ({ paths, dryRun, columnPadding }) => {
            const result = {
                files: formatMarkdownFiles(paths, { dryRun, columnPadding })
            };
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result, null, 2)
                    }
                ],
                structuredContent: result
            };
        }
    );

    return server;
}

// Keep legacy serving enabled while MCP clients migrate to the current protocol.
serveStdio(createServer, {
    legacy: "serve",
    onerror: error => {
        console.error("MCP server error:", error);
    }
});
