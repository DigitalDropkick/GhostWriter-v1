import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-sans font-bold select-none transition-[background-color,transform,opacity] duration-150 ease-out disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss active:scale-[0.99]",
  {
    variants: {
      variant: {
        primary: "bg-moss text-moss-fg hover:bg-moss-dark",
        secondary:
          "bg-paper text-ink border border-rule hover:bg-paper-deep",
        quiet: "bg-transparent text-ink-soft hover:bg-paper-deep hover:text-ink",
        listen: "bg-listen text-moss-fg hover:opacity-90",
        ink: "bg-ink text-paper hover:opacity-90",
      },
      size: {
        md: "h-12 px-5 text-base rounded-[14px]",
        lg: "h-16 px-7 text-lg rounded-[18px]",
        xl: "h-20 px-8 text-xl rounded-[22px] min-w-[12rem]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "lg",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
