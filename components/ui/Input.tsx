import type { JSX } from "preact";

// Define props, extending standard input attributes.
type InputProps = JSX.HTMLAttributes<HTMLInputElement> & {
  disabled?: boolean;
};

// Base styles for the input
const baseClasses =
  "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500";

const disabledClasses =
  "bg-gray-100 dark:bg-gray-800 opacity-70 cursor-not-allowed";

export function Input({ class: className, disabled, ...props }: InputProps) {
  const finalClasses = [baseClasses, disabled ? disabledClasses : "", className]
    .filter(Boolean)
    .join(" ");

  return <input {...props} class={finalClasses} disabled={disabled} />;
}
