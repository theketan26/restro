"use client";

import { toast, Toast as ToastType } from "react-hot-toast";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface CustomToastProps {
  t: ToastType;
  message: string;
  description?: string;
  variant?: ToastVariant;
  varient?: ToastVariant; // support varient typo
}

export const CustomToast = ({
  t,
  message,
  description,
  variant,
  varient,
}: CustomToastProps) => {
  const activeVariant = variant || varient || "info";

  // Resolve styles based on variant
  const styles = {
    success: {
      border: "border-green-100 dark:border-green-900/30",
      bg: "bg-green-50/90 dark:bg-green-950/20",
      iconBg: "bg-green-100/80 dark:bg-green-950/50",
      icon: (
        <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    error: {
      border: "border-red-100 dark:border-red-900/30",
      bg: "bg-red-50/90 dark:bg-red-950/20",
      iconBg: "bg-red-100/80 dark:bg-red-950/50",
      icon: (
        <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    warning: {
      border: "border-amber-100 dark:border-amber-900/30",
      bg: "bg-amber-50/90 dark:bg-amber-950/20",
      iconBg: "bg-amber-100/80 dark:bg-amber-950/50",
      icon: (
        <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    info: {
      border: "border-blue-100 dark:border-blue-900/30",
      bg: "bg-blue-50/90 dark:bg-blue-950/20",
      iconBg: "bg-blue-100/80 dark:bg-blue-950/50",
      icon: (
        <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };

  const currentStyle = styles[activeVariant];

  return (
    <div
      className={`${
        t.visible ? "animate-enter" : "animate-leave"
      } max-w-md w-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-black/5 dark:ring-white/5 overflow-hidden`}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 p-1.5 rounded-xl ${currentStyle.iconBg}`}>
            {currentStyle.icon}
          </div>
          <div className="ml-3 flex-1 pt-0.5">
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
              {message}
            </p>
            {description && (
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex border-l border-neutral-100 dark:border-neutral-800">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-medium text-neutral-400 hover:text-neutral-500 dark:text-neutral-500 dark:hover:text-neutral-400 focus:outline-none transition duration-150"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export const showToast = (
  message: string,
  options?: {
    description?: string;
    variant?: ToastVariant;
    varient?: ToastVariant; // support varient typo
    duration?: number;
  }
) => {
  const activeVariant = options?.variant || options?.varient || "info";

  return toast.custom(
    (t) => (
      <CustomToast
        t={t}
        message={message}
        description={options?.description}
        variant={activeVariant}
      />
    ),
    {
      duration: options?.duration || 4000,
    }
  );
};
