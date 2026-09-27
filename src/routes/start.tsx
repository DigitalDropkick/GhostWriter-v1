import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { GettingStartedSheet } from "@/components/getting-started-sheet";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/start")({
  component: StartPage,
  head: () => ({
    meta: [{ title: "Getting started · Ghostwriter" }],
  }),
});

function StartPage() {

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
          <a className="guide-link" href="/getting-started.html" target="_blank" rel="noreferrer">Open print sheet</a>
          <a className="guide-link" href="/getting-started.pdf" download>Download PDF</a>
          <Button
            size="md"
            onClick={() => {
              window.print();
            }}
          >
            <Printer className="size-4" />
            Print this sheet
          </Button>
        </div>
      </div>
      <GettingStartedSheet />
      <p className="no-print mx-auto max-w-3xl px-5 pb-10 pt-6 text-base text-ink-faint">
        Print it on ordinary letter paper and keep it near your writing spot. Your books stay on the device where you wrote them. Use a backup to move them to another device.
      </p>
    </div>
  );
}
