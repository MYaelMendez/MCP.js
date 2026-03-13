#!/usr/bin/env node
/**
 * MCP CLI entry point.
 * Thin wrapper over @mcp/runtime — no business logic duplication.
 */
import { parseArgs } from "node:util"
import { runCli } from "../src/cli.js"
import { runDagmoBountyCreate } from "../src/dagmo.js"
import { DEFAULT_WORKER_URL } from "@mcp/runtime"

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
  options: {
    help: { type: "boolean", short: "h" },
    version: { type: "boolean", short: "v" },
    // dagmo bounty create flags
    repo: { type: "string" },
    title: { type: "string" },
    reward: { type: "string" },
    description: { type: "string" },
    label: { type: "string", multiple: true },
    labels: { type: "string" },
    "worker-url": { type: "string" },
    pretty: { type: "boolean" },
  },
})

if (values.version) {
  console.log("mcp 0.1.0")
  process.exit(0)
}

const command = positionals[0]
if (!command || values.help) {
  console.log(
    [
      "Usage: mcp <command> [options]",
      "",
      "Commands:",
      "  plan              Create an execution plan",
      "  exec              Execute a plan",
      "  vote              Cast a governance vote",
      "  seal              Seal a proposal",
      "  verify            Verify the ledger chain",
      "  export            Export ledger data",
      "  dagmo bounty create  Create a DAGMO bounty (GitHub Issue)",
      "",
      "DAGMO bounty create options:",
      "  --repo <owner/repo>      Target GitHub repository (required)",
      "  --title <text>           Bounty title (required)",
      "  --reward <number>        Reward amount (required)",
      "  --description <text>     Optional description",
      "  --label <label>          Label (repeatable)",
      "  --labels <a,b,c>         Comma-separated labels",
      "  --worker-url <url>       Worker base URL (default: DAGMO_WORKER_URL env or placeholder)",
      "  --pretty                 Human-readable output instead of JSON",
    ].join("\n"),
  )
  process.exit(values.help ? 0 : 1)
}

if (command === "dagmo") {
  const sub1 = positionals[1]
  const sub2 = positionals[2]
  if (sub1 === "bounty" && sub2 === "create") {
    const repo = values.repo
    const title = values.title
    const rewardStr = values.reward
    if (!repo) {
      console.error("Error: --repo <owner/repo> is required")
      process.exit(1)
    }
    if (!title) {
      console.error("Error: --title <text> is required")
      process.exit(1)
    }
    if (rewardStr === undefined) {
      console.error("Error: --reward <number> is required")
      process.exit(1)
    }
    const reward = Number(rewardStr)
    if (!Number.isFinite(reward) || reward < 0) {
      console.error(`Error: --reward must be a finite number >= 0, got: ${rewardStr}`)
      process.exit(1)
    }

    const labelSingles: string[] = Array.isArray(values.label)
      ? (values.label as string[])
      : values.label
        ? [values.label as string]
        : []
    const labelsCsv: string[] = values.labels
      ? (values.labels as string).split(",").map((l) => l.trim()).filter(Boolean)
      : []
    const labels = [...new Set([...labelSingles, ...labelsCsv])]

    const workerUrl =
      (values["worker-url"] as string | undefined) ??
      process.env["DAGMO_WORKER_URL"] ??
      DEFAULT_WORKER_URL

    await runDagmoBountyCreate({
      repo,
      title,
      reward,
      description: values.description as string | undefined,
      labels,
      workerUrl,
      pretty: values.pretty === true,
    })
    process.exit(0)
  }

  console.error("Usage: mcp dagmo bounty create --repo <owner/repo> --title <text> --reward <number>")
  process.exit(1)
}

await runCli(command, positionals.slice(1))
