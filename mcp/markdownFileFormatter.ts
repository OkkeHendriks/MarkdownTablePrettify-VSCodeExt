import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { CliPrettify } from "../cli/cliPrettify";
import { StderrLogger } from "../src/diagnostics/stderrLogger";

export interface MarkdownFileFormatOptions {
    dryRun?: boolean;
    columnPadding?: number;
}

export interface MarkdownFileFormatResult extends Record<string, unknown> {
    filePath: string;
    changed: boolean;
    written: boolean;
    error?: string;
}

export function formatMarkdownFiles(
    filePaths: string[],
    options: MarkdownFileFormatOptions = {}
): MarkdownFileFormatResult[] {
    if (filePaths.length === 0) {
        throw new Error("At least one file path is required.");
    }

    return filePaths.map(filePath => formatMarkdownFile(filePath, options));
}

function formatMarkdownFile(
    filePath: string,
    options: MarkdownFileFormatOptions
): MarkdownFileFormatResult {
    try {
        const resolvedFilePath = realpathSync(resolve(filePath));
        const input = readFileSync(resolvedFilePath, "utf8");
        const formattedMarkdown = CliPrettify.prettify(
            input,
            {
                check: false,
                columnPadding: options.columnPadding ?? 0
            },
            new StderrLogger()
        );
        const changed = formattedMarkdown !== input;
        const written = Boolean(options.dryRun === false && changed);

        if (written) {
            writeFileSync(resolvedFilePath, formattedMarkdown, "utf8");
        }

        return {
            filePath: resolvedFilePath,
            changed,
            written
        };
    } catch (error: unknown) {
        return {
            filePath,
            changed: false,
            written: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}
