import type { Expense } from '@/types'
import type { Debt } from './debts'

export function generateExpenseCSV(
  expenses: Expense[],
  debts: Debt[],
  totalAmount: number,
  eventTitle: string
): string {
  let csv = `Spese — ${eventTitle}\n\n`
  csv += `Descrizione,Importo (€),Pagato da,Diviso tra\n`

  for (const e of expenses) {
    const splitNames = e.split_among.join(' / ')
    csv += `"${e.description}",${e.amount.toFixed(2)},"${e.paid_by}","${splitNames}"\n`
  }

  csv += `\nTotale,${totalAmount.toFixed(2)}\n`
  csv += `\n\nSaldi\n`
  csv += `Da,A,Importo (€)\n`

  for (const d of debts) {
    csv += `"${d.from}","${d.to}",${d.amount.toFixed(2)}\n`
  }

  return csv
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function printExpenseReport(
  expenses: Expense[],
  debts: Debt[],
  totalAmount: number,
  eventTitle: string
) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const html = `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8" />
      <title>Spese — ${eventTitle}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; }
        h1 { font-size: 24px; margin-bottom: 8px; }
        h2 { font-size: 18px; margin-top: 32px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f5f5f5; font-weight: 600; }
        .total { font-weight: 700; font-size: 18px; margin-top: 16px; }
        .debt { padding: 8px 0; }
        .footer { margin-top: 40px; color: #999; font-size: 12px; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <h1>Spese — ${eventTitle}</h1>
      <table>
        <thead>
          <tr>
            <th>Descrizione</th>
            <th>Importo</th>
            <th>Pagato da</th>
            <th>Diviso tra</th>
          </tr>
        </thead>
        <tbody>
          ${expenses
            .map(
              (e) => `
            <tr>
              <td>${e.description}</td>
              <td>€${e.amount.toFixed(2)}</td>
              <td>${e.paid_by}</td>
              <td>${e.split_among.join(', ')}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      <p class="total">Totale: €${totalAmount.toFixed(2)}</p>

      <h2>Riepilogo Saldi</h2>
      ${
        debts.length === 0
          ? '<p>Tutti pari!</p>'
          : debts
              .map(
                (d) =>
                  `<p class="debt">• ${d.from} deve €${d.amount.toFixed(2)} a ${d.to}</p>`
              )
              .join('')
      }

      <p class="footer">Generato da FriendsFest</p>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.onload = () => {
    printWindow.print()
  }
}
