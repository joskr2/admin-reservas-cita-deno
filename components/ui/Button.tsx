import type { JSX } from "preact";
import type { ComponentChildren } from "preact";

// Definir las props para el componente Button con tipos más específicos
export interface ButtonProps
  extends Omit<JSX.HTMLAttributes<HTMLButtonElement>, "size" | "loading"> {
  variant?: "primary" | "secondary" | "danger" | "success" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  children: ComponentChildren;
  type?: "button" | "submit" | "reset";
}

// Estilos base para todos los botones
const baseClasses =
  "inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed";

// Estilos específicos por variante - actualizados para seguir preferencias del usuario
const variantClasses = {
  primary:
    "text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700",
  secondary:
    "text-gray-700 dark:text-gray-200 bg-transparent border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-gray-500",
  danger:
    "text-red-600 dark:text-red-400 bg-transparent border border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:ring-red-500",
  success:
    "text-green-600 dark:text-green-400 bg-transparent border border-green-300 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 focus:ring-green-500",
  outline:
    "text-blue-600 dark:text-blue-400 bg-transparent border border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500",
};

// Estilos específicos por tamaño
const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

export function Button({
  variant = "outline", // Cambiado a outline por defecto
  size = "md",
  class: className,
  children,
  disabled = false,
  loading = false,
  type = "button",
  ...props
}: ButtonProps) {
  // Combinar todas las clases basadas en las props
  const finalClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled || loading ? "opacity-50 cursor-not-allowed" : "",
    className, // Permitir clases personalizadas
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      type={type}
      class={finalClasses}
      disabled={disabled || loading}
    >
      {loading && (
        <svg
          class="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {/* Contenido del botón */}
      {children}
    </button>
  );
}
