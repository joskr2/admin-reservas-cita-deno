import type { JSX, ComponentChildren } from "preact";

// Definir las props para el componente Select con tipos más específicos
export interface SelectProps extends JSX.HTMLAttributes<HTMLSelectElement> {
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  children: ComponentChildren;
}

// Estilos base para el select
const baseClasses =
  "block w-full px-3 py-2 pr-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm transition-colors duration-200 dark:bg-gray-700 dark:text-white";

// Estilos específicos por estado
const stateClasses = {
  normal:
    "border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500",
  error:
    "border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-500 dark:focus:border-red-500",
  disabled:
    "bg-gray-100 dark:bg-gray-800 opacity-70 cursor-not-allowed border-gray-200 dark:border-gray-700",
};

export function Select({
  class: className,
  children,
  disabled = false,
  error = false,
  helperText,
  ...props
}: SelectProps) {
  const finalClasses = [
    baseClasses,
    disabled
      ? stateClasses.disabled
      : error
      ? stateClasses.error
      : stateClasses.normal,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div class="w-full">
      <select {...props} class={finalClasses} disabled={disabled}>
        {children}
      </select>
      {helperText && (
        <p
          class={`mt-1 text-xs ${
            error
              ? "text-red-600 dark:text-red-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {helperText}
        </p>
      )}
    </div>
  );
}
