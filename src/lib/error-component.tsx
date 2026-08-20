import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 text-center text-ink">
      <span className="text-moss" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="font-serif text-2xl">Something went wrong</h1>
      <p className="max-w-md text-lg break-words text-ink-soft">
        {error.message || "An unexpected error occurred. Try reloading the page."}
      </p>
    </main>
  );
}
