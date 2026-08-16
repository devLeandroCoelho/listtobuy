export interface ListData {
  id: string;
  name: string;
  month: string;
  budget: string;
}

export interface ItemData {
  id: string;
  list_id: string;
  name: string;
  quantity: string;
  unit: string;
  completed: string;
  price?: number | string | null;
  category?: string | null;
}

export type ExportScope = 'all' | 'pending';

const CATEGORY_NAMES: Record<string, string> = {
  hortifruti: 'Hortifrúti',
  laticinios: 'Laticínios & Frios',
  carnes: 'Carnes & Açougue',
  padaria: 'Padaria & Confeitaria',
  mercearia: 'Mercearia & Grãos',
  limpeza: 'Limpeza',
  higiene: 'Higiene & Perfumaria',
  bebidas: 'Bebidas',
  outros: 'Outros',
};

function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const normalized = String(value).replace(',', '.').replace(/\s/g, '');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

function formatPrice(price: number | string | null | undefined): string {
  const num = toNumber(price);
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/\u00A0/g, ' ');
}

function getCategoryName(categoryId: string | null | undefined): string {
  if (!categoryId) return 'Sem categoria';
  return CATEGORY_NAMES[categoryId] || 'Outros';
}

function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export function generateCSV(list: ListData, items: ItemData[], scope: ExportScope): string {
  const filteredItems = scope === 'pending' ? items.filter((i) => i.completed === '0') : items;

  const headers = ['nome', 'quantidade', 'unidade', 'preço', 'categoria', 'status'];
  const rows = filteredItems.map((item) => [
    item.name,
    item.quantity,
    item.unit,
    formatPrice(item.price),
    getCategoryName(item.category),
    item.completed === '1' ? 'Comprado' : 'Pendente',
  ]);

  return [headers.join(';'), ...rows.map((row) => row.map(escapeCsvValue).join(';'))].join('\n');
}

export function downloadCSV(list: ListData, items: ItemData[], scope: ExportScope): void {
  const csv = generateCSV(list, items, scope);
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = list.name.replace(/[^a-zA-Z0-9À-ÿ]/g, '_').replace(/_+/g, '_');
  a.download = `${safeName}_${list.month}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generatePDFHTML(list: ListData, items: ItemData[], scope: ExportScope): string {
  const filteredItems = scope === 'pending' ? items.filter((i) => i.completed === '0') : items;
  const completedItems = items.filter((i) => i.completed === '1');
  const totalSpent = completedItems.reduce((sum, item) => sum + toNumber(item.price), 0);
  const budget = toNumber(list.budget);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${list.name} - ${formatMonth(list.month)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #1a1a1a;
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .subtitle { color: #666; margin-bottom: 16px; font-size: 14px; }
    .summary {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .summary-item { flex: 1; text-align: center; }
    .summary-value { font-size: 18px; font-weight: bold; }
    .summary-label { font-size: 12px; color: #666; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    th, td {
      text-align: left;
      padding: 8px;
      border-bottom: 1px solid #e5e5e5;
    }
    th {
      background: #f5f5f5;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .status-pending { color: #d97706; }
    .status-completed { color: #059669; }
    .footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e5e5e5;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>${list.name}</h1>
  <p class="subtitle">${formatMonth(list.month)}${scope === 'pending' ? ' • Apenas pendentes' : ''}</p>
  <div class="summary">
    <div class="summary-item">
      <div class="summary-value">${filteredItems.length}</div>
      <div class="summary-label">${scope === 'pending' ? 'Pendentes' : 'Itens'}</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">${completedItems.length}</div>
      <div class="summary-label">Comprados</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">${formatPrice(totalSpent)}</div>
      <div class="summary-label">Gasto</div>
    </div>
    ${budget > 0 ? `
    <div class="summary-item">
      <div class="summary-value">${formatPrice(budget - totalSpent)}</div>
      <div class="summary-label">Restante</div>
    </div>
    ` : ''}
  </div>
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Qtd</th>
        <th>Un</th>
        <th>Preço</th>
        <th>Categoria</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${filteredItems.map((item) => `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>${item.unit}</td>
          <td>${formatPrice(item.price)}</td>
          <td>${getCategoryName(item.category)}</td>
          <td class="${item.completed === '1' ? 'status-completed' : 'status-pending'}">
            ${item.completed === '1' ? 'Comprado' : 'Pendente'}
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div class="footer">
    <p>Gerado por ListToBuy em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
  </div>
</body>
</html>`;
}

export function printPDF(list: ListData, items: ItemData[], scope: ExportScope): void {
  const html = generatePDFHTML(list, items, scope);
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}
