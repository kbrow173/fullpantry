import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

// ─── Text Input ────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leadingIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leadingIcon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-fp-text mb-1.5"
          >
            {label}
            {props.required && <span className="text-fp-error ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {leadingIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-fp-text-muted pointer-events-none">
              {leadingIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-10 px-3 rounded-lg text-sm text-fp-text",
              "bg-fp-surface border border-fp-border",
              "placeholder:text-fp-text-muted",
              "transition-colors duration-150",
              "focus:outline-none focus:border-fp-accent focus:ring-2 focus:ring-fp-accent/20",
              error && "border-fp-error focus:border-fp-error focus:ring-fp-error/20",
              !!leadingIcon && "pl-9",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-fp-error">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-fp-text-muted">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

// ─── Textarea ────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-fp-text mb-1.5"
          >
            {label}
            {props.required && <span className="text-fp-error ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "w-full px-3 py-2.5 rounded-lg text-sm text-fp-text",
            "bg-fp-surface border border-fp-border",
            "placeholder:text-fp-text-muted resize-none",
            "transition-colors duration-150",
            "focus:outline-none focus:border-fp-accent focus:ring-2 focus:ring-fp-accent/20",
            error && "border-fp-error focus:border-fp-error focus:ring-fp-error/20",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-fp-error">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-fp-text-muted">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

// ─── Select ────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-fp-text mb-1.5"
          >
            {label}
            {props.required && <span className="text-fp-error ml-0.5">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            "w-full h-10 px-3 rounded-lg text-sm text-fp-text",
            "bg-fp-surface border border-fp-border",
            "transition-colors duration-150 appearance-none",
            "focus:outline-none focus:border-fp-accent focus:ring-2 focus:ring-fp-accent/20",
            error && "border-fp-error",
            !props.value && "text-fp-text-muted",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-fp-error">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-fp-text-muted">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
