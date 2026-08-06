import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { formatMarkdownFile, MAX_COLUMN_PADDING } from "../../../mcp/markdownFileFormatter";

suite("Markdown file formatter tests", () => {
    let workspaceRoot: string;

    setup(() => {
        workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "markdown-table-prettify-"));
    });

    teardown(() => {
        fs.rmSync(workspaceRoot, { recursive: true, force: true });
    });

    test("returns formatted content without writing by default", () => {
        const filePath = path.join(workspaceRoot, "README.md");
        const input = "hello|world\n-|- \nfoo|bar";
        fs.writeFileSync(filePath, input, "utf8");

        const result = formatMarkdownFile("README.md", {}, workspaceRoot);

        assert.strictEqual(result.filePath, "README.md");
        assert.strictEqual(result.changed, true);
        assert.strictEqual(result.written, false);
        assert.strictEqual(result.formattedMarkdown, "hello | world\n------|------\nfoo   | bar");
        assert.strictEqual(fs.readFileSync(filePath, "utf8"), input);
    });

    test("writes formatted content when requested", () => {
        const filePath = path.join(workspaceRoot, "README.md");
        fs.writeFileSync(filePath, "hello|world\n-|-\nfoo|bar", "utf8");

        const result = formatMarkdownFile("README.md", { write: true }, workspaceRoot);

        assert.strictEqual(result.changed, true);
        assert.strictEqual(result.written, true);
        assert.strictEqual(fs.readFileSync(filePath, "utf8"), "hello | world\n------|------\nfoo   | bar");
        assert.strictEqual(result.formattedMarkdown, undefined);
    });

    test("rejects files outside the workspace", () => {
        const outsideFilePath = path.join(path.dirname(workspaceRoot), `${path.basename(workspaceRoot)}-outside.md`);
        fs.writeFileSync(outsideFilePath, "hello|world\n-|-\nfoo|bar", "utf8");

        try {
            assert.throws(
                () => formatMarkdownFile(path.relative(workspaceRoot, outsideFilePath), {}, workspaceRoot),
                /inside the workspace/
            );
        } finally {
            fs.rmSync(outsideFilePath, { force: true });
        }
    });

    test("rejects excessive column padding", () => {
        const filePath = path.join(workspaceRoot, "README.md");
        fs.writeFileSync(filePath, "hello|world\n-|-\nfoo|bar", "utf8");

        assert.throws(
            () => formatMarkdownFile("README.md", { columnPadding: MAX_COLUMN_PADDING + 1 }, workspaceRoot),
            new RegExp(`between 0 and ${MAX_COLUMN_PADDING}`)
        );
    });
});
