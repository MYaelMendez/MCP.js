// Core types
export type { Ae11Block } from "./core/block.js"
export { stableStr } from "./core/stableStr.js"

// Crypto
export { sign, verify, generateKeyPair, getPublicKeyAsync, encodeDid, decodeDid } from "./crypto/did.js"

// Ledger
export { Ledger, MemoryLedgerStore, buildBlock } from "./ledger/index.js"
export type { LedgerStore } from "./ledger/index.js"

// DAO
export { Dao } from "./dao/index.js"
export type { Proposal, DaoOptions } from "./dao/index.js"

// Plugin types
export type { MCPPlugin, PlanEnvelope, ExecutionContext, ResultEnvelope } from "./plugins/types.js"

// Runtime engine
export { PluginEngine } from "./runtime/engine.js"

// DAGMO client
export { DagmoClient, DEFAULT_WORKER_URL } from "./dagmo/client.js"
export type { CreateBountyRequest, CreateBountyResponse } from "./dagmo/client.js"
