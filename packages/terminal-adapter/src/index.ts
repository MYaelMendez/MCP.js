/**
 * @mcp/terminal-adapter — optional xterm.js ↔ MCP runtime bridge
 *
 * This package is an adapter, not a core dependency.  The runtime does not
 * depend on this package; it is the adapter that depends on the runtime.
 *
 * Usage:
 *   import { TerminalAdapter } from "@mcp/terminal-adapter";
 *   import { Terminal } from "@xterm/xterm";
 *
 *   const term = new Terminal();
 *   const adapter = new TerminalAdapter({ terminal: term, engine, ledger });
 *   adapter.attach(containerEl);
 *
 * TODO:
 *  - Subscribe to runtime plan/event stream and write output to xterm.
 *  - Forward user keystrokes from xterm to the runtime CLI parser.
 */

import type { PluginEngine, Ledger } from "@mcp/runtime";

/** Minimal interface for an xterm.js Terminal-like object.
 *  Declared here so that @xterm/xterm remains an optional peer dependency. */
export interface XtermLike {
  open(container: HTMLElement): void;
  write(data: string | Uint8Array): void;
  onData(listener: (data: string) => void): { dispose(): void };
  dispose(): void;
}

export interface TerminalAdapterOptions {
  terminal: XtermLike;
  engine: PluginEngine;
  ledger: Ledger;
}

export class TerminalAdapter {
  private readonly _terminal: XtermLike;
  private readonly _engine: PluginEngine;
  private readonly _ledger: Ledger;
  private _inputDisposable?: { dispose(): void };

  constructor(options: TerminalAdapterOptions) {
    this._terminal = options.terminal;
    this._engine = options.engine;
    this._ledger = options.ledger;
  }

  /**
   * Open the xterm terminal in the given container and wire up input/output.
   * TODO: Parse user input into MCP commands and dispatch via engine.
   */
  attach(container: HTMLElement): void {
    this._terminal.open(container);
    this._terminal.write("MCP.js terminal ready\r\n$ ");

    this._inputDisposable = this._terminal.onData((data) => {
      // TODO: Route data to the runtime CLI parser.
      this._terminal.write(data);
    });
  }

  /** Detach and clean up. */
  dispose(): void {
    this._inputDisposable?.dispose();
    this._terminal.dispose();
  }
}
