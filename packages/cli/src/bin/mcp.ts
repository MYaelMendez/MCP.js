#!/usr/bin/env node
/**
 * mcp — MCP.js command-line interface
 *
 * Commands:
 *   mcp plan    <plugin> <input>   Produce a plan envelope
 *   mcp exec    <plugin> <plan>    Execute a plan
 *   mcp vote    <proposalId> <choice>  Cast a DAO vote
 *   mcp seal    <proposalId>       Attempt to seal a proposal
 *   mcp verify                     Verify ledger chain integrity
 *   mcp export                     Export all ledger blocks as JSON
 *
 * TODO: Connect each command to the runtime PluginEngine, Ledger, and DAO.
 */

import { PluginEngine, Ledger, DAO } from "@mcp/runtime";

const [, , command, ...args] = process.argv;

const engine = new PluginEngine();
const ledger = new Ledger();
const dao = new DAO(0, ledger);

async function main(): Promise<void> {
  switch (command) {
    case "plan": {
      const [pluginName, rawInput] = args;
      if (!pluginName) {
        console.error("Usage: mcp plan <plugin> <json-input>");
        process.exit(1);
      }
      const input = rawInput ? JSON.parse(rawInput) : {};
      const plan = await engine.plan(pluginName, input);
      console.log(JSON.stringify(plan, null, 2));
      break;
    }

    case "exec": {
      const [pluginName, rawPlan] = args;
      if (!pluginName || !rawPlan) {
        console.error("Usage: mcp exec <plugin> <json-plan>");
        process.exit(1);
      }
      const plan = JSON.parse(rawPlan);
      const ctx = { issuer: "did:key:todo", ts: Date.now(), planBlockHash: "todo" };
      const result = await engine.execute(pluginName, plan, ctx);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case "vote": {
      const [proposalId, choice, voter = "did:key:todo"] = args;
      if (!proposalId || !choice) {
        console.error("Usage: mcp vote <proposalId> <yes|no|abstain> [voter-did]");
        process.exit(1);
      }
      dao.vote(proposalId, voter, choice as "yes" | "no" | "abstain");
      console.log(`Voted ${choice} on proposal ${proposalId}`);
      break;
    }

    case "seal": {
      const [proposalId] = args;
      if (!proposalId) {
        console.error("Usage: mcp seal <proposalId>");
        process.exit(1);
      }
      dao.assertQuorum(proposalId);
      console.log(`Quorum met — proposal ${proposalId} may be sealed`);
      // TODO: Append a seal block to the ledger after DAO gate passes.
      break;
    }

    case "verify": {
      const ok = ledger.verifyChain();
      console.log(ok ? "Chain OK" : "Chain INVALID");
      process.exit(ok ? 0 : 1);
      break;
    }

    case "export": {
      console.log(JSON.stringify(ledger.blocks(), null, 2));
      break;
    }

    default:
      console.error(`Unknown command: ${command ?? "(none)"}`);
      console.error("Available commands: plan, exec, vote, seal, verify, export");
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
