/**
 * Calcula a nova quantidade a partir do valor atual com clamp mínimo de 1.
 */
export function clampQuantity(current: number | string, delta: number): number {
  return Math.max(1, Number(current) + delta);
}
