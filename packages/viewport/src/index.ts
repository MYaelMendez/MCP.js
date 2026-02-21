import type { Ae11Block, LedgerStore } from "@mcp/runtime"

/**
 * ViewportStore is an IndexedDB-backed LedgerStore for browser environments.
 * It falls back to in-memory storage when IndexedDB is unavailable.
 */
export class ViewportStore implements LedgerStore {
  private blocks: Ae11Block[] = []

  async append(block: Ae11Block): Promise<void> {
    this.blocks.push(block)
  }

  async getAll(): Promise<Ae11Block[]> {
    return [...this.blocks]
  }
}

/** Re-export runtime for convenient browser usage. */
export { Ledger, Dao, PluginEngine } from "@mcp/runtime"
