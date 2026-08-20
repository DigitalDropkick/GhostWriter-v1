import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { GettingStartedSheet } from "@/components/getting-started-sheet";
import { Button } from "@/components/ui/button";

type StartSearch = {
  url?: string;
};

export const Route = createFileRoute("/start")({
  validateSearch: (search: Record<string, unknown>): StartSearch => ({
    url: typeof search.url === "string" && search.url.trim() ? search.url.trim() : undefined,
  }),
  component: StartPage,
  head: () => ({
    meta: [{ title: "Getting started · Ghostwriter" }],
  }),
});

function StartPage() {
  const { url } = Route.useSearch();

  return (
    <div className="getting-started-page paper-grain min-h-dvh">
      <div className="no-print mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-lg text-ink-soft underline-offset-4 hover:text-ink hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to the writing room
        </Link>
        <div className="flex flex-wrap gap-2">
          <a href="/getting-started.html" target="_blank" rel="noreferrer">
            <Button size="md" variant="secondary">
              Open print sheet
            </Button>
          </a>
          <a href="/getting-started.pdf" download>
            <Button size="md" variant="secondary">
              Download PDF
            </Button>
          </a>
          <Button
            size="md"
            onClick={() => {
              window.open("/getting-started.html", "_blank", "noopener");
            }}
          >
            <Printer className="size-4" />
            Print this sheet
          </Button>
        </div>
      </div>
      <GettingStartedSheet address={url} />
      <p className="no-print mx-auto max-w-3xl px-5 pb-10 pt-6 text-base text-ink-faint">
        Print it on ordinary letter paper and leave it beside the laptop. If you
        already have the live address, add it to this page as{" "}
        <code className="text-ink">/start?url=https://…</code> and it will fill
        in the blank.
      </p>
    </div>
  );
}
