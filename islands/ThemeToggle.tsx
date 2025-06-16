import { useEffect } from "preact/hooks";
import { effect, signal } from "@preact/signals";
import { Icon } from "../components/ui/Icon.tsx";
import type { Theme } from "../types/index.ts";
import { applyTheme, getInitialTheme } from "../utils/theme.ts";

// Signal para mantener el estado actual del tema
const theme = signal<Theme>(getInitialTheme());

// Efecto global que se ejecuta cuando el tema cambia
effect(() => {
  applyTheme(theme.value);
});

export default function ThemeToggle() {
  // Inicializar el tema una vez cuando el componente se monta en el cliente
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Sincronizar con el tema actual del DOM
      const isDark = document.documentElement.classList.contains("dark");
      theme.value = isDark ? "dark" : "light";
    }
  }, []);

  // Función para alternar el valor del signal del tema
  const toggleTheme = () => {
    theme.value = theme.value === "light" ? "dark" : "light";
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Cambiar a modo ${theme.value === "light" ? "oscuro" : "claro"}`}
      class="inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 transition duration-150 ease-in-out"
      aria-label={`Cambiar a modo ${
        theme.value === "light" ? "oscuro" : "claro"
      }`}
    >
      {/* El componente se re-renderiza automáticamente cuando theme.value cambia */}
      <Icon
        name={theme.value === "light" ? "moon" : "sun"}
        size={24}
        className="text-gray-500 dark:text-gray-400"
      />
    </button>
  );
}
