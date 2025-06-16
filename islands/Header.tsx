import { useEffect, useRef, useState } from "preact/hooks";
import ThemeToggle from "./ThemeToggle.tsx";
import { Icon } from "../components/ui/Icon.tsx";
import type { HeaderProps } from "../types/index.ts";

export default function Header({
  currentPath = "/",
  user,
  showBackButton = false,
  title,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(globalThis.scrollY > 10);
    };

    if (typeof globalThis !== "undefined") {
      globalThis.addEventListener("scroll", handleScroll);
      return () => globalThis.removeEventListener("scroll", handleScroll);
    }

    return undefined;
  }, []);

  // Cerrar menú al hacer clic fuera del header
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen &&
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    // Cerrar menú con tecla Escape
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      // Agregar clase al body para prevenir scroll
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.body.classList.remove("menu-open");
    };
  }, [isMenuOpen]);

  const isAuthenticated = !!user;
  const isHomePage = currentPath === "/";
  const isDashboardPage = currentPath === "/dashboard";
  const isAppointmentsPage = currentPath === "/appointments";
  const isPatientsPage = currentPath.startsWith("/patients");
  const isProfilesPage = currentPath.startsWith("/psychologists");
  const isRoomsPage = currentPath.startsWith("/rooms");

  // Items de navegación
  const navigationItems = [
    {
      href: "/",
      label: "Inicio",
      icon: "home",
      active: isHomePage,
      showWhen: "always" as const,
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: "dashboard",
      active: isDashboardPage,
      showWhen: "authenticated" as const,
    },
    {
      href: "/appointments",
      label: "Citas",
      icon: "calendar",
      active: isAppointmentsPage,
      showWhen: "authenticated" as const,
    },
    {
      href: "/patients",
      label: "Pacientes",
      icon: "user",
      active: isPatientsPage,
      showWhen: "authenticated" as const,
    },
    {
      href: "/psychologists",
      label: "Psicólogos",
      icon: "users",
      active: isProfilesPage,
      showWhen: "authenticated" as const,
    },
    {
      href: "/rooms",
      label: "Salas",
      icon: "briefcase",
      active: isRoomsPage,
      showWhen: "authenticated" as const,
    },
  ];

  // Filtrar items según autenticación y rol
  const visibleItems = navigationItems.filter((item) => {
    if (item.showWhen === "always") return true;
    if (item.showWhen === "authenticated") {
      // Ocultar Dashboard si ya estamos en esa página
      if (item.href === "/dashboard" && isDashboardPage) return false;

      // Solo mostrar Psicólogos a superadmins
      if (item.href === "/psychologists" && user?.role !== "superadmin") {
        return false;
      }

      return isAuthenticated;
    }
    return false;
  });

  const headerClasses = [
    "sticky top-0 z-50 w-full border-b transition-all duration-300",
    isScrolled
      ? "border-gray-300 dark:border-gray-700/80 bg-white dark:bg-gray-900 shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50"
      : "border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 shadow-sm shadow-gray-100/50 dark:shadow-gray-800/50",
  ].join(" ");

  return (
    <>
      {/* Overlay con blur para móvil */}
      {isMenuOpen && (
        <div
          class="fixed inset-0 z-40 md:hidden mobile-menu-overlay animate-fade-in bg-black/40 dark:bg-black/60"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <header ref={headerRef} class={headerClasses}>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16 sm:h-20">
            {/* Logo y título */}
            <div class="flex items-center gap-4">
              {showBackButton && (
                <button
                  type="button"
                  onClick={() => globalThis.history.back()}
                  class="p-2 hover:bg-gray-100 dark:hover:bg-blue-950/50 rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-blue-800"
                  title="Volver"
                >
                  <Icon name="arrow-left" size={20} />
                </button>
              )}

              <a
                href="/"
                class="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <Icon name="logo" size={32} />
                <div class="flex flex-col">
                  <span class="text-xl font-bold text-blue-600 dark:text-blue-400">
                    Horizonte
                  </span>
                  <span class="text-xs text-gray-600 dark:text-gray-400 -mt-1">
                    Clínica
                  </span>
                </div>
              </a>

              {title && (
                <div class="hidden sm:block">
                  <span class="text-lg font-medium text-gray-800 dark:text-gray-300">
                    {title}
                  </span>
                </div>
              )}
            </div>

            {/* Navegación desktop */}
            {isAuthenticated && (
              <nav class="hidden md:flex items-center gap-1">
                {visibleItems.slice(1).map((item) => {
                  const linkClasses = [
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium border border-transparent",
                    item.active
                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-blue-950/30 hover:border-gray-200 dark:hover:border-blue-800",
                  ].join(" ");

                  return (
                    <a key={item.href} href={item.href} class={linkClasses}>
                      <Icon name={item.icon} size={18} />
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </nav>
            )}

            {/* Controles de la derecha */}
            <div class="flex items-center gap-2">
              <ThemeToggle />

              {/* Botón de menú móvil */}
              <button
                type="button"
                title={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
                class="md:hidden menu-button p-2 hover:bg-gray-100 dark:hover:bg-blue-950/50 rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-blue-800"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Icon name={isMenuOpen ? "x" : "menu"} size={24} />
              </button>

              {/* Botones de autenticación desktop */}
              <div class="hidden md:flex items-center gap-2">
                {isAuthenticated
                  ? (
                    <form action="/api/auth/logout" method="post">
                      <button
                        type="submit"
                        class="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors font-medium border border-transparent hover:border-red-200 dark:hover:border-red-800"
                      >
                        <Icon name="logout" size={18} />
                        <span>Salir</span>
                      </button>
                    </form>
                  )
                  : (
                    <a
                      href="/login"
                      class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg border border-blue-600 hover:border-blue-700"
                    >
                      <Icon name="login" size={18} />
                      <span>Inicio de sesión</span>
                    </a>
                  )}
              </div>
            </div>
          </div>

          {/* Menú móvil */}
          {isMenuOpen && (
            <div class="md:hidden mobile-menu-container animate-slide-down py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
              {isAuthenticated && (
                <nav class="flex flex-col gap-2 mb-4">
                  {visibleItems.slice(1).map((item) => {
                    const linkClasses = [
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 w-full text-left font-medium border border-transparent",
                      item.active
                        ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 shadow-sm"
                        : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-blue-950/30 hover:border-gray-200 dark:hover:border-blue-800",
                    ].join(" ");

                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        class={linkClasses}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Icon
                          name={item.icon}
                          size={18}
                          className="flex-shrink-0"
                        />
                        <span>{item.label}</span>
                      </a>
                    );
                  })}
                </nav>
              )}

              {/* Botones de autenticación móvil */}
              <div class="flex flex-col gap-2 px-4">
                {isAuthenticated
                  ? (
                    <form action="/api/auth/logout" method="post">
                      <button
                        type="submit"
                        class="flex items-center gap-2 w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors font-medium text-left border border-transparent hover:border-red-200 dark:hover:border-red-800"
                      >
                        <Icon name="logout" size={18} />
                        <span>Salir</span>
                      </button>
                    </form>
                  )
                  : (
                    <a
                      href="/login"
                      class="flex items-center gap-2 w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-medium text-center justify-center shadow-md hover:shadow-lg border border-blue-600 hover:border-blue-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Icon name="login" size={18} />
                      <span>Inicio de sesión</span>
                    </a>
                  )}
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
