/**
 * Stable canonical stringification for deterministic hashing.
 * Deep-sorts object keys and handles arrays deterministically.
 */
export function stableStr(value: unknown): string {
  if (value === null || value === undefined) {
    return JSON.stringify(value)
  }
  if (typeof value !== "object") {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    const items = value.map((v) => stableStr(v))
    return "[" + items.join(",") + "]"
  }
  const obj = value as Record<string, unknown>
  const sortedKeys = Object.keys(obj).sort()
  const pairs = sortedKeys.map((k) => JSON.stringify(k) + ":" + stableStr(obj[k]))
  return "{" + pairs.join(",") + "}"
}
