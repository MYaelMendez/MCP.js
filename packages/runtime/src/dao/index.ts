import type { Ae11Block } from "../core/block.js"
import { buildBlock } from "../ledger/index.js"
import type { Ledger } from "../ledger/index.js"

export interface Proposal {
  id: string
  title: string
  description: string
  proposer: string
  votes: Map<string, "yes" | "no">
  sealed: boolean
  createdAt: number
}

export interface DaoOptions {
  /** Number of votes required for quorum (default: 1). */
  quorumThreshold?: number
  /** Private key of the DAO engine for sealing blocks. */
  privateKey?: Uint8Array
  /** Ledger instance to record proposal blocks. */
  ledger?: Ledger
}

export class Dao {
  private proposals = new Map<string, Proposal>()
  private readonly quorumThreshold: number
  private readonly privateKey: Uint8Array | undefined
  private readonly ledger: Ledger | undefined

  constructor(options: DaoOptions = {}) {
    this.quorumThreshold = options.quorumThreshold ?? 1
    this.privateKey = options.privateKey
    this.ledger = options.ledger
  }

  /** Create a new proposal. */
  proposal = {
    create: (params: { id: string; title: string; description: string; proposer: string }): Proposal => {
      if (this.proposals.has(params.id)) {
        throw new Error(`Proposal '${params.id}' already exists`)
      }
      const proposal: Proposal = {
        ...params,
        votes: new Map(),
        sealed: false,
        createdAt: Date.now(),
      }
      this.proposals.set(params.id, proposal)
      return proposal
    },

    vote: (params: { proposalId: string; voter: string; vote: "yes" | "no" }): Proposal => {
      const proposal = this.getProposal(params.proposalId)
      if (proposal.sealed) {
        throw new Error(`Proposal '${params.proposalId}' is already sealed`)
      }
      proposal.votes.set(params.voter, params.vote)
      return proposal
    },
  }

  /** Assert quorum is met for a proposal (throws if not). */
  assertQuorum(proposalId: string): void {
    const proposal = this.getProposal(proposalId)
    const yesVotes = Array.from(proposal.votes.values()).filter((v) => v === "yes").length
    if (yesVotes < this.quorumThreshold) {
      throw new Error(
        `Quorum not met for proposal '${proposalId}': ` +
          `${yesVotes} yes votes, need ${this.quorumThreshold}`,
      )
    }
  }

  /**
   * Seal a proposal — enforces quorum before sealing.
   * If a ledger + private key are configured, records a seal block.
   */
  async seal(proposalId: string): Promise<Proposal> {
    this.assertQuorum(proposalId)
    const proposal = this.getProposal(proposalId)
    proposal.sealed = true

    if (this.ledger && this.privateKey) {
      const { encodeDid, getPublicKeyAsync } = await import("../crypto/did.js")
      const publicKey = await getPublicKeyAsync(this.privateKey)

      const block: Omit<Ae11Block, "hash" | "sig"> = {
        $schema: "com.yael.ae11.block",
        $v: "11.0.0",
        type: "seal",
        action: "dao.seal",
        data: { proposalId },
        prev: "0",
        nonce: `seal-${proposalId}-${Date.now()}`,
        ts: Date.now(),
        issuer: encodeDid(publicKey),
      }
      const signed = await buildBlock(block, this.privateKey)
      await this.ledger.append(signed)
    }

    return proposal
  }

  private getProposal(id: string): Proposal {
    const proposal = this.proposals.get(id)
    if (!proposal) {
      throw new Error(`Proposal '${id}' not found`)
    }
    return proposal
  }
}
