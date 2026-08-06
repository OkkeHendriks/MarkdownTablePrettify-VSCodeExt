import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { CliPrettify } from "../cli/cliPrettify";
import { StderrLogger } from "../src/diagnostics/stderrLogger";

export interface MarkdownFileFormatOptions {
    write?: boolean;
    columnPadding?: number;
}

export const MAX_COLUMN_PADDING = 100;

export interface MarkdownFileFormatResult extends Record<string, unknown> {
    filePath: string;
    changed: boolean;
    written: boolean;
    formattedMarkdown?: string;
}

export function formatMarkdownFile(
    filePath: string,
    options: MarkdownFileFormatOptions = {},
    workspaceRoot: string = process.cwd()
): MarkdownFileFormatResult {
    // Resolve symlinks before checking the boundary so a link cannot escape the workspace.
    const columnPadding = validateColumnPadding(options.columnPadding);
    const resolvedWorkspaceRoot = realpathSync(resolve(workspaceRoot));
    const resolvedFilePath = realpathSync(resolve(resolvedWorkspaceRoot, filePath));
    const relativeFilePath = relative(resolvedWorkspaceRoot, resolvedFilePath);

    if (isOutsideWorkspace(relativeFilePath)) {
        throw new Error(`File path must be inside the workspace: ${filePath}`);
    }

    const input = readFileSync(resolvedFilePath, "utf8");
    const formattedMarkdown = CliPrettify.prettify(
        input,
        {
            check: false,
            columnPadding
        },
        new StderrLogger()
    );
    const changed = formattedMarkdown !== input;
    const written = Boolean(options.write && changed);

    if (written) {
        writeFileSync(resolvedFilePath, formattedMarkdown, "utf8");
    }

    return {
        filePath: relativeFilePath,
        changed,
        written,
        ...(options.write ? {} : { formattedMarkdown })
    };
}

function validateColumnPadding(columnPadding: number | undefined): number {
    const value = columnPadding ?? 0;
    if (!Number.isInteger(value) || value < 0 || value > MAX_COLUMN_PADDING) {
        throw new RangeError(`Column padding must be an integer between 0 and ${MAX_COLUMN_PADDING}.`);
    }
    return value;
}

function isOutsideWorkspace(relativeFilePath: string): boolean {
    return relativeFilePath === ".."
        || relativeFilePath.startsWith(`..${sep}`)
        || isAbsolute(relativeFilePath);
}
