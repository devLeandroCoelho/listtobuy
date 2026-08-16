/**
 * Valida mês no formato YYYY-MM com mês entre 01 e 12.
 */
export function isValidMonth(month: string): boolean {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return false;
  const monthNum = Number(match[2]);
  return monthNum >= 1 && monthNum <= 12;
}

/**
 * Formata um mês no formato YYYY-MM para o nome localizado,
 * ex.: "2024-08" -> "agosto de 2024".
 */
export function formatMonth(month: string): string {
  if (!month) return '';
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}
