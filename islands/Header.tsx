import { useState, useEffect } from "preact/hooks";

import ThemeToggle from "./ThemeToggle.tsx";

interface HeaderProps {
  currentPath?: string;
  user?: {
    email: string;
    role: "superadmin" | "psychologist";
  } | null;
  showBackButton?: boolean;
  title?: string;
}

export default function Header({
  currentPath = "/",
  user,
  showBackButton = false,
  title,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(globalThis.scrollY > 10);
    };

    if (typeof globalThis !== "undefined") {
      globalThis.addEventListener("scroll", handleScroll);
      return () => globalThis.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const isAuthenticated = !!user;
  const isHomePage = currentPath === "/";
  const isDashboardPage = currentPath === "/dashboard";
  const isAppointmentsPage = currentPath === "/appointments";
  const isNewAppointmentPage = currentPath === "/appointments/new";
  const isProfilesPage = currentPath.startsWith("/admin/profiles");

  // Items de navegación
  const navigationItems = [
    {
      href: "/",
      label: "Inicio",
      icon: () => (
        <img
          src="/icons/home.svg"
          alt="Inicio"
          width={16}
          height={16}
          class="inline-block"
        />
      ),
      active: isHomePage,
      showWhen: "always" as const,
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: () => (
        <img
          src="/icons/bar-chart-3.svg"
          alt="Dashboard"
          width={16}
          height={16}
          class="inline-block"
        />
      ),
      active: isDashboardPage,
      showWhen: "authenticated" as const,
    },
    {
      href: "/appointments",
      label: "Citas",
      icon: () => (
        <img
          src="/icons/calendar.svg"
          alt="Citas"
          width={16}
          height={16}
          class="inline-block"
        />
      ),
      active: isAppointmentsPage,
      showWhen: "authenticated" as const,
    },
    {
      href: "/appointments/new",
      label: "Nueva Cita",
      icon: () => (
        <img
          src="/icons/plus.svg"
          alt="Nueva Cita"
          width={16}
          height={16}
          class="inline-block"
        />
      ),
      active: isNewAppointmentPage,
      showWhen: "authenticated" as const,
    },
    {
      href: "/admin/profiles",
      label: "Usuarios",
      icon: () => (
        <img
          src="/icons/user-plus.svg"
          alt="Usuarios"
          width={16}
          height={16}
          class="inline-block"
        />
      ),
      active: isProfilesPage,
      showWhen: "superadmin" as const,
    },
  ];

  // Filtrar items según autenticación y rol
  const visibleItems = navigationItems.filter((item) => {
    if (item.showWhen === "always") return true;
    if (item.showWhen === "authenticated") return isAuthenticated;
    if (item.showWhen === "superadmin") return user?.role === "superadmin";
    return false;
  });

  const headerClasses = [
    "sticky top-0 z-50 w-full border-b transition-all duration-300",
    isScrolled
      ? "border-gray-200/80 dark:border-gray-700/80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg"
      : "border-gray-200/50 dark:border-gray-700/50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm shadow-sm",
  ].join(" ");

  return (
    <header class={headerClasses}>
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
                <img
                  src="/icons/arrow-left.svg"
                  alt="Volver"
                  width={20}
                  height={20}
                  class="text-gray-600 dark:text-gray-300"
                />
              </button>
            ) : (
              <a href="/" class="flex items-center gap-2 sm:gap-3">
                <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <img
                    src="/icons/heart-handshake.svg"
                    alt="Logo"
                    width={28}
                    height={28}
                    class="text-white"
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

          {/* Navegación desktop */}
          {isAuthenticated && (
            <nav class="hidden md:flex items-center gap-2">
              {visibleItems.slice(1).map((item) => {
                const Icon = item.icon;
                const linkClasses = [
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
                  item.active
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50"
                    : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50",
                ].join(" ");

                return (
                  <a key={item.href} href={item.href} class={linkClasses}>
                    {Icon()}
                    {item.label}
                  </a>
                );
              })}
            </nav>
          )}

          {/* Usuario y menú mobile */}
          <div class="flex items-center gap-2">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Usuario */}
            {isAuthenticated ? (
              <div class="hidden sm:flex items-center gap-3">
                <div class="text-right">
                  <span class="text-gray-700 dark:text-gray-300 text-sm">
                    Bienvenido/a
                  </span>
                  {user?.role === "superadmin" && (
                    <div class="flex items-center gap-1">
                      <span class="text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 px-2 py-0.5 rounded-full font-medium">
                        ✨ Super Admin
                      </span>
                    </div>
                  )}
                </div>
                <a
                  href="/api/auth/logout"
                  class="inline-flex items-center h-10 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-blue-500/25"
                >
                  <img
                    src="/icons/logout.svg"
                    alt="Salir"
                    width={16}
                    height={16}
                    class="mr-2"
                  />
                  Salir
                </a>
              </div>
            ) : (
              <a href="/login">
                <button
                  type="button"
                  class="hidden sm:inline-flex items-center h-10 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-blue-500/25"
                >
                  <img
                    src="/icons/login.svg"
                    alt="Inicio de sesión"
                    width={20}
                    height={20}
                    class="mr-3"
                  />
                  Inicio de sesión
                </button>
              </a>
            )}

            {/* Menú hamburguesa para mobile */}
            <button
              type="button"
              class="md:hidden p-2 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <img
                  src="/icons/x.svg"
                  alt="Cerrar menú"
                  width={20}
                  height={20}
                  class="text-gray-600 dark:text-gray-300"
                />
              ) : (
                <img
                  src="/icons/menu.svg"
                  alt="Abrir menú"
                  width={20}
                  height={20}
                  class="text-gray-600 dark:text-gray-300"
                />
              )}
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        {isMenuOpen && (
          <div class="md:hidden py-4 border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
            {isAuthenticated && (
              <nav class="flex flex-col gap-2 mb-4">
                {visibleItems.slice(1).map((item) => {
                  const Icon = item.icon;
                  const linkClasses = [
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full text-left",
                    item.active
                      ? "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50",
                  ].join(" ");

                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      class={linkClasses}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {Icon()}
                      {item.label}
                    </a>
                  );
                })}
              </nav>
            )}

            {/* Usuario en mobile */}
            {isAuthenticated ? (
              <div class="space-y-3">
                <div class="px-4">
                  <p class="text-gray-700 dark:text-gray-300 text-sm">
                    Bienvenido/a
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                  {user?.role === "superadmin" && (
                    <span class="inline-block mt-1 text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 px-2 py-0.5 rounded-full font-medium">
                      ✨ Super Admin
                    </span>
                  )}
                </div>
                <a
                  href="/api/auth/logout"
                  class="flex items-center justify-center w-full h-10 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <img
                    src="/icons/logout.svg"
                    alt="Salir"
                    width={16}
                    height={16}
                    class="mr-2"
                  />
                  Salir
                </a>
              </div>
            ) : (
              <a href="/login">
                <button
                  type="button"
                  class="flex items-center justify-center w-full h-10 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <img
                    src="/icons/login.svg"
                    alt="Inicio de sesión"
                    width={20}
                    height={20}
                    class="mr-3"
                  />
                  Inicio de sesión
                </button>
              </a>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
