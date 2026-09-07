// ─── Normalize choices ────────────────────────────────────────────────────────
// Backend may return choices in several shapes:
//   { id, value, label }           ← standard
//   { "default": "Uno" }           ← legacy / raw (no explicit id/value)
//   ["Uno", "Dos"]                 ← simple array of strings
// We normalize everything to { id, value, label } so the field renderers are uniform.

export interface NormalizedChoice { id: number; value: string; label: unknown }

export function normalizeChoices(raw: unknown[]): NormalizedChoice[] {
  return raw.map((c, i) => {
    if (typeof c === 'string') return { id: i, value: c, label: c }
    if (c && typeof c === 'object') {
      const obj = c as Record<string, unknown>
      // Standard shape
      if ('value' in obj) {
        const v = String(obj.value) || `option_${i}`
        return { id: (obj.id as number) ?? i, value: v, label: obj.label ?? obj.value }
      }
      // Legacy shape: { "default": "...", "es": "...", ... } — use the whole object as label so resolveLocalized can pick the right key
      return { id: i, value: String(obj['default'] ?? i), label: obj }
    }
    return { id: i, value: String(c), label: String(c) }
  })
}
