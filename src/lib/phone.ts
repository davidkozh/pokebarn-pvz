export function normalizePhone(input: string): string | null {
  // Remove all non-digits
  const digits = input.replace(/\D/g, '')

  // Handle Russian phone formats: remove leading +7, 7, or 8
  let normalized = digits

  if (normalized.startsWith('7') && normalized.length === 11) {
    normalized = normalized.slice(1)
  } else if (normalized.startsWith('8') && normalized.length === 11) {
    normalized = normalized.slice(1)
  }

  // Should be exactly 10 digits and start with 9
  if (normalized.length === 10 && normalized.startsWith('9')) {
    return normalized
  }

  return null
}
