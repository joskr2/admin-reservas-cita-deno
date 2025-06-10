import type { JSX } from "preact";

// Define the props for the Button component, extending standard button attributes.
type ButtonProps = JSX.HTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
};

// Base styles for all buttons
const baseClasses =
  "inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:ring-offset-gray-800 transition ease-in-out duration-150";

// Variant-specific styles
const variantClasses = {
  primary: "text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500",
  secondary:
    "text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:ring-indigo-500",
  danger: "text-white bg-red-600 hover:bg-red-700 focus:ring-red-500",
};

// Disabled styles
const disabledClasses = "opacity-50 cursor-not-allowed";

export function Button({
  variant = "primary",
  class: className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  // Combine all classes based on props
  const finalClasses = [
    baseClasses,
    variantClasses[variant],
    disabled ? disabledClasses : "",
    className, // Allow custom classes to be passed
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button {...props} class={finalClasses} disabled={disabled}>
      {children}
    </button>
  );
}
