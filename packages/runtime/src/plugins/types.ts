// ---------------------------------------------------------------------------
// Plugin contract types
// ---------------------------------------------------------------------------

export interface PlanEnvelope {
  pluginName: string;
  action: string;
  payload: unknown;
  /** Deterministic hash of (pluginName + action + payload) — set by engine. */
  planHash?: string;
}

export interface ResultEnvelope {
  ok: boolean;
  data: unknown;
  error?: string;
}

export interface ExecutionContext {
  /** DID of the identity authorising the execution. */
  issuer: string;
  /** Unix epoch timestamp (ms). */
  ts: number;
  /** Opaque ledger reference for the triggering plan block. */
  planBlockHash: string;
}

export interface MCPPlugin {
  manifest: {
    name: string;
    version: string;
    /** When `true` the plugin must produce identical output for identical input. */
    deterministic: boolean;
    /** Declared permission scopes required by this plugin. */
    permissions: string[];
  };

  /**
   * Produce a signed, inspectable plan from raw input.
   * Must not have side effects.
   */
  plan(input: unknown): Promise<PlanEnvelope>;

  /**
   * Execute a previously produced plan within the given context.
   * Side effects are expected here.
   */
  execute(plan: PlanEnvelope, ctx: ExecutionContext): Promise<ResultEnvelope>;
}
