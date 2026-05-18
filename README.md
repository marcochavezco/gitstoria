# gitstoria

Attach reasoning and process notes to your git commits via any MCP-compatible
LLM client. Every time you commit, gitstoria queues the commit for review —
your LLM reads the diff, writes a structured session log, and stores it locally
alongside your repo history.

## How it works

1. You make a commit — a `post-commit` hook fires and records the commit hash in a local SQLite DB
2. You ask Claude to log what you worked on
3. Claude calls the gitstoria MCP tools, reads the diff, and writes a session log back to the DB

---

## Requirements

- Node 18+
- git

## Installation

Install globally:

```sh
npm install -g gitstoria
```

Then initialize inside a git repository:

```sh
cd your-project
gitstoria init
```

This creates `~/.gitstoria/sessions.db` and installs a `post-commit` hook in the current repo.

---

## Claude Desktop setup

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gitstoria": {
      "command": "npx",
      "args": ["-y", "gitstoria", "mcp"]
    }
  }
}
```

Restart Claude Desktop. The five gitstoria tools will be available in every conversation.

## Compatible clients

Any MCP-compatible client works with gitstoria:

- **Claude Desktop** — see setup above
- **Cursor** — add to `.cursor/mcp.json`
- **Any MCP client** — use `npx gitstoria mcp` as the server command

---

## MCP tools

| Tool            | Description                                                   |
| --------------- | ------------------------------------------------------------- |
| `check_pending` | List commits in the current repo that have no session log yet |
| `get_git_log`   | Return recent commits with hash, author, date, and message    |
| `get_git_diff`  | Return the raw diff between two commit hashes                 |
| `log_session`   | Save a session log summary for a range of commits             |
| `get_session`   | Retrieve a saved session log by commit hash                   |

All tools take `repoPath` (absolute path to the repository) as their first input.

> **Note:** `repoPath` must be an absolute path (e.g. `/Users/yourname/projects/myapp`).
> The `~` shorthand is not expanded.

---

## Usage example

You say to Claude:

> "Log what I just worked on in /Users/yourname/projects/myapp"

Claude will:

1. Call `check_pending` to find unlogged commits
2. Call `get_git_log` to see the commit messages
3. Call `get_git_diff` to read the actual changes
4. Call `log_session` with a written summary of the work and the commit range

The log is stored in `~/.gitstoria/sessions.db` and can be retrieved later with `get_session`.

---

## CLI

```sh
gitstoria init               # initialize in the current git repo
gitstoria mcp                # start the MCP server (used by Claude Desktop)
gitstoria ui                 # open the session log browser at http://localhost:3000
gitstoria ui --port 4000     # start on a custom port
```

`gitstoria record-commit` is called automatically by the post-commit hook — you do not need to run it manually.

---

## Logging commits made before init

gitstoria only tracks commits made after `gitstoria init` is run. To retroactively queue an older commit for logging, run:

```sh
gitstoria record-commit --hash <commit-hash> --repo <absolute-path-to-repo>
```

For example:

```sh
gitstoria record-commit --hash abc1234 --repo /Users/yourname/projects/myapp
```

Once queued, ask Claude to log it the same way as any other pending commit.

---

## Troubleshooting

**`gitstoria: command not found` in post-commit hook**

The hook runs with a restricted PATH that may not include your global npm bin. Re-initialize to get the updated hook:

```sh
rm .git/hooks/post-commit
gitstoria init
```

Or patch the existing hook manually:

```sh
sed -i '' 's|gitstoria record-commit|npx --yes gitstoria record-commit|' .git/hooks/post-commit
```

**`NODE_MODULE_VERSION` error on first run**

```sh
npm cache clean --force && rm -rf ~/.npm/_npx
npx gitstoria init
```
