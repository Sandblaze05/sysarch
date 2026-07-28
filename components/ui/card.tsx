import * as React from "react";

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={joinClasses(
      "rounded-lg border border-[#E1E0CC]/12 bg-[#202020] text-[#E1E0CC] shadow-2xl shadow-black/20",
      className
    )}
    {...props}
  />
));

Card.displayName = "Card";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={joinClasses("p-6", className)} {...props} />
));

CardContent.displayName = "CardContent";
