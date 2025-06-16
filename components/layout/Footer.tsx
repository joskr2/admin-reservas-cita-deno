import { Icon } from "../ui/Icon.tsx";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer class="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div class="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
          {/* Logo y descripción */}
          <div class="flex items-center space-x-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
              <Icon
                name="heart-handshake"
                size={20}
                className="text-white filter brightness-0 invert"
              />
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-900 dark:text-white">
                Horizonte Clínica
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Sistema de Gestión Psicológica
              </p>
            </div>
          </div>

          {/* Copyright */}
          <div class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <p>© {currentYear} Horizonte.</p>
            <span>Hecho con</span>
            <Icon name="heart" size={14} className="text-red-500" />
            <span>para el bienestar mental</span>
          </div>
        </div>

        {/* Enlaces adicionales */}
        <div class="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
          <div class="flex flex-col items-center justify-center space-y-2 text-xs text-gray-400 dark:text-gray-500 sm:flex-row sm:space-y-0 sm:space-x-6">
            <span>
              Construido con{" "}
              <a
                href="https://fresh.deno.dev"
                target="_blank"
                rel="noopener noreferrer"
                class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Fresh
              </a>{" "}
              y{" "}
              <a
                href="https://deno.com"
                target="_blank"
                rel="noopener noreferrer"
                class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Deno
              </a>
            </span>
            <span class="hidden sm:inline">•</span>
            <span>
              Base de datos:{" "}
              <a
                href="https://deno.com/kv"
                target="_blank"
                rel="noopener noreferrer"
                class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Deno KV
              </a>
            </span>
            <span class="hidden sm:inline">•</span>
            <span>
              Estilos:{" "}
              <a
                href="https://tailwindcss.com"
                target="_blank"
                rel="noopener noreferrer"
                class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Tailwind CSS
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
