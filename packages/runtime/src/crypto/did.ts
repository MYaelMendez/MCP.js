/**
 * Ed25519 cryptography and DID:key helpers.
 * Uses @noble/ed25519 for signing/verification and multiformats for base58btc encoding.
 */
import * as ed from "@noble/ed25519"
import { base58btc } from "multiformats/bases/base58"

// DID:key multicodec prefix for Ed25519 public keys: 0xed 0x01
const ED25519_MULTICODEC_PREFIX = new Uint8Array([0xed, 0x01])

/** Derive the Ed25519 public key from a private key. */
export async function getPublicKeyAsync(privateKey: Uint8Array): Promise<Uint8Array> {
  return ed.getPublicKeyAsync(privateKey)
}

/**
 * Sign a message with an Ed25519 private key.
 */
export async function sign(message: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array> {
  return ed.signAsync(message, privateKey)
}

/**
 * Verify an Ed25519 signature.
 */
export async function verify(
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array,
): Promise<boolean> {
  try {
    return await ed.verifyAsync(signature, message, publicKey)
  } catch {
    return false
  }
}

/**
 * Generate a new Ed25519 key pair.
 */
export async function generateKeyPair(): Promise<{
  privateKey: Uint8Array
  publicKey: Uint8Array
}> {
  const privateKey = ed.utils.randomPrivateKey()
  const publicKey = await ed.getPublicKeyAsync(privateKey)
  return { privateKey, publicKey }
}

/**
 * Encode a public key as a DID:key string.
 */
export function encodeDid(publicKey: Uint8Array): string {
  const prefixed = new Uint8Array(ED25519_MULTICODEC_PREFIX.length + publicKey.length)
  prefixed.set(ED25519_MULTICODEC_PREFIX, 0)
  prefixed.set(publicKey, ED25519_MULTICODEC_PREFIX.length)
  return "did:key:" + base58btc.encode(prefixed)
}

/**
 * Decode a DID:key string back to a raw Ed25519 public key.
 */
export function decodeDid(did: string): Uint8Array {
  if (!did.startsWith("did:key:")) {
    throw new Error("Invalid DID:key — must start with 'did:key:'")
  }
  const encoded = did.slice("did:key:".length)
  const prefixed = base58btc.decode(encoded)
  if (prefixed[0] !== ED25519_MULTICODEC_PREFIX[0] || prefixed[1] !== ED25519_MULTICODEC_PREFIX[1]) {
    throw new Error("Invalid DID:key — unexpected multicodec prefix")
  }
  return prefixed.slice(ED25519_MULTICODEC_PREFIX.length)
}
