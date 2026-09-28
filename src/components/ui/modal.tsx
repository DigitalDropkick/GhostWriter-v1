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
          className="room-dialog no-print fixed z-50 bg-paper text-ink shadow-2xl"
        >
          <div className="dialog-heading mb-5 flex flex-wrap items-start justify-between gap-3">
            <Dialog.Title className="min-w-0 flex-1 font-serif text-3xl text-ink">{title}</Dialog.Title>
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
