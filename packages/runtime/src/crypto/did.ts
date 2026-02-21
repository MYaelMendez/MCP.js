import * as ed from "@noble/ed25519";
import { base58btc } from "multiformats/bases/base58";

/** Ed25519 multicodec prefix per did:key spec (0xed, 0x01) */
const ED25519_MULTICODEC_PREFIX = new Uint8Array([0xed, 0x01]);

/** Encode raw Ed25519 public key bytes as a did:key identifier. */
export function publicKeyToDid(publicKey: Uint8Array): string {
  const prefixed = new Uint8Array(ED25519_MULTICODEC_PREFIX.length + publicKey.length);
  prefixed.set(ED25519_MULTICODEC_PREFIX, 0);
  prefixed.set(publicKey, ED25519_MULTICODEC_PREFIX.length);
  return `did:key:${base58btc.encode(prefixed)}`;
}

/** Decode a did:key identifier back to raw Ed25519 public key bytes.
 *  Throws if the DID is not an Ed25519 did:key. */
export function didToPublicKey(did: string): Uint8Array {
  const prefix = "did:key:";
  if (!did.startsWith(prefix)) {
    throw new Error(`Not a did:key DID: ${did}`);
  }
  const encoded = did.slice(prefix.length);
  const prefixed = base58btc.decode(encoded);
  if (prefixed[0] !== ED25519_MULTICODEC_PREFIX[0] || prefixed[1] !== ED25519_MULTICODEC_PREFIX[1]) {
    throw new Error("DID key is not Ed25519 (expected 0xed 0x01 multicodec prefix)");
  }
  return prefixed.slice(ED25519_MULTICODEC_PREFIX.length);
}

/** Sign a message with a raw Ed25519 private key.
 *  Uses @noble/ed25519 exclusively — no WebCrypto / Node crypto fallbacks. */
export async function sign(message: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array> {
  return ed.signAsync(message, privateKey);
}

/** Verify an Ed25519 signature.
 *  Throws if @noble/ed25519 is not available or the key type is unsupported. */
export async function verify(
  message: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array
): Promise<boolean> {
  return ed.verifyAsync(signature, message, publicKey);
}

/** Generate a new Ed25519 key pair.
 *  Returns { privateKey, publicKey } as raw byte arrays. */
export async function generateKeyPair(): Promise<{ privateKey: Uint8Array; publicKey: Uint8Array }> {
  const privateKey = ed.utils.randomSecretKey();
  const publicKey = await ed.getPublicKeyAsync(privateKey);
  return { privateKey, publicKey };
}
