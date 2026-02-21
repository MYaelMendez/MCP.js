export interface PlanEnvelope {
  pluginName: string
  input: unknown
  planId: string
  ts: number
}

export interface ExecutionContext {
  planId: string
  issuer: string
  permissions: string[]
}

export interface ResultEnvelope {
  planId: string
  output: unknown
  success: boolean
  ts: number
}

export interface MCPPlugin {
  manifest: {
    name: string
    version: string
    deterministic: boolean
    permissions: string[]
  }

  plan(input: unknown): Promise<PlanEnvelope>
  execute(plan: PlanEnvelope, ctx: ExecutionContext): Promise<ResultEnvelope>
}
