import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { formatMarkdownFile } from "./markdownFileFormatter";

function createServer(): McpServer {
    const server = new McpServer({
        name: "markdown-table-prettify",
        version: "4.1.0"
    });

    server.registerTool(
        "format_markdown_file",
        {
            title: "Format Markdown tables in a file",
            description: "Formats every Markdown table in a workspace file using Markdown Table Prettifier. Set write to true to replace the file; otherwise the formatted Markdown is returned without changing the file.",
            inputSchema: z.object({
                path: z.string().min(1).describe("A workspace-relative or absolute path to an existing Markdown file."),
                write: z.boolean().optional().describe("Replace the file when formatting changes are detected. Defaults to false."),
                columnPadding: z.number().int().min(0).optional().describe("Number of extra spaces around table cell values. Defaults to 0.")
            }),
            outputSchema: z.object({
                filePath: z.string(),
                changed: z.boolean(),
                written: z.boolean(),
                formattedMarkdown: z.string().optional()
            })
        },
        async ({ path, write, columnPadding }) => {
            const result = formatMarkdownFile(path, { write, columnPadding });
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

serveStdio(createServer, {
    legacy: "serve",
    onerror: error => {
        console.error("MCP server error:", error);
    }
});
