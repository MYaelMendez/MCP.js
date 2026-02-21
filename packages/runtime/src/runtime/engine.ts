import type { MCPPlugin, PlanEnvelope, ExecutionContext, ResultEnvelope } from "../plugins/types.js"

export class PluginEngine {
  private readonly plugins = new Map<string, MCPPlugin>()

  /** Register a plugin explicitly by name. */
  register(plugin: MCPPlugin): void {
    const name = plugin.manifest.name
    if (this.plugins.has(name)) {
      throw new Error(`Plugin '${name}' is already registered`)
    }
    this.plugins.set(name, plugin)
  }

  /** Unregister a plugin by name. */
  unregister(name: string): void {
    this.plugins.delete(name)
  }

  /** Check whether a plugin is registered. */
  has(name: string): boolean {
    return this.plugins.has(name)
  }

  /** Get a registered plugin by name. */
  get(name: string): MCPPlugin | undefined {
    return this.plugins.get(name)
  }

  /** List all registered plugin manifests. */
  list(): MCPPlugin["manifest"][] {
    return Array.from(this.plugins.values()).map((p) => p.manifest)
  }

  /** Run the plan step of a named plugin. */
  async plan(pluginName: string, input: unknown): Promise<PlanEnvelope> {
    const plugin = this.requirePlugin(pluginName)
    return plugin.plan(input)
  }

  /** Run the execute step of a named plugin. */
  async execute(
    pluginName: string,
    plan: PlanEnvelope,
    ctx: ExecutionContext,
  ): Promise<ResultEnvelope> {
    const plugin = this.requirePlugin(pluginName)
    return plugin.execute(plan, ctx)
  }

  private requirePlugin(name: string): MCPPlugin {
    const plugin = this.plugins.get(name)
    if (!plugin) {
      throw new Error(`Plugin '${name}' is not registered`)
    }
    return plugin
  }
}
