import { describe, it, expect } from "vitest"
import { generateKeyPair, sign, verify, encodeDid, decodeDid } from "../crypto/did.js"

describe("crypto/did", () => {
  it("verify(sign(msg)) === true", async () => {
    const { privateKey, publicKey } = await generateKeyPair()
    const msg = new TextEncoder().encode("hello mcp")
    const sig = await sign(msg, privateKey)
    const result = await verify(msg, sig, publicKey)
    expect(result).toBe(true)
  })

  it("verify fails with wrong message", async () => {
    const { privateKey, publicKey } = await generateKeyPair()
    const msg = new TextEncoder().encode("hello mcp")
    const sig = await sign(msg, privateKey)
    const wrong = new TextEncoder().encode("wrong message")
    const result = await verify(wrong, sig, publicKey)
    expect(result).toBe(false)
  })

  it("verify fails with wrong key", async () => {
    const { privateKey } = await generateKeyPair()
    const { publicKey: wrongPublicKey } = await generateKeyPair()
    const msg = new TextEncoder().encode("hello mcp")
    const sig = await sign(msg, privateKey)
    const result = await verify(msg, sig, wrongPublicKey)
    expect(result).toBe(false)
  })

  it("encodeDid / decodeDid round-trips", async () => {
    const { publicKey } = await generateKeyPair()
    const did = encodeDid(publicKey)
    expect(did).toMatch(/^did:key:z/)
    const recovered = decodeDid(did)
    expect(recovered).toEqual(publicKey)
  })

  it("decodeDid throws on invalid DID", () => {
    expect(() => decodeDid("not-a-did")).toThrow("Invalid DID:key")
  })
})
