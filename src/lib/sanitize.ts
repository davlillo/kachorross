import DOMPurify from 'dompurify'

/**
 * Escapes PostgreSQL/PostgREST ILIKE wildcard characters so a search string
 * is matched literally. Escapes backslash, percent and underscore.
 */
export function escapeILike(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
}

/**
 * Validates a password against the clinic's security policy.
 * Requires at least 8 characters, one uppercase, one lowercase,
 * one digit and one special character.
 */
export function validatePassword(pw: string): { ok: boolean; reason: string | null } {
  if (pw.length < 8) {
    return { ok: false, reason: 'La contraseña debe tener al menos 8 caracteres.' }
  }
  if (!/[A-Z]/.test(pw)) {
    return { ok: false, reason: 'La contraseña debe incluir al menos una mayúscula.' }
  }
  if (!/[a-z]/.test(pw)) {
    return { ok: false, reason: 'La contraseña debe incluir al menos una minúscula.' }
  }
  if (!/[0-9]/.test(pw)) {
    return { ok: false, reason: 'La contraseña debe incluir al menos un número.' }
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) {
    return { ok: false, reason: 'La contraseña debe incluir al menos un carácter especial.' }
  }
  return { ok: true, reason: null }
}

/**
 * Sanitizes untrusted HTML to a strict allow-list of formatting tags.
 * All attributes are removed to mitigate stored XSS via tratamiento fields.
 */
export function sanitizeHTML(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'br', 'p', 'strong', 'em'],
    ALLOWED_ATTR: [],
  })
}
