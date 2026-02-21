import type { Ae11Block } from "../core/block.js";

// ---------------------------------------------------------------------------
// Persistence abstraction — platform adapters implement this interface so the
// ledger engine itself stays platform-agnostic.
// ---------------------------------------------------------------------------

export interface LedgerStorageAdapter {
  /** Append a serialised block to durable storage. */
  append(block: Ae11Block): Promise<void>;
  /** Load all blocks in append order. */
  loadAll(): Promise<Ae11Block[]>;
}

// ---------------------------------------------------------------------------
// In-memory no-op adapter (useful for tests / headless usage)
// ---------------------------------------------------------------------------

export class InMemoryStorageAdapter implements LedgerStorageAdapter {
  private readonly _blocks: Ae11Block[] = [];

  async append(block: Ae11Block): Promise<void> {
    this._blocks.push(block);
  }

  async loadAll(): Promise<Ae11Block[]> {
    return [...this._blocks];
  }
}

// ---------------------------------------------------------------------------
// Ledger engine
// ---------------------------------------------------------------------------

export class Ledger {
  /** Seen nonces — replay-protection set. */
  private readonly _nonces = new Set<string>();
  private readonly _blocks: Ae11Block[] = [];

  constructor(private readonly _storage: LedgerStorageAdapter = new InMemoryStorageAdapter()) {}

  /**
   * Append a block to the ledger.
   * Rejects duplicate nonces (replay protection) and mismatched `prev` links.
   *
   * TODO: Verify block hash and signature before appending.
   */
  async append(block: Ae11Block): Promise<void> {
    if (this._nonces.has(block.nonce)) {
      throw new Error(`Replay detected: nonce ${block.nonce} already seen`);
    }

    const expectedPrev = this._blocks.length === 0 ? "0".repeat(64) : this._blocks[this._blocks.length - 1].hash;
    if (block.prev !== expectedPrev) {
      throw new Error(`Invalid prev link: expected ${expectedPrev}, got ${block.prev}`);
    }

    this._nonces.add(block.nonce);
    this._blocks.push(block);
    await this._storage.append(block);
  }

  /**
   * Verify chain integrity by walking `prev` links.
   * Returns `true` if the chain is intact, `false` otherwise.
   *
   * TODO: Also verify each block's hash and signature.
   */
  verifyChain(): boolean {
    if (this._blocks.length === 0) return true;
    if (this._blocks[0].prev !== "0".repeat(64)) return false;

    for (let i = 1; i < this._blocks.length; i++) {
      if (this._blocks[i].prev !== this._blocks[i - 1].hash) {
        return false;
      }
    }
    return true;
  }

  /**
   * Return the hash of the last epoch-type block, or `null` if none exists.
   *
   * TODO: Compute a Merkle root across epoch blocks for stronger guarantees.
   */
  epochRoot(): string | null {
    for (let i = this._blocks.length - 1; i >= 0; i--) {
      if (this._blocks[i].type === "epoch") {
        return this._blocks[i].hash;
      }
    }
    return null;
  }

  /** Return a read-only snapshot of all blocks. */
  blocks(): readonly Ae11Block[] {
    return this._blocks;
  }
}
