# Markdown table prettifier

[![Test Status](https://github.com/darkriszty/MarkdownTablePrettify-VSCodeExt/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/darkriszty/MarkdownTablePrettify-VSCodeExt/actions)
[![Visual Studio Code extension](https://vsmarketplacebadges.dev/version-short/darkriszty.markdown-table-prettify.svg)](https://marketplace.visualstudio.com/items?itemName=darkriszty.markdown-table-prettify)
[![OVSX](https://img.shields.io/open-vsx/v/darkriszty/markdown-table-prettify?color=success&label=Open%20VSX)](https://open-vsx.org/extension/darkriszty/markdown-table-prettify)
[![Docker image](https://img.shields.io/docker/v/darkriszty/prettify-md?color=success&label=Docker)](https://hub.docker.com/r/darkriszty/prettify-md/tags?page=1&ordering=last_updated)
[![NPM package](https://img.shields.io/npm/v/markdown-table-prettify?color=success)](https://www.npmjs.com/package/markdown-table-prettify)
[![Benchmarks](https://github.com/darkriszty/MarkdownTablePrettify-VSCodeExt/actions/workflows/benchmark.yml/badge.svg)](https://github.com/darkriszty/MarkdownTablePrettify-VSCodeExt/actions/workflows/benchmark.yml)

Makes tables more readable for humans. Compatible with the Markdown writer plugin's table formatter feature in Atom.

## Feature highlights

- Remove redundant ending table border if the beginning has no border, so the table _will not end_ with "|".
- Create missing ending table border if the beginning already has a border, so the table _will end_ with "|".
- Save space by not right-padding the last column if the table has no border.
- Support empty columns inside tables.
- Support column alignment options with ":".
- Find and format multiple tables.
- Support \``code blocks`\` and ignore blocks with `<!-- markdown-table-prettify-ignore-start -->` and `<!-- markdown-table-prettify-ignore-end -->`.
- Support indented tables (tables with borders or tab indented).

## Visual Studio Code

![feature X](assets/animation.gif)

The extension is available for markdown language mode. It can either prettify a selection (`Format Selection`) or the entire document (`Format Document`).
A VSCode command called `Prettify markdown tables` is also available to format the currently opened document. 
Right-click on a table to access the context menu option `Prettify markdown table at cursor` for formatting individual tables without selection. 

### Configurable settings:
- The maximum texth length of a selection/entire document to consider for formatting. Default: 1M chars (limit does not apply from CLI or NPM).
- Additional languages to support formatting for besides `markdown`. See possible configurable values [here](https://code.visualstudio.com/docs/languages/identifiers#_known-language-identifiers). Default: `[ ]`.
- Column padding to make the columns more spaced out from each other. Default: `0` (no extra spacing/padding).
- Keyboard shortcut to prettify the currently opened markdown document. Default: <kbd>CTRL</kbd>+<kbd>ALT</kbd>+<kbd>M</kbd> (<kbd>CMD</kbd>+<kbd>ALT</kbd>+<kbd>M</kbd> on Mac).

## NPM

The formatting logic and MCP server are available as an NPM package: `npm install --save markdown-table-prettify`. The Typescript code is compiled to ES2022 and shipped inside the package. Requires Node.js 22+.

It currently exposes the entry point also used by the _CLI_. It can be used from regular NodeJS or web apps:

```JS
import { CliPrettify } from 'markdown-table-prettify';
// or
const { CliPrettify } = require('markdown-table-prettify');

console.log(CliPrettify.prettify(
`hello|world
-|-
foo|bar`));
/* Output:
hello | world
------|------
foo   | bar
*/

// specifying a column padding
console.log(CliPrettify.prettify(
`hello|world
-|-
foo|bar`, { columnPadding: 1 }));
/* Output:
 hello  |  world
 ------ | ------
 foo    |  bar
*/

```

## Docker & CLI

The core formatting logic is available as a node docker image: `docker pull darkriszty/prettify-md` or as a stand alone CLI tool.

Formatting files or checking if they're already formatted is also possible from the command line without docker. This requires `node` and `npm` (optionally also `npx`).

| Feature                               | Docker                                                                        | CLI                                                            |
|---------------------------------------|-------------------------------------------------------------------------------|----------------------------------------------------------------|
| Prettify a file                       | `docker container run -i darkriszty/prettify-md < input.md`                   | `npm run --silent prettify-md < input.md`                      |
| Prettify a file and save the output   | `docker container run -i darkriszty/prettify-md < input.md > output.md`       | `npm run --silent prettify-md < input.md > output.md`          |
| Check whether a file is pretty or not | `docker container run -i darkriszty/prettify-md --check < input.md`           | `npm run --silent check-md < input.md`                         |
| Use `1` as column padding             | `docker container run -i darkriszty/prettify-md --columnPadding=1 < input.md` | `npm run --silent prettify-md -- --columnPadding=1 < input.md` |

> Notes:
> * The prettify check (`--check` or `check-md`) will fail with an exception and return code `1` if the file is not prettyfied.
> * The `--silent` switch sets the NPM log level to silent, which is useful to hide the executed file name and concentrate on the actual output.
> * The `--` after the npm run script part is needed for npm to forward the arguments (for instance `--columnPadding=1`) to the actual prettyfier script.
> * Optionally, use `npx` to prettify files: `npx markdown-table-prettify < input.md` instead of `npm run --silent prettify-md < input.md`.

### Installation

To access the CLI, the extension can either be used from the Github sources, from the already installed VSCode extension or from NPM.

#### Compiling from the source code

- Clone or download the source code.
- Run `npm install`.
- Run `npm run compile`.

#### Using the already installed VSCode extension

Locate the installed extension path. The typical location of the installed extension:
- Windows: `%USERPROFILE%\.vscode\extensions\darkriszty.markdown-table-prettify-{version}`
- macOS: `~/.vscode/extensions/darkriszty.markdown-table-prettify-{version}`
- Linux: `~/.vscode/extensions/darkriszty.markdown-table-prettify-{version}`

#### Getting it from NPM

Install the NPM package `npm install -g markdown-table-prettify`.

## MCP server

The repository also provides an MCP server over stdio. It exposes a `format_markdown_tables` tool that formats Markdown tables in one or more existing Markdown files in a single call. Relative paths are resolved against the MCP working directory, while absolute paths can target any file accessible to the server process. The tool supports previewing changes with `dryRun=true` and applying changes with `dryRun=false`. It returns one result per file with `changed`, `written`, and `error` fields.

For normal use, configure an MCP client to launch the published package through `npx`:

```json
{
  "mcpServers": {
    "markdown-table-prettify": {
      "command": "npx",
      "args": [
        "--yes",
        "--package=markdown-table-prettify@<version>",
        "markdown-table-prettify-mcp"
      ],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

### Local development

Developers working from a local checkout can build and run the server:

```powershell
npm install
npm run compile
npm run --silent mcp
```

To configure an MCP client to use that checkout, set `cwd` to the directory that should resolve relative paths:

```json
{
  "mcpServers": {
    "markdown-table-prettify": {
      "command": "node",
      "args": [
        "<path-to-repository>/out/mcp/server.js"
      ],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

The server does not impose a workspace boundary. Absolute paths are supported for files such as Git worktrees outside the current working directory. The server runs with the operating-system permissions of the Node process; Copilot CLI may prompt before invoking the tool, but that approval does not add or restrict the server’s filesystem access. The v2 MCP server supports the current protocol and can also serve legacy clients.

## Known Issues

- Tables with mixed character widths (eg: CJK) are not always properly formatted (issue #4).