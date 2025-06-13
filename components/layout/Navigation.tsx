import { Icon } from "../ui/Icon.tsx";
import type { SessionUser } from "../../types/index.ts";

interface NavigationItem {
  href: string;
  label: string;
  icon: string;
  active?: boolean;
  badge?: string | number;
  description?: string;
}

interface NavigationProps {
  currentPath: string;
  user: SessionUser | null;
  variant?: "sidebar" | "horizontal" | "mobile";
  className?: string;
}

export default function Navigation({
  currentPath,
  user,
  variant = "horizontal",
  className = "",
}: NavigationProps) {
  if (!user) return null;

  // Definir elementos de navegación basados en el rol del usuario
  const getNavigationItems = (): NavigationItem[] => {
    const baseItems: NavigationItem[] = [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: "dashboard",
        active: currentPath === "/dashboard",
        description: "Panel principal con estadísticas",
      },
      {
        href: "/appointments",
        label: "Citas",
        icon: "calendar",
        active: currentPath.startsWith("/appointments"),
        description: "Gestión de citas médicas",
      },
    ];

    // Agregar gestión de pacientes (para todos los usuarios autenticados)
    baseItems.push({
      href: "/patients",
      label: "Pacientes",
      icon: "user",
      active: currentPath.startsWith("/patients"),
      description: "Gestión de pacientes",
    });

    // Agregar elementos específicos según el rol
    if (user.role === "superadmin") {
      baseItems.push({
        href: "/psychologists",
        label: "Psicólogos",
        icon: "users",
        active: currentPath.startsWith("/psychologists"),
        description: "Gestión de psicólogos del sistema",
      });
      baseItems.push({
        href: "/rooms",
        label: "Salas",
        icon: "briefcase",
        active: currentPath.startsWith("/rooms"),
        description: "Gestión de salas de terapia",
      });
    } else if (user.role === "psychologist") {
      baseItems.push({
        href: "/psychologists",
        label: "Psicólogos",
        icon: "users",
        active: currentPath.startsWith("/psychologists"),
        description: "Directorio de psicólogos",
      });
      baseItems.push({
        href: "/rooms",
        label: "Salas",
        icon: "briefcase",
        active: currentPath.startsWith("/rooms"),
        description: "Ver salas disponibles",
      });
    }

    // Agregar acceso rápido a nueva cita
    baseItems.push({
      href: "/appointments/new",
      label: "Nueva Cita",
      icon: "calendar-plus",
      active: currentPath === "/appointments/new",
      description: "Crear nueva cita",
    });

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  // Estilos según la variante
  const getContainerClasses = () => {
    const base = className;

    switch (variant) {
      case "sidebar":
        return `${base} flex flex-col space-y-2 p-4`;
      case "mobile":
        return `${base} flex flex-col space-y-1 p-2`;
      default: // horizontal
        return `${base} flex items-center space-x-1`;
    }
  };

  const getLinkClasses = (item: NavigationItem) => {
    const baseClasses =
      "flex items-center transition-all duration-200 font-medium";
    const activeClasses = item.active
      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50"
      : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50";

    switch (variant) {
      case "sidebar":
        return `${baseClasses} ${activeClasses} px-4 py-3 rounded-lg gap-3 w-full`;
      case "mobile":
        return `${baseClasses} ${activeClasses} px-3 py-2 rounded-md gap-2 w-full text-sm`;
      default: // horizontal
        return `${baseClasses} ${activeClasses} px-3 py-2 rounded-lg gap-2`;
    }
  };

  const getIconSize = () => {
    switch (variant) {
      case "sidebar":
        return 20;
      case "mobile":
        return 16;
      default:
        return 16;
    }
  };

  return (
    <nav class={getContainerClasses()}>
      {navigationItems.map((item) => (
        <a
          key={item.href}
          href={item.href}
          class={getLinkClasses(item)}
          title={item.description}
        >
          <Icon
            name={item.icon}
            size={getIconSize()}
            className={item.active
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-300"}
          />
          <span class={variant === "sidebar" ? "text-base" : "text-sm"}>
            {item.label}
          </span>
          {item.badge && (
            <span class="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
              {item.badge}
            </span>
          )}
        </a>
      ))}
    </nav>
  );
}

// Componente específico para navegación lateral
export function SidebarNavigation({
  currentPath,
  user,
  className = "",
}: Omit<NavigationProps, "variant">) {
  return (
    <Navigation
      currentPath={currentPath}
      user={user}
      variant="sidebar"
      className={className}
    />
  );
}

// Componente específico para navegación móvil
export function MobileNavigation({
  currentPath,
  user,
  className = "",
}: Omit<NavigationProps, "variant">) {
  return (
    <Navigation
      currentPath={currentPath}
      user={user}
      variant="mobile"
      className={className}
    />
  );
}
