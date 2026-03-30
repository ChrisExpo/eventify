export interface Debt {
  from: string
  to: string
  amount: number
}

export interface ExpenseData {
  amount: number
  paid_by: string
  split_among: string[]
}

export function simplifyDebts(expenses: ExpenseData[]): Debt[] {
  // 1. Calcola saldo netto per persona
  //    Chi paga: +amount. Chi è in split_among: -amount/split_among.length
  const balances = new Map<string, number>()

  for (const expense of expenses) {
    const share = expense.amount / expense.split_among.length

    // Chi ha pagato riceve credito
    balances.set(expense.paid_by, (balances.get(expense.paid_by) || 0) + expense.amount)

    // Chi è nello split deve la sua parte
    for (const person of expense.split_among) {
      balances.set(person, (balances.get(person) || 0) - share)
    }
  }

  // 2. Separa creditori e debitori
  const creditors: { name: string; amount: number }[] = []
  const debtors: { name: string; amount: number }[] = []

  for (const [name, balance] of balances) {
    const rounded = Math.round(balance * 100) / 100
    if (rounded > 0.01) creditors.push({ name, amount: rounded })
    else if (rounded < -0.01) debtors.push({ name, amount: Math.abs(rounded) })
  }

  // 3. Ordina per importo decrescente
  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  // 4. Greedy matching
  const debts: Debt[] = []
  let ci = 0, di = 0

  while (ci < creditors.length && di < debtors.length) {
    const payment = Math.min(creditors[ci].amount, debtors[di].amount)
    if (payment > 0.01) {
      debts.push({
        from: debtors[di].name,
        to: creditors[ci].name,
        amount: Math.round(payment * 100) / 100,
      })
    }
    creditors[ci].amount -= payment
    debtors[di].amount -= payment

    if (creditors[ci].amount < 0.01) ci++
    if (debtors[di].amount < 0.01) di++
  }

  return debts
}

export function totalExpenses(expenses: ExpenseData[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0)
}
