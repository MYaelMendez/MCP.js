import { describe, it, expect, beforeEach } from "vitest"
import { Ledger, MemoryLedgerStore, buildBlock } from "../ledger/index.js"
import { generateKeyPair, encodeDid } from "../crypto/did.js"
import type { Ae11Block } from "../core/block.js"

async function makeBlock(
  params: {
    nonce: string
    prev: string
    privateKey: Uint8Array
    issuer: string
    type?: Ae11Block["type"]
  }
): Promise<Ae11Block> {
  const envelope: Omit<Ae11Block, "hash" | "sig"> = {
    $schema: "com.yael.ae11.block",
    $v: "11.0.0",
    type: params.type ?? "event",
    action: "test.action",
    data: { value: 42 },
    prev: params.prev,
    nonce: params.nonce,
    ts: 1000000,
    issuer: params.issuer,
  }
  return buildBlock(envelope, params.privateKey)
}

describe("ledger", () => {
  let store: MemoryLedgerStore
  let ledger: Ledger
  let privateKey: Uint8Array
  let issuer: string

  beforeEach(async () => {
    store = new MemoryLedgerStore()
    ledger = new Ledger(store)
    const kp = await generateKeyPair()
    privateKey = kp.privateKey
    issuer = encodeDid(kp.publicKey)
  })

  it("append + verifyChain succeeds for a valid chain", async () => {
    const b1 = await makeBlock({ nonce: "n1", prev: "0", privateKey, issuer })
    const b2 = await makeBlock({ nonce: "n2", prev: b1.hash, privateKey, issuer })
    await ledger.append(b1)
    await ledger.append(b2)
    await expect(ledger.verifyChain()).resolves.toBeUndefined()
  })

  it("verifyChain fails on duplicate nonce (replay attack)", async () => {
    const b1 = await makeBlock({ nonce: "same-nonce", prev: "0", privateKey, issuer })
    const b2 = await makeBlock({ nonce: "same-nonce", prev: b1.hash, privateKey, issuer })
    await ledger.append(b1)
    await ledger.append(b2)
    await expect(ledger.verifyChain()).rejects.toThrow("Replay detected")
  })

  it("verifyChain fails on broken prev linkage", async () => {
    const b1 = await makeBlock({ nonce: "n1", prev: "0", privateKey, issuer })
    const b2 = await makeBlock({ nonce: "n2", prev: "wrong-hash", privateKey, issuer })
    await ledger.append(b1)
    await ledger.append(b2)
    await expect(ledger.verifyChain()).rejects.toThrow("Broken chain")
  })

  it("verifyChain fails when block hash is tampered", async () => {
    const b1 = await makeBlock({ nonce: "n1", prev: "0", privateKey, issuer })
    const tampered = { ...b1, hash: "deadbeef" }
    await ledger.append(tampered)
    await expect(ledger.verifyChain()).rejects.toThrow("Hash mismatch")
  })

  it("epochRoot is deterministic", async () => {
    const b1 = await makeBlock({ nonce: "n1", prev: "0", privateKey, issuer })
    const b2 = await makeBlock({ nonce: "n2", prev: b1.hash, privateKey, issuer })
    await ledger.append(b1)
    await ledger.append(b2)
    const root1 = await ledger.epochRoot()
    const root2 = await ledger.epochRoot()
    expect(root1).toBe(root2)
    expect(typeof root1).toBe("string")
    expect(root1.length).toBeGreaterThan(0)
  })

  it("epochRoot for empty ledger is a stable hash", async () => {
    const root = await ledger.epochRoot()
    expect(typeof root).toBe("string")
  })
})
