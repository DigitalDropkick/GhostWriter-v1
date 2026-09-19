import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "./button";
import type { ReactNode } from "react";

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="no-print fixed inset-0 z-40 bg-ink/40" />
        <Dialog.Content
          aria-describedby={undefined}
          className="no-print fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-lg bg-paper p-6 shadow-2xl sm:p-8"
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <Dialog.Title className="font-serif text-3xl text-ink">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <Button size="md" variant="quiet">
                Close
              </Button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
