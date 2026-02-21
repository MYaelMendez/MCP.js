/**
 * @mcp/viewport — browser surface for MCP.js
 *
 * Provides a thin browser-only wrapper around the runtime engine.
 * May optionally render terminal output via @mcp/terminal-adapter, but
 * the viewport itself depends only on @mcp/runtime, never the reverse.
 *
 * TODO:
 *  - Mount a visible DOM element and bind it to runtime plan/event stream.
 *  - Optionally delegate terminal rendering to @mcp/terminal-adapter.
 */

import { PluginEngine, Ledger, DAO } from "@mcp/runtime";

export interface ViewportOptions {
  /** DOM element to mount the viewport into. */
  container: HTMLElement;
  /** Total number of eligible DAO voters. */
  voterCount?: number;
}

export class Viewport {
  readonly engine: PluginEngine;
  readonly ledger: Ledger;
  readonly dao: DAO;

  private readonly _container: HTMLElement;

  constructor(options: ViewportOptions) {
    this._container = options.container;
    this.engine = new PluginEngine();
    this.ledger = new Ledger();
    this.dao = new DAO(options.voterCount ?? 0, this.ledger);
  }

  /**
   * Mount the viewport into the container element.
   * TODO: Render runtime state (plan queue, ledger tail, DAO status).
   */
  mount(): void {
    this._container.innerHTML = "";
    const root = document.createElement("div");
    root.className = "mcp-viewport";
    root.textContent = "MCP.js viewport — connected to runtime";
    this._container.appendChild(root);
  }

  /** Unmount and clean up resources. */
  dispose(): void {
    this._container.innerHTML = "";
  }
}
