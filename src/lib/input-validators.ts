const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Extrae solo dígitos del teléfono. */
export function telefonoDigitos(value: string): string {
  return value.replace(/\D/g, '');
}

/** Máscara ####-#### (8 dígitos, guion automático). */
export function formatTelefono(value: string): string {
  const digits = telefonoDigitos(value).slice(0, 8);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

export function isTelefonoValid(value: string): boolean {
  return telefonoDigitos(value).length === 8;
}

/** Vacío es válido (campo opcional). */
export function isEmailValid(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return EMAIL_REGEX.test(trimmed);
}

/** Bloquea negativos y caracteres no numéricos (excepto un punto decimal). */
export function formatPeso(value: string): string {
  if (!value) return '';

  let cleaned = value.replace(/[^\d.]/g, '');
  const dotIndex = cleaned.indexOf('.');
  if (dotIndex !== -1) {
    cleaned =
      cleaned.slice(0, dotIndex + 1) +
      cleaned.slice(dotIndex + 1).replace(/\./g, '');
  }

  if (cleaned.startsWith('-')) return '';

  const num = parseFloat(cleaned);
  if (cleaned !== '' && cleaned !== '.' && !Number.isNaN(num) && num < 0) {
    return '0';
  }

  return cleaned;
}

export function isPesoValid(value: string): boolean {
  if (!value.trim()) return true;
  const num = parseFloat(value);
  return !Number.isNaN(num) && num >= 0;
}

export const TELEFONO_PLACEHOLDER = '7777-0000';
export const TELEFONO_MAX_LENGTH = 9;
