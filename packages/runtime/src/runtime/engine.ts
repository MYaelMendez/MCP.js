import type { MCPPlugin, PlanEnvelope, ResultEnvelope, ExecutionContext } from "../plugins/types.js";

export class PluginEngine {
  /** Explicitly registered plugins — no dynamic require/import. */
  private readonly _plugins = new Map<string, MCPPlugin>();

  /** Register a plugin under its manifest name. */
  register(plugin: MCPPlugin): void {
    const { name } = plugin.manifest;
    if (this._plugins.has(name)) {
      throw new Error(`Plugin already registered: ${name}`);
    }
    this._plugins.set(name, plugin);
  }

  /** Retrieve a registered plugin by name, or throw if not found. */
  get(name: string): MCPPlugin {
    const plugin = this._plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin not found: ${name}`);
    }
    return plugin;
  }

  /** List all registered plugin names. */
  list(): string[] {
    return [...this._plugins.keys()];
  }

  /**
   * Run the plan phase for a named plugin.
   * TODO: Enforce permission checks before calling plan().
   */
  async plan(pluginName: string, input: unknown): Promise<PlanEnvelope> {
    const plugin = this.get(pluginName);
    return plugin.plan(input);
  }

  /**
   * Execute a plan produced by a named plugin.
   * TODO: Sandbox execution; emit result as a ledger block via the DAO layer.
   */
  async execute(pluginName: string, plan: PlanEnvelope, ctx: ExecutionContext): Promise<ResultEnvelope> {
    const plugin = this.get(pluginName);
    return plugin.execute(plan, ctx);
  }
}
