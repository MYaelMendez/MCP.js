#!/usr/bin/env node
/**
 * MCP CLI entry point.
 * Thin wrapper over @mcp/runtime — no business logic duplication.
 */
import { parseArgs } from "node:util"
import { runCli } from "../src/cli.js"

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
  options: {
    help: { type: "boolean", short: "h" },
    version: { type: "boolean", short: "v" },
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
      "  plan     Create an execution plan",
      "  exec     Execute a plan",
      "  vote     Cast a governance vote",
      "  seal     Seal a proposal",
      "  verify   Verify the ledger chain",
      "  export   Export ledger data",
    ].join("\n"),
  )
  process.exit(values.help ? 0 : 1)
}

await runCli(command, positionals.slice(1))
