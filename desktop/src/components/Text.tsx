import { ReactNode } from "react";

export const Text = ({ children, className, varient = 'xl' }: { children: ReactNode; className?: string, varient?: 'xl' }) => {
    const varientClasses = {
        xl: 'text-xl',
    };

    return (
        <p className={`${varientClasses[varient]} text-neutral-700 dark:text-neutral-300 ${className}`}>
            {children}
        </p>
    )
}
