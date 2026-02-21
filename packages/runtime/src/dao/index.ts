import type { Ae11Block } from "../core/block.js";
import type { Ledger } from "../ledger/index.js";

// ---------------------------------------------------------------------------
// DAO types
// ---------------------------------------------------------------------------

export type ProposalStatus = "open" | "passed" | "rejected" | "sealed";

export interface Proposal {
  id: string;
  description: string;
  proposer: string;
  /** Required fraction of registered voters, e.g. 0.51 = simple majority. */
  quorumThreshold: number;
  votes: Vote[];
  status: ProposalStatus;
  createdAt: number;
}

export interface Vote {
  voter: string;
  choice: "yes" | "no" | "abstain";
  ts: number;
}

// ---------------------------------------------------------------------------
// DAO engine
// ---------------------------------------------------------------------------

export class DAO {
  private readonly _proposals = new Map<string, Proposal>();
  /** Total number of eligible voters used to compute quorum. */
  private _voterCount: number;

  constructor(voterCount: number, private readonly _ledger: Ledger) {
    this._voterCount = voterCount;
  }

  /** Set total eligible voter count (e.g. after membership changes). */
  setVoterCount(count: number): void {
    this._voterCount = count;
  }

  // -------------------------------------------------------------------------
  // proposal.create
  // -------------------------------------------------------------------------

  /** Create a new proposal. Returns the proposal id. */
  createProposal(
    id: string,
    description: string,
    proposer: string,
    quorumThreshold = 0.51
  ): Proposal {
    if (this._proposals.has(id)) {
      throw new Error(`Proposal already exists: ${id}`);
    }
    const proposal: Proposal = {
      id,
      description,
      proposer,
      quorumThreshold,
      votes: [],
      status: "open",
      createdAt: Date.now(),
    };
    this._proposals.set(id, proposal);
    return proposal;
  }

  // -------------------------------------------------------------------------
  // proposal.vote
  // -------------------------------------------------------------------------

  /** Cast a vote on an open proposal. */
  vote(proposalId: string, voter: string, choice: Vote["choice"]): void {
    const proposal = this._getOpen(proposalId);
    const alreadyVoted = proposal.votes.some((v) => v.voter === voter);
    if (alreadyVoted) {
      throw new Error(`Voter ${voter} has already voted on proposal ${proposalId}`);
    }
    proposal.votes.push({ voter, choice, ts: Date.now() });
    this._updateStatus(proposal);
  }

  // -------------------------------------------------------------------------
  // Quorum gate (seal gating)
  // -------------------------------------------------------------------------

  /**
   * Assert that the proposal has reached quorum before a seal block may be
   * appended to the ledger.  Throws if quorum has not been met.
   *
   * TODO: Commit a `vote` block to the ledger for every vote cast so the DAO
   * state can be fully reconstructed from the chain.
   */
  assertQuorum(proposalId: string): void {
    const proposal = this._proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Unknown proposal: ${proposalId}`);
    }
    if (!this._hasQuorum(proposal)) {
      throw new Error(
        `Quorum not met for proposal ${proposalId}: ` +
          `${proposal.votes.length}/${this._voterCount} votes, ` +
          `threshold ${proposal.quorumThreshold}`
      );
    }
  }

  /** Return a read-only view of a proposal. */
  getProposal(proposalId: string): Proposal | undefined {
    return this._proposals.get(proposalId);
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private _getOpen(proposalId: string): Proposal {
    const proposal = this._proposals.get(proposalId);
    if (!proposal) throw new Error(`Unknown proposal: ${proposalId}`);
    if (proposal.status !== "open") throw new Error(`Proposal ${proposalId} is not open`);
    return proposal;
  }

  private _hasQuorum(proposal: Proposal): boolean {
    if (this._voterCount === 0) return false;
    const yesVotes = proposal.votes.filter((v) => v.choice === "yes").length;
    return yesVotes / this._voterCount >= proposal.quorumThreshold;
  }

  private _updateStatus(proposal: Proposal): void {
    if (this._hasQuorum(proposal)) {
      proposal.status = "passed";
    }
  }
}
