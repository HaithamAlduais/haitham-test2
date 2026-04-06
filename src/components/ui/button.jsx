import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const lightButtonHover =
  "hover:bg-main hover:text-main-foreground hover:border-border";

/** Neo-brutalist press: only on variants that opt in (not `nav` / carousel arrows). */
const neoPress =
  "active:translate-x-boxShadowX active:translate-y-boxShadowY active:shadow-none";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-base text-sm font-base ring-offset-background transition-colors gap-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: cn(
          "border border-border bg-background text-foreground shadow-shadow",
          lightButtonHover,
          neoPress
        ),
        noShadow: cn(
          "border border-border bg-background text-foreground",
          lightButtonHover,
          neoPress
        ),
        /* Back-compat: map legacy shadcn variants to app button styles. */
        outline: cn(
          "border border-border bg-background text-foreground",
          lightButtonHover,
          neoPress
        ),
        ghost: cn(
          "border border-border bg-background text-foreground",
          lightButtonHover,
          neoPress
        ),
        neutral: cn(
          "border border-border bg-background text-foreground shadow-shadow",
          lightButtonHover,
          neoPress
        ),
        reverse: cn(
          "border border-border bg-background text-foreground shadow-shadow",
          lightButtonHover,
          neoPress
        ),
        /** Toolbar / carousel: no shadow, no translate on press */
        nav: cn(
          "border border-border bg-background/90 text-foreground shadow-none",
          lightButtonHover
        ),
        destructive: cn(
          "border border-border bg-background text-foreground shadow-shadow",
          lightButtonHover,
          neoPress
        ),
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
