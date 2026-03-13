/** Placeholder URL — replace via `DAGMO_WORKER_URL` env var or `--worker-url` flag once the Worker subdomain is assigned. */
export const DEFAULT_WORKER_URL = "https://agent-api-worker..workers.dev"

export interface CreateBountyRequest {
  repo: string
  title: string
  reward: number
  description?: string | null
  labels?: string[]
}

export interface CreateBountyResponse {
  status: "created" | string
  issue_url: string
  issue_number: number
  title: string
  reward: number
}

function validateRequest(req: CreateBountyRequest): void {
  if (!req.repo.includes("/")) {
    throw new Error(`Invalid repo format: "${req.repo}" — expected "owner/repo"`)
  }
  if (!Number.isFinite(req.reward) || req.reward < 0) {
    throw new Error(`Invalid reward: ${req.reward} — must be a finite number >= 0`)
  }
  if (!req.title || req.title.trim().length === 0) {
    throw new Error("title must not be empty")
  }
}

export class DagmoClient {
  private baseUrl: string

  constructor(options?: { workerUrl?: string }) {
    this.baseUrl = options?.workerUrl ?? DEFAULT_WORKER_URL
  }

  async createBounty(req: CreateBountyRequest): Promise<CreateBountyResponse> {
    const trimmedTitle = req.title.trim()
    validateRequest({ ...req, title: trimmedTitle })

    const url = `${this.baseUrl}/v1/bounty/create`
    const body: CreateBountyRequest = {
      repo: req.repo,
      title: trimmedTitle,
      reward: req.reward,
      description: req.description ?? null,
      labels: req.labels ?? [],
    }

    let response: Response
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    } catch (err) {
      throw new Error(`Network error calling ${url}: ${err instanceof Error ? err.message : String(err)}`)
    }

    if (!response.ok) {
      let detail = ""
      try {
        detail = await response.text()
      } catch {
        // ignore
      }
      throw new Error(
        `DAGMO worker returned ${response.status} ${response.statusText}${detail ? `: ${detail}` : ""}`,
      )
    }

    return (await response.json()) as CreateBountyResponse
  }
}
