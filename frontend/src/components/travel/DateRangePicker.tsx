import { useState, useEffect, useRef } from "react";
import { Calendar } from "lucide-react";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import "react-day-picker/dist/style.css";

// Helper function to parse date string in local timezone (avoids UTC conversion issues)
function parseLocalDate(dateString: string): Date {
  // Parse the date string as local time (YYYY-MM-DD format)
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

interface DateRangePickerProps {
  value?: { start?: string; end?: string };
  onChange?: (dates: { start?: string; end?: string }) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Add dates",
  className,
  buttonClassName,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(
    value?.start || value?.end
      ? {
          from: value.start ? parseLocalDate(value.start) : undefined,
          to: value.end ? parseLocalDate(value.end) : undefined,
        }
      : undefined
  );

  // Sync selectedRange with value prop
  useEffect(() => {
    if (value?.start || value?.end) {
      setSelectedRange({
        from: value.start ? parseLocalDate(value.start) : undefined,
        to: value.end ? parseLocalDate(value.end) : undefined,
      });
    } else {
      setSelectedRange(undefined);
    }
  }, [value]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleSelect = (range: DateRange | undefined) => {
    setSelectedRange(range);
    if (range?.from && range?.to) {
      // Both dates selected, close the calendar
      onChange?.({
        start: format(range.from, "yyyy-MM-dd"),
        end: format(range.to, "yyyy-MM-dd"),
      });
      setIsOpen(false);
    } else if (range?.from) {
      // Only start date selected
      onChange?.({
        start: format(range.from, "yyyy-MM-dd"),
        end: undefined,
      });
    } else {
      // No dates selected
      onChange?.({ start: undefined, end: undefined });
    }
  };

  const formatDateRange = () => {
    if (!selectedRange?.from) return null;
    
    if (selectedRange.from && selectedRange.to) {
      return `${format(selectedRange.from, "MMM d")} - ${format(selectedRange.to, "MMM d")}`;
    }
    return format(selectedRange.from, "MMM d");
  };

  const dateRangeText = formatDateRange();
  const hasDates = selectedRange?.from || selectedRange?.to;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "h-9 px-3 gap-2 text-sm font-normal hover:bg-background/50",
          hasDates && "bg-background/30",
          buttonClassName
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Calendar className="h-4 w-4 shrink-0" />
        <span className="max-w-[140px] truncate">
          {dateRangeText || placeholder}
        </span>
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-card border border-border rounded-lg shadow-lg p-4">
          <DayPicker
            mode="range"
            selected={selectedRange}
            onSelect={handleSelect}
            numberOfMonths={2}
            disabled={{ before: new Date() }}
            className="rdp"
            classNames={{
              months: "flex flex-col sm:flex-row gap-4",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                "inline-flex items-center justify-center rounded-md",
                "hover:bg-accent hover:text-accent-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md [&:has([aria-selected].rdp-range_middle)]:rounded-none focus-within:relative focus-within:z-20",
              day: cn(
                "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                "hover:bg-accent hover:text-accent-foreground",
                "focus:bg-accent focus:text-accent-foreground",
                "rounded-md transition-colors",
                "[&.rdp-range_middle]:rounded-none"
              ),
              day_range_end: "day-range-end",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground rounded-none",
              day_hidden: "invisible",
            }}
          />
          <div className="flex gap-2 pt-4 border-t mt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                setSelectedRange(undefined);
                onChange?.({ start: undefined, end: undefined });
                setIsOpen(false);
              }}
            >
              Clear
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

