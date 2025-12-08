# Coherence Chat Archive Tool (v2)

A powerful CLI and TUI (Terminal User Interface) tool for exporting and archiving your conversation history from **Claude** and **ChatGPT**. It converts your JSON exports into organized Markdown files, suitable for personal knowledge management (PKM) systems like Obsidian or Logseq.

Includes optional **AI Semantic Tagging** using a local BERT model to automatically categorize your conversations.

## Features

-   **Multi-Provider Support**: Parses `conversations.json` from both Claude and ChatGPT exports.
-   **Flexible Input**: Supports directory inputs, direct JSON files, or ZIP archives.
-   **TUI & CLI**:
    -   Interactive Terminal UI (Ink-based) for easy navigation.
    -   Headless CLI commands for scripting and automation.
-   **Structured Export**:
    -   Converts conversations to clean Markdown.
    -   Preserves metadata (date, model, title) in YAML frontmatter.
    -   Organizes output in chronological folders: `{year}/{month}-{monthName}/`.
-   **AI Tagging (Optional)**:
    -   Uses `@huggingface/transformers` to run a local classification model.
    -   Automatically generates tags based on conversation content.
    -   **Privacy-first**: The model runs entirely locally; no data leaves your machine.
-   **Persistent Configuration**: Saves your preferences (output path, tagging settings) to `~/.config/chat-archive/config.json` (XDG compatible).

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-repo/chat-archive.git
    cd chat-archive
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Build the project:
    ```bash
    npm run build
    ```

4.  (Optional) Link globally:
    ```bash
    npm link
    ```

## Usage

### Interactive Mode (TUI)

Simply run the tool without arguments to launch the interactive interface:

```bash
npm start
# OR if linked
chat-archive
```

Use the arrow keys to navigate the menu:
-   **Select Export Source**: Choose between Claude or ChatGPT.
-   **Configure Tagging**: Enable/Disable AI tagging.
-   **Settings**: View/Save configuration.

### CLI Mode

Use the `export` command for automated or single-shot exports.

```bash
# Export Claude data from a directory
chat-archive export --provider claude --input ./claude_export/ --output ./journal

# Export ChatGPT data from a zip file with tagging enabled
chat-archive export --provider chatgpt --input ./chatgpt_export.zip --tag

# View help
chat-archive export --help
```

**Options:**
-   `-p, --provider <type>`: `claude` or `chatgpt` (Required)
-   `-i, --input <path>`: Path to directory, `.json` file, or `.zip` archive (Required)
-   `-o, --output <path>`: Output directory (Defaults to config setting)
-   `--tag`: Force enable AI tagging
-   `--no-tag`: Force disable AI tagging

## Configuration

Configuration is stored in `~/.config/chat-archive/config.json`. You can edit this file manually or save settings via the TUI.

```json
{
  "outputPath": "./output",
  "tagging": {
    "enabled": false,
    "model": "Xenova/mobilebert-uncased-mnli",
    "threshold": 0.5,
    "maxTags": 5,
    "customCategories": [ ... ]
  },
  "formatting": {
    "dateFormat": "YYYY-MM-DD",
    "folderStructure": "{year}/{month}-{monthName}/",
    "filenameTemplate": "{day}-{slug}.md"
  }
}
```

## Demo & Samples

### Interactive TUI
The tool features a clean, keyboard-navigable terminal interface.

**Main Menu**
```
 Chat Archive Tool

 ❯ 📦 Select Export Source
   📂 Browse & Export
   🏷️  Configure Tagging
   ⚙️  Settings
   🚪 Exit
```

**AI Tagging Configuration**
```
 AI Tagging Configuration

 Automatically generate semantic tags for your conversations using a local AI model.
 Note: First run will download ~25MB model.

 ❯ Enable AI Tagging: [OFF]
   🔙 Back
```

### Sample Output
Conversations are exported to Markdown with YAML frontmatter containing metadata.

**Input (`samples/claude_mock.json`)**
```json
{
  "conversations": [
    {
      "uuid": "550e8400-...",
      "name": "Designing the Chat Archive Tool",
      "chat_messages": [...]
    }
  ]
}
```

**Output (`2023/10-october/27-designing-the-chat-archive-tool.md`)**
```markdown
---
title: Designing the Chat Archive Tool
date: '2023-10-27'
updated: '2023-10-27'
uuid: 550e8400-e29b-41d4-a716-446655440000
tags: ["programming", "AI", "tooling"]
---
### HUMAN (2023-10-27T10:01:00.000Z)

I want to build a CLI tool to archive my Claude conversations. It should be a TUI using Ink.

---

### ASSISTANT (2023-10-27T10:02:00.000Z)

That sounds like a great project! Using Ink for the TUI...
```

## AI Tagging

The tool uses the `Xenova/mobilebert-uncased-mnli` model (via `@huggingface/transformers`) for zero-shot classification. On the first run with tagging enabled, it will download the quantized model (~25MB) to your local cache.

## Development

-   **Build**: `npm run build` (Compiles TypeScript to `dist/`)
-   **Test**: `npm test` (Runs Jest unit tests)
-   **Lint**: `npm run lint` (if configured)

## License

MIT
