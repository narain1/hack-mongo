export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-6 pb-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <div className="h-3 w-3 rounded-full bg-primary/60" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl bg-muted px-4 py-2.5">
        <div className="flex gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" />
        </div>
      </div>
    </div>
  );
}

