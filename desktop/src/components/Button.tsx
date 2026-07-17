import { ComponentProps } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "ghost";

export const Button = ({
  children,
  onClick,
  className = "",
  variant,
  varient = "primary",
  ...props
}: ComponentProps<"button"> & {
  variant?: ButtonVariant;
  varient?: ButtonVariant;
}) => {
  const activeVariant = variant || varient;

  const variantClasses = {
    primary:
      "px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white dark:bg-primary-600 dark:hover:bg-primary-700 transition-colors rounded-xl font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
    secondary:
      "px-4 py-2.5 bg-tertiary-200/60 hover:bg-tertiary-200 text-primary-900 dark:bg-primary-800 dark:hover:bg-primary-700 dark:text-tertiary-100 transition-colors rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed",
    danger:
      "px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800 transition-colors rounded-xl font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
    success:
      "px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800 transition-colors rounded-xl font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
    ghost:
      "p-2 text-neutral-500 hover:text-primary-800 hover:bg-tertiary-100/80 dark:text-neutral-400 dark:hover:text-tertiary-100 dark:hover:bg-primary-800/60 transition-colors rounded-xl",
  };

  return (
    <button
      onClick={onClick}
      className={`${variantClasses[activeVariant]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
};