import type { JSX } from "preact";

// Define props, extending standard select element attributes.
type SelectProps = JSX.HTMLAttributes<HTMLSelectElement> & {
  disabled?: boolean;
};

// Base styles for the select element
const baseClasses =
  "block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white";

const disabledClasses =
  "bg-gray-100 dark:bg-gray-800 opacity-70 cursor-not-allowed";

export function Select({
  class: className,
  children,
  disabled,
  ...props
}: SelectProps) {
  const finalClasses = [baseClasses, disabled ? disabledClasses : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <select {...props} class={finalClasses} disabled={disabled}>
      {children}
    </select>
  );
}
