import React, { ComponentPropsWithoutRef, forwardRef, ReactNode } from "react";

export type InputVariant = "outlined" | "filled" | "underlined" | "ghost";
export type InputSize = "sm" | "md" | "lg";
export type InputColorScheme = "blue" | "indigo" | "red" | "green" | "neutral";

export interface InputProps extends ComponentPropsWithoutRef<"input"> {
  /** Optional label text displayed above the input field */
  label?: ReactNode;
  /** Optional error message displayed below the input field, which also styles the input with a red border */
  error?: string;
  /** Optional helper or description text displayed below the input field */
  helperText?: string;
  /** Optional icon or element to render inside the input field on the left side */
  leftIcon?: ReactNode;
  /** Optional icon or element to render inside the input field on the right side */
  rightIcon?: ReactNode;
  /** Visual style variant */
  variant?: InputVariant;
  /** Size variant controlling padding and font size */
  inputSize?: InputSize;
  /** Focus color scheme */
  colorScheme?: InputColorScheme;
  /** Custom CSS class names applied specifically to the outer container */
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = "outlined",
      inputSize = "md",
      colorScheme = "blue",
      className = "",
      containerClassName = "",
      disabled,
      required,
      id,
      ...props
    },
    ref
  ) => {
    // Generate a unique ID if not provided, for accessibility
    const inputId = id || (label ? `input-${Math.random().toString(36).substring(2, 9)}` : undefined);

    // Active color scheme overrides to red if an error is present
    const activeColorScheme = error ? "red" : colorScheme;

    // Base input classes
    const baseClasses = "w-full outline-none transition-all duration-200 text-sm font-normal";

    // Size-specific classes for padding and rounded corners
    const sizeClasses = {
      sm: `text-xs rounded-lg py-1.5 ${leftIcon ? "pl-9" : "px-3"} ${rightIcon ? "pr-9" : "px-3"}`,
      md: `text-sm rounded-xl py-2.5 ${leftIcon ? "pl-11" : "px-4"} ${rightIcon ? "pr-11" : "px-4"}`,
      lg: `text-sm rounded-2xl py-3 ${leftIcon ? "pl-12" : "px-4"} ${rightIcon ? "pr-12" : "px-4"}`,
    };

    // Variant & ColorScheme specific classes
    const colorFocusClasses = {
      blue: {
        outlined: "focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400",
        filled: "focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:focus:bg-neutral-900 dark:focus:border-blue-400 dark:focus:ring-blue-400",
        underlined: "focus:border-blue-500 dark:focus:border-blue-400",
        ghost: "focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:focus:bg-neutral-900 dark:focus:border-blue-400 dark:focus:ring-blue-400"
      },
      indigo: {
        outlined: "focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400",
        filled: "focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:focus:bg-neutral-900 dark:focus:border-indigo-400 dark:focus:ring-indigo-400",
        underlined: "focus:border-indigo-500 dark:focus:border-indigo-400",
        ghost: "focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:focus:bg-neutral-900 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
      },
      red: {
        outlined: "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-red-500 dark:focus:border-red-400 dark:focus:ring-red-400",
        filled: "border-red-500 bg-red-50/10 focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-red-500/50 dark:focus:border-red-400 dark:focus:ring-red-400",
        underlined: "border-red-500 focus:border-red-500 dark:border-red-500",
        ghost: "focus:bg-white border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-red-500 dark:focus:border-red-400 dark:focus:ring-red-400"
      },
      green: {
        outlined: "focus:border-green-500 focus:ring-1 focus:ring-green-500 dark:focus:border-green-400 dark:focus:ring-green-400",
        filled: "focus:bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500 dark:focus:bg-neutral-900 dark:focus:border-green-400 dark:focus:ring-green-400",
        underlined: "focus:border-green-500 dark:focus:border-green-400",
        ghost: "focus:bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500 dark:focus:bg-neutral-900 dark:focus:border-green-400 dark:focus:ring-green-400"
      },
      neutral: {
        outlined: "focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 dark:focus:border-neutral-500 dark:focus:ring-neutral-500",
        filled: "focus:bg-white focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 dark:focus:bg-neutral-900 dark:focus:border-neutral-500 dark:focus:ring-neutral-500",
        underlined: "focus:border-neutral-500 dark:focus:border-neutral-500",
        ghost: "focus:bg-white focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 dark:focus:bg-neutral-900 dark:focus:border-neutral-500 dark:focus:ring-neutral-500"
      }
    };

    const variantClasses = {
      outlined: `bg-white border border-neutral-300 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white ${colorFocusClasses[activeColorScheme].outlined}`,
      filled: `bg-neutral-100/80 border border-transparent hover:bg-neutral-200/50 dark:bg-neutral-800/80 dark:hover:bg-neutral-800/60 dark:text-white ${colorFocusClasses[activeColorScheme].filled}`,
      underlined: `bg-transparent border-b border-neutral-300 dark:border-neutral-700 dark:text-white rounded-none px-1 ${colorFocusClasses[activeColorScheme].underlined}`,
      ghost: `bg-transparent border border-transparent dark:text-white ${colorFocusClasses[activeColorScheme].ghost}`,
    };

    const disabledClasses = "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-50 dark:disabled:bg-neutral-800/50 disabled:hover:bg-neutral-50";

    return (
      <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center justify-center text-neutral-400 dark:text-neutral-500 pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            required={required}
            className={`${baseClasses} ${sizeClasses[inputSize]} ${variantClasses[variant]} ${disabledClasses} ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 flex items-center justify-center text-neutral-400 dark:text-neutral-500 pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1 mt-0.5">
            <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </p>
        )}

        {!error && helperText && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
