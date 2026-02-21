import { Ledger, MemoryLedgerStore } from "@mcp/runtime"

const COMMANDS = ["plan", "exec", "vote", "seal", "verify", "export"] as const
type Command = (typeof COMMANDS)[number]

const ledgerStore = new MemoryLedgerStore()
const ledger = new Ledger(ledgerStore)

/**
 * Dispatch a CLI command.
 * All business logic lives in @mcp/runtime — this layer only handles I/O.
 */
export async function runCli(command: string, args: string[]): Promise<void> {
  if (!COMMANDS.includes(command as Command)) {
    console.error(`Unknown command: ${command}`)
    console.error(`Available: ${COMMANDS.join(", ")}`)
    process.exit(1)
  }

  switch (command as Command) {
    case "plan":
      console.log("plan:", args)
      break

    case "exec":
      console.log("exec:", args)
      break

    case "vote":
      console.log("vote:", args)
      break

    case "seal":
      console.log("seal:", args)
      break

    case "verify":
      await ledger.verifyChain()
      console.log("Chain verified successfully.")
      break

    case "export": {
      const root = await ledger.epochRoot()
      console.log(JSON.stringify({ epochRoot: root }))
      break
    }
  }
}
