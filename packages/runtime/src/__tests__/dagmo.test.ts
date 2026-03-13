import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { DagmoClient } from "../dagmo/client.js"

function mockFetch(status: number, body: unknown): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? "OK" : "Error",
      json: async () => body,
      text: async () => JSON.stringify(body),
    }),
  )
}

describe("DagmoClient", () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe("input validation", () => {
    it("throws when repo has no slash", async () => {
      const client = new DagmoClient()
      await expect(
        client.createBounty({ repo: "noslash", title: "T", reward: 10 }),
      ).rejects.toThrow('Invalid repo format: "noslash"')
    })

    it("throws when reward is negative", async () => {
      const client = new DagmoClient()
      await expect(
        client.createBounty({ repo: "owner/repo", title: "T", reward: -1 }),
      ).rejects.toThrow("Invalid reward: -1")
    })

    it("throws when reward is NaN", async () => {
      const client = new DagmoClient()
      await expect(
        client.createBounty({ repo: "owner/repo", title: "T", reward: NaN }),
      ).rejects.toThrow("Invalid reward: NaN")
    })

    it("throws when reward is Infinity", async () => {
      const client = new DagmoClient()
      await expect(
        client.createBounty({ repo: "owner/repo", title: "T", reward: Infinity }),
      ).rejects.toThrow("Invalid reward: Infinity")
    })

    it("throws when title is empty", async () => {
      const client = new DagmoClient()
      await expect(
        client.createBounty({ repo: "owner/repo", title: "   ", reward: 10 }),
      ).rejects.toThrow("title must not be empty")
    })

    it("accepts reward of 0", async () => {
      const responseBody = {
        status: "created",
        issue_url: "https://github.com/owner/repo/issues/1",
        issue_number: 1,
        title: "Fix bug",
        reward: 0,
      }
      mockFetch(200, responseBody)
      const client = new DagmoClient({ workerUrl: "https://example.com" })
      const result = await client.createBounty({ repo: "owner/repo", title: "Fix bug", reward: 0 })
      expect(result.reward).toBe(0)
    })
  })

  describe("HTTP handling", () => {
    it("returns parsed response on success", async () => {
      const responseBody = {
        status: "created",
        issue_url: "https://github.com/owner/repo/issues/42",
        issue_number: 42,
        title: "Add tests",
        reward: 500,
      }
      mockFetch(200, responseBody)
      const client = new DagmoClient({ workerUrl: "https://example.com" })
      const result = await client.createBounty({
        repo: "owner/repo",
        title: "Add tests",
        reward: 500,
        labels: ["help wanted"],
      })
      expect(result.status).toBe("created")
      expect(result.issue_number).toBe(42)
      expect(result.issue_url).toBe("https://github.com/owner/repo/issues/42")
    })

    it("throws with status code on non-2xx response", async () => {
      mockFetch(422, { error: "bad request" })
      const client = new DagmoClient({ workerUrl: "https://example.com" })
      await expect(
        client.createBounty({ repo: "owner/repo", title: "T", reward: 10 }),
      ).rejects.toThrow("DAGMO worker returned 422")
    })

    it("throws with network error message on fetch failure", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new Error("Connection refused")),
      )
      const client = new DagmoClient({ workerUrl: "https://example.com" })
      await expect(
        client.createBounty({ repo: "owner/repo", title: "T", reward: 10 }),
      ).rejects.toThrow("Network error calling https://example.com/v1/bounty/create: Connection refused")
    })

    it("sends correct JSON body", async () => {
      const responseBody = {
        status: "created",
        issue_url: "https://github.com/owner/repo/issues/1",
        issue_number: 1,
        title: "My bounty",
        reward: 250,
      }
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => responseBody,
        text: async () => JSON.stringify(responseBody),
      })
      vi.stubGlobal("fetch", fetchSpy)

      const client = new DagmoClient({ workerUrl: "https://example.com" })
      await client.createBounty({
        repo: "owner/repo",
        title: "My bounty",
        reward: 250,
        description: "Details here",
        labels: ["bug", "bounty"],
      })

      expect(fetchSpy).toHaveBeenCalledOnce()
      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
      expect(url).toBe("https://example.com/v1/bounty/create")
      expect(init.method).toBe("POST")
      const sent = JSON.parse(init.body as string)
      expect(sent).toEqual({
        repo: "owner/repo",
        title: "My bounty",
        reward: 250,
        description: "Details here",
        labels: ["bug", "bounty"],
      })
    })

    it("uses default worker URL when none provided", async () => {
      const fetchSpy = vi.fn().mockRejectedValue(new Error("fail"))
      vi.stubGlobal("fetch", fetchSpy)
      const client = new DagmoClient()
      await expect(
        client.createBounty({ repo: "owner/repo", title: "T", reward: 10 }),
      ).rejects.toThrow()
      const [url] = fetchSpy.mock.calls[0] as [string, RequestInit]
      expect(url).toContain("/v1/bounty/create")
    })
  })
})
