/**
 * Valida mês no formato YYYY-MM com mês entre 01 e 12.
 */
export function isValidMonth(month: string): boolean {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return false;
  const monthNum = Number(match[2]);
  return monthNum >= 1 && monthNum <= 12;
}
