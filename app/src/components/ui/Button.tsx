import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  const cls =
    variant === "secondary"
      ? "btn btn-secondary"
      : variant === "danger"
        ? "btn btn-danger"
        : "btn";
  return (
    <button type="button" className={`${cls} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
