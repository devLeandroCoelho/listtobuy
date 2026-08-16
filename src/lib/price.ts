export function sanitizePriceInput(value: string): string {
  let cleaned = value.replace(/[^0-9.,]/g, '');

  if (cleaned === '' || cleaned === '.' || cleaned === ',') {
    return cleaned;
  }

  if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '');
    const parts = cleaned.split(',');
    if (parts[1] && parts[1].length > 2) {
      cleaned = `${parts[0]},${parts[1].slice(0, 2)}`;
    }
  } else if (cleaned.includes('.')) {
    const lastDotIndex = cleaned.lastIndexOf('.');
    const intPart = cleaned.slice(0, lastDotIndex).replace(/\./g, '');
    const decPart = cleaned.slice(lastDotIndex + 1);
    if (decPart.length > 2) {
      cleaned = `${intPart}.${decPart.slice(0, 2)}`;
    } else {
      cleaned = `${intPart}.${decPart}`;
    }
  }

  const sep = cleaned.includes(',') ? ',' : cleaned.includes('.') ? '.' : null;
  if (sep) {
    const [intPart, decPart] = cleaned.split(sep);
    const trimmedInt = intPart.replace(/^0+/, '') || '0';
    cleaned = `${trimmedInt}${sep}${decPart}`;
  } else {
    cleaned = cleaned.replace(/^0+/, '') || '0';
  }

  return cleaned;
}

export function parsePrice(value: string): number | null {
  if (!value) return null;

  let normalized = value;
  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '');
  }
  normalized = normalized.replace(',', '.');

  const num = Number(normalized);

  if (!Number.isFinite(num) || num < 0 || num > 999999.99) {
    return null;
  }

  return Math.round(num * 100) / 100;
}
