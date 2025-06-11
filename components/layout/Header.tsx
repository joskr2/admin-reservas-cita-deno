import { Icon } from "../ui/Icon.tsx";
import type { HeaderProps } from "../../types/index.ts";

export default function Header({
  currentPath = "/",
  user,
  showBackButton = false,
  title,
}: HeaderProps) {
  const isAuthenticated = !!user;

  return (
    <header class="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 sm:h-20">
          {/* Logo y navegación principal */}
          <div class="flex items-center gap-4 sm:gap-6">
            {showBackButton ? (
              <button
                title="Volver"
                type="button"
                onClick={() => globalThis.history.back()}
                class="p-2 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
              >
                <Icon
                  name="arrow-left"
                  size={20}
                  className="text-gray-600 dark:text-gray-300"
                />
              </button>
            ) : (
              <a href="/" class="flex items-center gap-2 sm:gap-3">
                <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Icon
                    name="heart-handshake"
                    size={28}
                    className="text-white filter brightness-0 invert"
                  />
                </div>
                <div class="hidden sm:block">
                  <h1 class="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Horizonte
                  </h1>
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    Sistema de Citas
                  </p>
                </div>
              </a>
            )}

            {/* Título de página en mobile */}
            {(title || showBackButton) && (
              <div class="sm:hidden">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </h2>
              </div>
            )}
          </div>

          {/* Navegación básica */}
          {isAuthenticated && (
            <nav class="hidden md:flex items-center gap-4">
              <a
                href="/dashboard"
                class={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  currentPath === "/dashboard"
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50"
                    : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                <Icon name="dashboard" size={16} />
                Dashboard
              </a>
              <a
                href="/appointments"
                class={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  currentPath.startsWith("/appointments")
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50"
                    : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                <Icon name="calendar" size={16} />
                Citas
              </a>
              <a
                href="/psychologists"
                class={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  currentPath.startsWith("/psychologists")
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50"
                    : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                <Icon name="users" size={16} />
                Psicólogos
              </a>
            </nav>
          )}

          {/* Usuario */}
          <div class="flex items-center gap-2">
            {isAuthenticated ? (
              <div class="flex items-center gap-3">
                <span class="hidden sm:block text-sm text-gray-700 dark:text-gray-300">
                  {user?.name || user?.email}
                </span>
                <a
                  href="/api/auth/logout"
                  class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Icon name="logout" size={16} className="mr-2" />
                  Salir
                </a>
              </div>
            ) : (
              <a
                href="/login"
                class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <Icon name="login" size={16} className="mr-2" />
                Iniciar Sesión
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
