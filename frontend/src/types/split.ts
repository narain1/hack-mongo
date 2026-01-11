export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency?: string;
  paidBy: string;
  splitBetween: string[];
  date?: string;
  note?: string;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
  currency?: string;
}

export interface Balance {
  user: string;
  amount: number;
  currency?: string;
}

export interface SplitState {
  expenses: Expense[];
  settlements: Settlement[];
}

