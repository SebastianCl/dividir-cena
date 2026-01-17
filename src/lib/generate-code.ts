import { customAlphabet } from 'nanoid'

// Alfabeto sin caracteres confusos (0, O, I, l)
const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZ'

// Genera códigos de 6 caracteres
const nanoid = customAlphabet(alphabet, 6)

/**
 * Genera un código corto único para sesiones
 * Ejemplo: "A3B7K9"
 */
export function generateSessionCode(): string {
  return nanoid()
}

/**
 * Valida formato de código de sesión
 */
export function isValidSessionCode(code: string): boolean {
  const pattern = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/
  return pattern.test(code.toUpperCase())
}
