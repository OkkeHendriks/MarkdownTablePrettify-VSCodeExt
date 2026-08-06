import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { formatMarkdownFile } from "./markdownFileFormatter";

const server = new McpServer({
    name: "markdown-table-prettify",
    version: "4.1.0"
});

const outputSchema = {
    filePath: z.string(),
    changed: z.boolean(),
    written: z.boolean(),
    formattedMarkdown: z.string().optional()
};

server.registerTool(
    "format_markdown_file",
    {
        title: "Format Markdown tables in a file",
        description: "Formats every Markdown table in a workspace file using Markdown Table Prettifier. Set write to true to replace the file; otherwise the formatted Markdown is returned without changing the file.",
        inputSchema: {
            path: z.string().min(1).describe("A workspace-relative or absolute path to an existing Markdown file."),
            write: z.boolean().optional().describe("Replace the file when formatting changes are detected. Defaults to false."),
            columnPadding: z.number().int().min(0).optional().describe("Number of extra spaces around table cell values. Defaults to 0.")
        },
        outputSchema
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

async function main(): Promise<void> {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch(error => {
    console.error("MCP server error:", error);
    process.exitCode = 1;
});
