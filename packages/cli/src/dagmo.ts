import { DagmoClient } from "@mcp/runtime"
import type { CreateBountyResponse } from "@mcp/runtime"

export interface DagmoBountyCreateOptions {
  repo: string
  title: string
  reward: number
  description?: string
  labels: string[]
  workerUrl: string
  pretty: boolean
}

export async function runDagmoBountyCreate(opts: DagmoBountyCreateOptions): Promise<void> {
  const client = new DagmoClient({ workerUrl: opts.workerUrl })

  let result: CreateBountyResponse
  try {
    result = await client.createBounty({
      repo: opts.repo,
      title: opts.title,
      reward: opts.reward,
      description: opts.description ?? null,
      labels: opts.labels,
    })
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : String(err))
    process.exit(1)
  }

  if (opts.pretty) {
    console.log(`✅ Bounty created!`)
    console.log(`   Title:  ${result.title}`)
    console.log(`   Reward: ${result.reward}`)
    console.log(`   Issue:  ${result.issue_url} (#${result.issue_number})`)
    console.log(`   Status: ${result.status}`)
  } else {
    console.log(JSON.stringify(result))
  }
}
