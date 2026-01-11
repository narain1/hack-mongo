import { useMemo, useState } from "react";

import type { Balance, Expense, Settlement } from "@/types/split";

function round(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function useSplits(initialExpenses: Expense[] = []) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

  const addExpense = (expense: Omit<Expense, "id">) => {
    setExpenses((prev) => [
      ...prev,
      {
        ...expense,
        id: crypto.randomUUID(),
        currency: expense.currency || "USD",
      },
    ]);
  };

  const removeExpense = (id: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
  };

  const { settlements, balances } = useMemo<{
    settlements: Settlement[];
    balances: Balance[];
  }>(() => {
    if (!expenses.length) return { settlements: [], balances: [] };

    const balances: Record<string, number> = {};

    expenses.forEach((expense) => {
      const currency = expense.currency || "USD";
      const shareCount = expense.splitBetween.length || 1;
      const share = expense.amount / shareCount;

      // Paid by gets credit for full amount
      balances[expense.paidBy] = (balances[expense.paidBy] || 0) + expense.amount;

      // Each participant owes their share
      expense.splitBetween.forEach((person) => {
        balances[person] = (balances[person] || 0) - share;
      });

      // Ensure currency sticks around for settlements
      balances["__currency"] = currency === "USD" ? 0 : 0;
    });

    const currency = expenses[expenses.length - 1]?.currency || "USD";

    const debtors: { user: string; amount: number }[] = [];
    const creditors: { user: string; amount: number }[] = [];

    Object.entries(balances).forEach(([user, amount]) => {
      if (user === "__currency") return;
      const rounded = round(amount);
      if (rounded > 0.01) {
        creditors.push({ user, amount: rounded });
      } else if (rounded < -0.01) {
        debtors.push({ user, amount: -rounded });
      }
    });

    const results: Settlement[] = [];
    const balanceList: Balance[] = [];

    // Greedy simplify: largest debtor pays largest creditor
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const settleAmount = round(Math.min(debtor.amount, creditor.amount));

      if (settleAmount > 0) {
        results.push({
          from: debtor.user,
          to: creditor.user,
          amount: settleAmount,
          currency,
        });
      }

      debtor.amount = round(debtor.amount - settleAmount);
      creditor.amount = round(creditor.amount - settleAmount);

      if (debtor.amount <= 0.01) i += 1;
      if (creditor.amount <= 0.01) j += 1;
    }

    Object.entries(balances)
      .filter(([user]) => user !== "__currency")
      .forEach(([user, amount]) => {
        const rounded = round(amount);
        if (Math.abs(rounded) <= 0.01) return;
        balanceList.push({
          user,
          amount: rounded,
          currency,
        });
      });

    // Sort balances by amount descending (credits first)
    balanceList.sort((a, b) => b.amount - a.amount);

    return { settlements: results, balances: balanceList };
  }, [expenses]);

  const resetExpenses = () => setExpenses([]);

  return {
    expenses,
    settlements,
    balances,
    addExpense,
    removeExpense,
    resetExpenses,
  };
}

