import type { IconProps } from "../../types/index.ts";

interface IconComponentProps extends Omit<IconProps, "name"> {
  name: string;
  size?: number | undefined;
  className?: string | undefined;
  alt?: string | undefined;
}

export function Icon({
  name,
  size = 24,
  className = "",
  alt,
}: IconComponentProps) {
  // Mapeo de iconos con sus variantes para modo oscuro
  const iconMap: Record<string, { light: string; dark?: string }> = {
    // Iconos de navegación
    home: { light: "/icons/home.svg" },
    dashboard: { light: "/icons/bar-chart-3.svg" },
    calendar: { light: "/icons/calendar.svg" },
    "calendar-plus": { light: "/icons/calendar-plus.svg" },
    "user-plus": { light: "/icons/user-plus.svg" },
    users: { light: "/icons/users.svg" },
    user: { light: "/icons/user.svg" },
    "user-cog": { light: "/icons/user-cog.svg" },

    // Iconos de acciones
    plus: { light: "/icons/plus.svg" },
    check: { light: "/icons/check.svg" },
    circle: { light: "/icons/circle.svg" },
    x: { light: "/icons/x.svg" },
    edit: { light: "/icons/edit.svg", dark: "/icons/edit-dark.svg" },
    "trash-2": { light: "/icons/trash-2.svg" },
    "file-digit": { light: "/icons/file-digit.svg" },
    "file-warning": { light: "/icons/file-warning.svg" },
    eye: { light: "/icons/eye.svg" },

    // Iconos de interfaz
    "arrow-left": { light: "/icons/arrow-left.svg" },
    menu: { light: "/icons/menu.svg" },
    sun: { light: "/icons/sun.svg" },
    moon: { light: "/icons/moon.svg" },
    login: { light: "/icons/login.svg" },
    logout: { light: "/icons/logout.svg" },
    mail: { light: "/icons/mail.svg" },
    lock: { light: "/icons/lock.svg" },

    // Iconos de información
    clock: { light: "/icons/clock.svg" },
    hash: { light: "/icons/hash.svg" },
    briefcase: { light: "/icons/briefcase.svg" },
    activity: { light: "/icons/activity.svg" },
    heart: { light: "/icons/heart.svg" },
    "heart-handshake": { light: "/icons/heart-handshake.svg" },
    shield: { light: "/icons/shield.svg" },

    // Logo
    logo: { light: "/icons/logo.svg" },
  };

  const iconConfig = iconMap[name];
  if (!iconConfig) {
    console.warn(`Icon "${name}" not found in icon map`);
    return null;
  }

  const iconSrc = iconConfig.light;
  const iconAlt = alt || name;

  return (
    <img
      src={iconSrc}
      alt={iconAlt}
      width={size}
      height={size}
      className={`inline-block ${className} dark:filter dark:invert dark:brightness-0 dark:contrast-100`}
    />
  );
}

// Componente específico para iconos que necesitan cambiar color con el tema
export function ThemedIcon({
  name,
  size = 24,
  className = "",
  alt,
  lightColor = "text-gray-600",
  darkColor = "text-gray-300",
}: IconComponentProps & {
  lightColor?: string;
  darkColor?: string;
}) {
  return (
    <Icon
      name={name}
      size={size}
      alt={alt}
      className={`${lightColor} dark:${darkColor} ${className}`}
    />
  );
}
