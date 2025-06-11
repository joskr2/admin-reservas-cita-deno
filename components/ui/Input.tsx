import type { JSX } from "preact";

// Definir las props para el componente Input con tipos más específicos
export interface InputProps extends JSX.HTMLAttributes<HTMLInputElement> {
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

// Estilos base para el input
const baseClasses =
  "block w-full py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm transition-colors duration-200 dark:bg-gray-700 dark:placeholder-gray-400 dark:text-white";

// Estilos específicos por estado
const stateClasses = {
  normal:
    "border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500",
  error:
    "border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-500 dark:focus:border-red-500",
  disabled:
    "bg-gray-100 dark:bg-gray-800 opacity-70 cursor-not-allowed border-gray-200 dark:border-gray-700",
};

// Función para determinar si se debe aplicar padding horizontal por defecto
const shouldApplyDefaultPadding = (className?: string) => {
  if (!className) return true;
  // Si la clase personalizada incluye padding left o right, no aplicar el padding por defecto
  return !/(^|\s)(pl-|pr-|px-)/i.test(className);
};

export function Input({
  class: className,
  disabled = false,
  error = false,
  helperText,
  ...props
}: InputProps) {
  // Aplicar padding horizontal por defecto solo si no se especifica uno personalizado
  const classNameStr = typeof className === "string" ? className : "";
  const paddingClass = shouldApplyDefaultPadding(classNameStr) ? "px-3" : "";

  const finalClasses = [
    baseClasses,
    paddingClass,
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
      <input {...props} class={finalClasses} disabled={disabled} />
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
