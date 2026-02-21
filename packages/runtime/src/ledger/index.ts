import type { Ae11Block } from "../core/block.js"
import { stableStr } from "../core/stableStr.js"
import { verify } from "../crypto/did.js"
import { decodeDid } from "../crypto/did.js"

/**
 * Abstracted persistence interface — implementations provide storage
 * (e.g. in-memory, IndexedDB, SQLite) without importing DOM or fs directly.
 */
export interface LedgerStore {
  append(block: Ae11Block): Promise<void>
  getAll(): Promise<Ae11Block[]>
}

/**
 * In-memory ledger store for use in tests and pure environments.
 */
export class MemoryLedgerStore implements LedgerStore {
  private blocks: Ae11Block[] = []

  async append(block: Ae11Block): Promise<void> {
    this.blocks.push(block)
  }

  async getAll(): Promise<Ae11Block[]> {
    return [...this.blocks]
  }
}

/** SHA-256 hash via Web Crypto (isomorphic: works in Node 16+ and browsers). */
async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Build the canonical envelope object that is hashed and signed.
 * The hash and sig fields are excluded from the envelope.
 */
function toEnvelope(block: Ae11Block): Omit<Ae11Block, "hash" | "sig"> {
  const { hash: _hash, sig: _sig, ...envelope } = block
  return envelope
}

export class Ledger {
  constructor(private readonly store: LedgerStore) {}

  /** Append a block to the ledger store. */
  async append(block: Ae11Block): Promise<void> {
    await this.store.append(block)
  }

  /**
   * Verify the entire chain:
   * - nonce replay protection
   * - prev linkage
   * - recomputed hash matches stored hash
   * - signature verifies
   * Fails fast on first error.
   */
  async verifyChain(): Promise<void> {
    const blocks = await this.store.getAll()
    const seenNonces = new Set<string>()
    let prevHash = "0"

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i]

      // Nonce replay protection
      if (seenNonces.has(block.nonce)) {
        throw new Error(`Replay detected: duplicate nonce '${block.nonce}' at index ${i}`)
      }
      seenNonces.add(block.nonce)

      // Prev linkage
      if (block.prev !== prevHash) {
        throw new Error(
          `Broken chain at index ${i}: expected prev='${prevHash}' but got '${block.prev}'`,
        )
      }

      // Recompute hash
      const envelope = toEnvelope(block)
      const expectedHash = await sha256(stableStr(envelope))
      if (block.hash !== expectedHash) {
        throw new Error(
          `Hash mismatch at index ${i}: expected '${expectedHash}' but got '${block.hash}'`,
        )
      }

      // Verify signature
      const publicKey = decodeDid(block.issuer)
      const encoder = new TextEncoder()
      const msgBytes = encoder.encode(block.hash)
      const sigBytes = hexToBytes(block.sig)
      const valid = await verify(msgBytes, sigBytes, publicKey)
      if (!valid) {
        throw new Error(`Invalid signature at index ${i} (issuer: ${block.issuer})`)
      }

      prevHash = block.hash
    }
  }

  /**
   * Compute a deterministic epoch root hash over all block hashes
   * using a simple hash-chain (fold left).
   */
  async epochRoot(): Promise<string> {
    const blocks = await this.store.getAll()
    if (blocks.length === 0) {
      return await sha256("empty")
    }
    let acc = blocks[0].hash
    for (let i = 1; i < blocks.length; i++) {
      acc = await sha256(acc + blocks[i].hash)
    }
    return acc
  }
}

/** Build a signed Ae11Block ready for appending. */
export async function buildBlock(
  params: Omit<Ae11Block, "hash" | "sig">,
  privateKey: Uint8Array,
): Promise<Ae11Block> {
  const hash = await sha256(stableStr(params))
  const encoder = new TextEncoder()
  const { sign } = await import("../crypto/did.js")
  const sigBytes = await sign(encoder.encode(hash), privateKey)
  const sig = bytesToHex(sigBytes)
  return { ...params, hash, sig }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function hexToBytes(hex: string): Uint8Array {
  const result = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    result[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return result
}
