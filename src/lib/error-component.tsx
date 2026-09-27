import { useEffect } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppErrorComponent({ reset }: ErrorComponentProps) {
  useEffect(() => { console.error("ghostwriter:ui_render_failed"); }, []);
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-paper px-6 py-12 text-center text-ink">
      <TriangleAlert className="size-10 text-moss" aria-hidden="true" />
      <h1 className="font-serif text-3xl">The writing room needs a moment</h1>
      <p role="alert" className="max-w-md text-lg text-ink-soft">
        Something interrupted this page. Your previously saved books have not been replaced.
        Any changes that had not finished saving may still need attention.
      </p>
      <Button onClick={reset}>Try this page again</Button>
      <p className="max-w-md text-base text-ink-soft">
        Keep this window open. If it still will not respond, contact Digital Dropkick before
        reloading or clearing your browser’s data.
      </p>
    </main>
  );
}
