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
        "format_markdown_files",
        {
            title: "Format Markdown tables in files",
            description: "Formats every Markdown table in one or more Markdown files using Markdown Table Prettifier. Relative paths are resolved against the working directory supplied by the MCP client when it launches the server. By default this is a dry run that reports whether changes are needed for each file; set dryRun to false to replace changed files. Each file reports its own status and includes an error when processing fails.",
            inputSchema: z.object({
                paths: z.array(z.string().min(1)).min(1).describe("One or more relative or absolute paths to existing Markdown files. Relative paths use the MCP client's supplied working directory."),
                dryRun: z.boolean().default(true).describe("Only report whether formatting changes are needed. Defaults to true; set to false to replace the file when changes are detected."),
                columnPadding: z.number().int().min(0).optional().describe("Number of extra spaces around table cell values. Defaults to 0.")
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
