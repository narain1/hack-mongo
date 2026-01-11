import { Users, Wallet, ArrowRightLeft, CheckCircle2, Scale, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Balance, Expense, Settlement } from "@/types/split";

interface SplitsViewProps {
  expenses: Expense[];
  settlements: Settlement[];
  participants: string[];
  balances: Balance[];
  onDeleteExpense?: (id: string) => void;
}

function formatCurrency(amount: number, currency?: string) {
  const code = currency || "USD";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${code}`;
  }
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function SplitsView({ expenses, settlements, participants, balances, onDeleteExpense }: SplitsViewProps) {
  const currency = expenses[expenses.length - 1]?.currency || "USD";
  const maxAbsBalance = balances.reduce(
    (max, bal) => Math.max(max, Math.abs(bal.amount)),
    0
  );

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-dashed">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Users className="h-4 w-4" />
            People in this trip
          </CardTitle>
          <CardDescription>
            Everyone included in splits and settlements.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {participants.length ? (
            participants.map((person) => (
              <Badge
                key={person}
                variant="secondary"
                className="flex items-center gap-2 rounded-full px-3 py-1"
              >
                <Avatar className="h-6 w-6 border border-border/60">
                  <AvatarFallback className="text-xs font-semibold">
                    {initials(person)}
                  </AvatarFallback>
                </Avatar>
                {person}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No participants yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Scale className="h-4 w-4" />
            Balances
          </CardTitle>
          <CardDescription>
            What each participant paid or is owed (positive = receives, negative = owes).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {balances.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
              No balances yet. Add an expense to see who owes whom.
            </div>
          ) : (
            balances.map((bal) => {
              const width =
                maxAbsBalance > 0 ? `${Math.max((Math.abs(bal.amount) / maxAbsBalance) * 100, 8)}%` : "8%";
              const isPositive = bal.amount > 0;
              return (
                <div
                  key={bal.user}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2"
                >
                  <PersonPill name={bal.user} />
                  <div className="flex-1">
                    <div className="relative h-6 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "absolute left-0 top-0 h-full rounded-full px-2 text-xs font-semibold text-white flex items-center",
                          isPositive ? "bg-emerald-600" : "bg-red-600 justify-end"
                        )}
                        style={{ width }}
                      >
                        {formatCurrency(Math.abs(bal.amount), bal.currency || currency)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Wallet className="h-4 w-4" />
            All expenses
          </CardTitle>
          <CardDescription>Quick snapshot of every added expense.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {expenses.length === 0 && (
            <div className="rounded-lg border border-dashed bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
              No expenses yet. Add one to start splitting.
            </div>
          )}
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex flex-col gap-2 rounded-lg border px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">
                    {expense.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Paid by {expense.paidBy}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(expense.amount, expense.currency || currency)}
                  </p>
                  {onDeleteExpense && (
                    <button
                      type="button"
                      className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted"
                      onClick={() => onDeleteExpense(expense.id)}
                      aria-label="Delete expense"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <Separator />
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                Split between:
                {expense.splitBetween.map((person) => (
                  <Badge key={person} variant="outline" className="rounded-full px-2">
                    {person}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <ArrowRightLeft className="h-4 w-4" />
            Simplified settlements
          </CardTitle>
          <CardDescription>
            Minimal set of transfers to settle balances (like Splitwise).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {settlements.length === 0 ? (
            expenses.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
                Add an expense to see who owes whom.
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-green-200/70 bg-green-50 px-4 py-3 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                All settled. No one owes anything.
              </div>
            )
          ) : (
            settlements.map((settlement, idx) => (
              <div
                key={`${settlement.from}-${settlement.to}-${idx}`}
                className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <PersonPill name={settlement.from} />
                  <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                  <PersonPill name={settlement.to} />
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(settlement.amount, settlement.currency || currency)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PersonPill({ name }: { name: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        "bg-muted/60 text-foreground"
      )}
    >
      <Avatar className="h-6 w-6 border border-border/60">
        <AvatarFallback className="text-[11px] font-semibold">
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      {name}
    </span>
  );
}

