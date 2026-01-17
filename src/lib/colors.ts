/**
 * Colores para avatares de participantes
 */

export const PARTICIPANT_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#14B8A6', // teal
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#6366F1', // indigo
  '#06B6D4', // cyan
] as const

/**
 * Obtiene un color aleatorio para un nuevo participante
 */
export function getRandomColor(): string {
  const index = Math.floor(Math.random() * PARTICIPANT_COLORS.length)
  return PARTICIPANT_COLORS[index]
}

/**
 * Obtiene un color basado en índice (para consistencia)
 */
export function getColorByIndex(index: number): string {
  return PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length]
}

/**
 * Obtiene las iniciales de un nombre
 * Ejemplo: "Juan Pérez" -> "JP"
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
