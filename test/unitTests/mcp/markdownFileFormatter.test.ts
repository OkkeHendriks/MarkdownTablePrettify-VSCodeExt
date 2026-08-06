import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { formatMarkdownFiles } from "../../../mcp/markdownFileFormatter";

suite("Markdown file formatter tests", () => {
    let tempRoot: string;

    setup(() => {
        tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "markdown-table-prettify-"));
    });

    teardown(() => {
        fs.rmSync(tempRoot, { recursive: true, force: true });
    });

    test("reports changes for all files without writing by default", () => {
        const filePaths = [
            path.join(tempRoot, "README.md"),
            path.join(tempRoot, "docs.md")
        ];
        const input = "hello|world\n-|- \nfoo|bar";
        for (const filePath of filePaths) {
            fs.writeFileSync(filePath, input, "utf8");
        }

        const results = formatMarkdownFiles(filePaths);

        assert.strictEqual(results.length, filePaths.length);
        for (const [index, result] of results.entries()) {
            assert.strictEqual(result.filePath, fs.realpathSync(filePaths[index]));
            assert.strictEqual(result.changed, true);
            assert.strictEqual(result.written, false);
            assert.strictEqual(fs.readFileSync(filePaths[index], "utf8"), input);
        }
    });

    test("writes all changed files when dry run is disabled", () => {
        const changedFilePath = path.join(tempRoot, "README.md");
        const unchangedFilePath = path.join(tempRoot, "docs.md");
        fs.writeFileSync(changedFilePath, "hello|world\n-|-\nfoo|bar", "utf8");
        fs.writeFileSync(unchangedFilePath, "hello | world\n------|------\nfoo   | bar", "utf8");

        const results = formatMarkdownFiles([changedFilePath, unchangedFilePath], { dryRun: false });

        assert.strictEqual(results[0].changed, true);
        assert.strictEqual(results[0].written, true);
        assert.strictEqual(results[1].changed, false);
        assert.strictEqual(results[1].written, false);
        assert.strictEqual(fs.readFileSync(changedFilePath, "utf8"), "hello | world\n------|------\nfoo   | bar");
        assert.strictEqual(fs.readFileSync(unchangedFilePath, "utf8"), "hello | world\n------|------\nfoo   | bar");
    });

    test("rejects an empty file list", () => {
        assert.throws(
            () => formatMarkdownFiles([]),
            /At least one file path is required/
        );
    });

    test("formats absolute files without a workspace restriction", () => {
        const filePath = path.join(tempRoot, "outside-worktree.md");
        fs.writeFileSync(filePath, "hello|world\n-|-\nfoo|bar", "utf8");

        const results = formatMarkdownFiles([filePath]);

        assert.strictEqual(results[0].filePath, fs.realpathSync(filePath));
        assert.strictEqual(results[0].changed, true);
        assert.strictEqual(results[0].written, false);
    });

    test("reports failures per file while continuing the batch", () => {
        const validFilePath = path.join(tempRoot, "valid.md");
        const missingFilePath = path.join(tempRoot, "missing.md");
        fs.writeFileSync(validFilePath, "hello|world\n-|-\nfoo|bar", "utf8");

        const results = formatMarkdownFiles([validFilePath, missingFilePath], { dryRun: false });

        assert.strictEqual(results[0].written, true);
        assert.strictEqual(results[1].changed, false);
        assert.strictEqual(results[1].written, false);
        assert.match(results[1].error ?? "", /ENOENT|cannot find/i);
        assert.strictEqual(fs.readFileSync(validFilePath, "utf8"), "hello | world\n------|------\nfoo   | bar");
    });

});
