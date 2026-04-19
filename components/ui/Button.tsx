import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-fp-accent text-fp-text-inverse hover:bg-fp-accent-hover active:bg-fp-accent-active shadow-sm",
  secondary:
    "bg-fp-surface-2 text-fp-text hover:bg-fp-surface-3 active:bg-fp-border border border-fp-border",
  ghost:
    "bg-transparent text-fp-text-secondary hover:bg-fp-surface-2 active:bg-fp-surface-3",
  danger:
    "bg-fp-error text-fp-text-inverse hover:opacity-90 active:opacity-80 shadow-sm",
  outline:
    "bg-transparent border border-fp-accent text-fp-accent hover:bg-fp-accent-bg active:bg-fp-accent-bg",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm rounded-md gap-1.5",
  md: "h-10 px-4 text-sm rounded-lg gap-2",
  lg: "h-12 px-6 text-base rounded-xl gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium",
          "transition-all duration-150 active:scale-[0.97]",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-fp-accent focus-visible:outline-offset-2",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>Loading…</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
