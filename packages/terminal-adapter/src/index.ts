import type { Ledger } from "@mcp/viewport"

/**
 * TerminalAdapter bridges the MCP viewport to an xterm.js Terminal instance.
 * Accepts a duck-typed terminal to avoid a hard xterm dependency in type declarations.
 */
export interface XtermLike {
  writeln(data: string): void
  onData(handler: (data: string) => void): void
}

export class TerminalAdapter {
  constructor(
    private readonly terminal: XtermLike,
    private readonly ledger: Ledger,
  ) {}

  /** Write a line to the xterm terminal. */
  write(line: string): void {
    this.terminal.writeln(line)
  }

  /** Display the current epoch root hash in the terminal. */
  async showEpochRoot(): Promise<void> {
    const root = await this.ledger.epochRoot()
    this.terminal.writeln(`Epoch root: ${root}`)
  }
}
