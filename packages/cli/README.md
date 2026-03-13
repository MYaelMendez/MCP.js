# @mcp/cli

Command-line interface for the MCP sovereign runtime platform.

## Installation

```bash
npm install -g @mcp/cli
```

## Usage

```
mcp <command> [options]
```

## Commands

| Command | Description |
|---|---|
| `plan` | Create an execution plan |
| `exec` | Execute a plan |
| `vote` | Cast a governance vote |
| `seal` | Seal a proposal |
| `verify` | Verify the ledger chain |
| `export` | Export ledger data |
| `dagmo bounty create` | Create a DAGMO bounty as a GitHub Issue |

---

## DAGMO Bounty Command

The `dagmo bounty create` command calls a Cloudflare Worker endpoint to create GitHub Issues as DAGMO bounties.

### Syntax

```
mcp dagmo bounty create \
  --repo <owner/repo> \
  --title <title> \
  --reward <number> \
  [--description <text>] \
  [--label <label>]... \
  [--labels <label1,label2,...>] \
  [--worker-url <url>] \
  [--pretty]
```

### Flags

| Flag | Required | Description |
|---|---|---|
| `--repo` | ✅ | GitHub repository in `owner/repo` format |
| `--title` | ✅ | Bounty title (becomes the Issue title) |
| `--reward` | ✅ | Reward amount (finite number ≥ 0) |
| `--description` | ❌ | Optional description / body text |
| `--label` | ❌ | Label to apply (repeatable: `--label bug --label bounty`) |
| `--labels` | ❌ | Comma-separated labels (e.g. `--labels bug,bounty,help-wanted`) |
| `--worker-url` | ❌ | Override the DAGMO Worker base URL |
| `--pretty` | ❌ | Human-readable output instead of JSON |

### Worker URL configuration

The command resolves the worker base URL in this order:

1. `--worker-url <url>` CLI flag
2. `DAGMO_WORKER_URL` environment variable
3. Built-in default placeholder (`https://agent-api-worker..workers.dev`)

Set the environment variable to avoid repeating the flag:

```bash
export DAGMO_WORKER_URL=https://your-worker.workers.dev
```

### Output

By default the command prints machine-readable JSON matching the worker response:

```json
{
  "status": "created",
  "issue_url": "https://github.com/owner/repo/issues/42",
  "issue_number": 42,
  "title": "Fix critical bug in auth module",
  "reward": 500
}
```

With `--pretty`:

```
✅ Bounty created!
   Title:  Fix critical bug in auth module
   Reward: 500
   Issue:  https://github.com/owner/repo/issues/42 (#42)
   Status: created
```

### Examples

```bash
# Minimal — JSON output
mcp dagmo bounty create \
  --repo MYaelMendez/MCP.js \
  --title "Add DAGMO integration tests" \
  --reward 250

# With description and labels, pretty output
mcp dagmo bounty create \
  --repo MYaelMendez/MCP.js \
  --title "Fix ledger replay vulnerability" \
  --reward 1000 \
  --description "Replay attack possible via duplicate nonce — see issue #12." \
  --label bug \
  --label security \
  --pretty

# Comma-separated labels
mcp dagmo bounty create \
  --repo MYaelMendez/MCP.js \
  --title "Improve docs" \
  --reward 0 \
  --labels "documentation,help-wanted"

# Custom worker URL via env var
DAGMO_WORKER_URL=https://my-worker.workers.dev \
  mcp dagmo bounty create \
    --repo MYaelMendez/MCP.js \
    --title "Onboard new contributor" \
    --reward 100

# Custom worker URL via flag
mcp dagmo bounty create \
  --repo MYaelMendez/MCP.js \
  --title "Bounty" \
  --reward 50 \
  --worker-url https://my-worker.workers.dev
```

### Worker endpoint contract

The command `POST`s to `<worker-url>/v1/bounty/create` with:

```json
{
  "repo": "owner/repo",
  "title": "string",
  "reward": 0,
  "description": "string | null",
  "labels": ["string"]
}
```

Expected response:

```json
{
  "status": "created",
  "issue_url": "https://github.com/...",
  "issue_number": 42,
  "title": "string",
  "reward": 0
}
```

Non-2xx responses are treated as errors and printed to stderr.
