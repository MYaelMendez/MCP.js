import { describe, it, expect, beforeEach } from "vitest"
import { Dao } from "../dao/index.js"

describe("dao", () => {
  let dao: Dao

  beforeEach(() => {
    dao = new Dao({ quorumThreshold: 2 })
  })

  it("assertQuorum throws before quorum is met", () => {
    dao.proposal.create({ id: "p1", title: "Test", description: "desc", proposer: "alice" })
    dao.proposal.vote({ proposalId: "p1", voter: "alice", vote: "yes" })
    expect(() => dao.assertQuorum("p1")).toThrow("Quorum not met")
  })

  it("assertQuorum passes after quorum is met", () => {
    dao.proposal.create({ id: "p1", title: "Test", description: "desc", proposer: "alice" })
    dao.proposal.vote({ proposalId: "p1", voter: "alice", vote: "yes" })
    dao.proposal.vote({ proposalId: "p1", voter: "bob", vote: "yes" })
    expect(() => dao.assertQuorum("p1")).not.toThrow()
  })

  it("seal throws before quorum is met", async () => {
    dao.proposal.create({ id: "p2", title: "Test", description: "desc", proposer: "alice" })
    dao.proposal.vote({ proposalId: "p2", voter: "alice", vote: "yes" })
    await expect(dao.seal("p2")).rejects.toThrow("Quorum not met")
  })

  it("seal succeeds after quorum is met", async () => {
    dao.proposal.create({ id: "p3", title: "Test", description: "desc", proposer: "alice" })
    dao.proposal.vote({ proposalId: "p3", voter: "alice", vote: "yes" })
    dao.proposal.vote({ proposalId: "p3", voter: "bob", vote: "yes" })
    const result = await dao.seal("p3")
    expect(result.sealed).toBe(true)
  })

  it("vote after seal throws", async () => {
    dao.proposal.create({ id: "p4", title: "Test", description: "desc", proposer: "alice" })
    dao.proposal.vote({ proposalId: "p4", voter: "alice", vote: "yes" })
    dao.proposal.vote({ proposalId: "p4", voter: "bob", vote: "yes" })
    await dao.seal("p4")
    expect(() =>
      dao.proposal.vote({ proposalId: "p4", voter: "charlie", vote: "yes" }),
    ).toThrow("already sealed")
  })

  it("assertQuorum throws for unknown proposal", () => {
    expect(() => dao.assertQuorum("unknown")).toThrow("not found")
  })

  it("no votes required when quorumThreshold is 0", async () => {
    const d = new Dao({ quorumThreshold: 0 })
    d.proposal.create({ id: "p5", title: "Test", description: "desc", proposer: "alice" })
    expect(() => d.assertQuorum("p5")).not.toThrow()
    const result = await d.seal("p5")
    expect(result.sealed).toBe(true)
  })
})
