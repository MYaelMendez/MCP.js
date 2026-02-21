export interface Ae11Block {
  $schema: "com.yael.ae11.block"
  $v: "11.0.0"
  type: "plan" | "event" | "seal" | "epoch" | "proposal" | "vote" | "meta"
  action: string
  data: unknown
  prev: string
  nonce: string
  ts: number
  issuer: string
  hash: string
  sig: string
}
