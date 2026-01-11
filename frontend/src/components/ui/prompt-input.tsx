import * as React from "react";
import { ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { useComponentOverride } from "@/lib/componentUtils";
import { Button } from "@/components/ui/button";

export interface PromptInputProps
  extends Omit<React.ComponentProps<"input">, "onSubmit"> {
  onSubmit?: (value: string) => void;
  showSubmitButton?: boolean;
  submitButtonLabel?: string;
}

const PromptInput = React.forwardRef<HTMLInputElement, PromptInputProps>(
  (
    {
      className,
      onSubmit,
      showSubmitButton = true,
      submitButtonLabel,
      onKeyDown,
      disabled,
      ...props
    },
    ref
  ) => {
    const override = useComponentOverride("PromptInput");
    const [value, setValue] = React.useState("");
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Merge refs
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const baseClasses =
      "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

    const handleSubmit = () => {
      const trimmed = value.trim();
      if (!trimmed || disabled) return;
      onSubmit?.(trimmed);
      setValue("");
      inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      onKeyDown?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      props.onChange?.(e);
    };

    const hasText = value.trim().length > 0;

    return (
      <div className="relative flex w-full items-center gap-2">
        <input
          {...props}
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            baseClasses,
            showSubmitButton && "pr-12",
            override?.baseClassName,
            className
          )}
        />
        {showSubmitButton && hasText && (
          <Button
            type="button"
            size="icon"
            className="absolute right-1 h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
            onClick={handleSubmit}
            disabled={disabled}
            aria-label={submitButtonLabel || "Submit"}
          >
            <ArrowUp className="h-4 w-4 text-white" />
          </Button>
        )}
      </div>
    );
  }
);

PromptInput.displayName = "PromptInput";

export { PromptInput };

