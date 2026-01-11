import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Expense } from "@/types/split";

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants: string[];
  onAdd: (expense: Omit<Expense, "id">) => void;
}

export function AddExpenseDialog({
  open,
  onOpenChange,
  participants,
  onAdd,
}: AddExpenseDialogProps) {
  const defaultPayer = participants[0] ?? "";
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState("USD");
  const [paidBy, setPaidBy] = useState(defaultPayer);
  const [splitBetween, setSplitBetween] = useState<string[]>(participants);
  const [error, setError] = useState<string>("");

  const isValid = useMemo(() => {
    const numericAmount = Number(amount);
    return (
      !!description &&
      numericAmount > 0 &&
      !!paidBy &&
      splitBetween.length > 0
    );
  }, [amount, description, paidBy, splitBetween.length]);

  useEffect(() => {
    if (!open) return;
    setError("");
    setDescription("");
    setAmount("");
    setCurrency("USD");
    setPaidBy(defaultPayer);
    setSplitBetween(participants);
  }, [open, defaultPayer, participants]);

  const toggleParticipant = (name: string) => {
    setSplitBetween((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const numericAmount = Number(amount);

    if (!description) {
      setError("Add a description.");
      return;
    }
    if (!numericAmount || numericAmount <= 0) {
      setError("Enter an amount greater than 0.");
      return;
    }
    if (!paidBy) {
      setError("Choose who paid.");
      return;
    }
    if (!splitBetween.length) {
      setError("Select at least one participant.");
      return;
    }

    onAdd({
      description,
      amount: numericAmount,
      currency,
      paidBy,
      splitBetween,
      date: new Date().toISOString(),
    });

    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur">
      <div className="w-full max-w-lg rounded-xl border bg-card text-card-foreground shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold">Add expense</h3>
            <p className="text-sm text-muted-foreground">
              Split evenly between selected people
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="Close add expense dialog"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Description
            </label>
            <Input
              placeholder="Dinner, hotel, ride..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Amount
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Currency
              </label>
              <Input
                placeholder="USD"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Paid by
              </label>
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {participants.map((person) => (
                    <SelectItem key={person} value={person}>
                      {person}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Split between
              </label>
              <div className="grid grid-cols-1 gap-2">
                {participants.map((person) => {
                  const checked = splitBetween.includes(person);
                  return (
                    <label
                      key={person}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                        checked ? "border-primary/60 bg-primary/5" : "border-border"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={checked}
                        onChange={() => toggleParticipant(person)}
                      />
                      <span>{person}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid}>
              Add expense
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

