export interface IconComponentProps {
  name: string;
  size?: number;
  className?: string;
  alt?: string;
  disableAutoFilter?: boolean;
}

export function Icon({
  name,
  size = 24,
  className = "",
  alt,
  disableAutoFilter = false,
}: IconComponentProps) {
  // Mapeo simplificado de iconos - todos usan currentColor
  const iconMap: Record<string, string> = {
    // Iconos de navegación
    home: "/icons/home.svg",
    dashboard: "/icons/bar-chart-3.svg",
    "bar-chart-3": "/icons/bar-chart-3.svg",
    calendar: "/icons/calendar.svg",
    "calendar-plus": "/icons/calendar-plus.svg",
    "user-plus": "/icons/user-plus.svg",
    users: "/icons/users.svg",
    user: "/icons/user.svg",
    "user-cog": "/icons/user-cog.svg",

    // Iconos de acciones
    plus: "/icons/plus.svg",
    check: "/icons/check.svg",
    circle: "/icons/circle.svg",
    x: "/icons/x.svg",
    edit: "/icons/edit.svg",
    "trash-2": "/icons/trash-2.svg",
    "file-digit": "/icons/file-digit.svg",
    "file-warning": "/icons/file-warning.svg",
    eye: "/icons/eye.svg",

    // Iconos de interfaz
    "arrow-left": "/icons/arrow-left.svg",
    menu: "/icons/menu.svg",
    sun: "/icons/sun.svg",
    moon: "/icons/moon.svg",
    login: "/icons/login.svg",
    logout: "/icons/logout.svg",
    mail: "/icons/mail.svg",
    lock: "/icons/lock.svg",

    // Iconos de información
    clock: "/icons/clock.svg",
    hash: "/icons/hash.svg",
    briefcase: "/icons/briefcase.svg",
    activity: "/icons/activity.svg",
    heart: "/icons/heart.svg",
    "heart-handshake": "/icons/heart-handshake.svg",
    shield: "/icons/shield.svg",

    // Iconos adicionales que encontré en el proyecto
    phone: "/icons/phone.svg",
    "map-pin": "/icons/map-pin.svg",
    loader: "/icons/loader.svg",

    // Logo
    logo: "/icons/logo.svg",
  };

  const iconSrc = iconMap[name];

  if (!iconSrc) {
    console.warn(`Icon "${name}" not found in iconMap`);
    return null;
  }

  // Clases por defecto que funcionan bien con currentColor
  const defaultClasses = disableAutoFilter ? "" : "text-current dark:invert"; // Usar text-current para heredar el color del padre e invertir en modo oscuro

  return (
    <img
      src={iconSrc}
      alt={alt || `${name} icon`}
      width={size}
      height={size}
      class={`inline-block ${defaultClasses} ${className}`}
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
      {...(alt && { alt })}
      className={`${lightColor} dark:${darkColor} ${className}`}
    />
  );
}

// Componente para iconos con colores específicos (útil para estados)
export function ColoredIcon({
  name,
  size = 24,
  className = "",
  alt,
  color = "text-gray-500",
}: IconComponentProps & {
  color?: string;
}) {
  return (
    <Icon
      name={name}
      size={size}
      {...(alt && { alt })}
      className={`${color} ${className}`}
    />
  );
}

// Hook para obtener la lista de iconos disponibles (útil para desarrollo)
export function getAvailableIcons(): string[] {
  const iconMap: Record<string, string> = {
    home: "/icons/home.svg",
    dashboard: "/icons/bar-chart-3.svg",
    "bar-chart-3": "/icons/bar-chart-3.svg",
    calendar: "/icons/calendar.svg",
    "calendar-plus": "/icons/calendar-plus.svg",
    "user-plus": "/icons/user-plus.svg",
    users: "/icons/users.svg",
    user: "/icons/user.svg",
    "user-cog": "/icons/user-cog.svg",
    plus: "/icons/plus.svg",
    check: "/icons/check.svg",
    circle: "/icons/circle.svg",
    x: "/icons/x.svg",
    edit: "/icons/edit.svg",
    "trash-2": "/icons/trash-2.svg",
    "file-digit": "/icons/file-digit.svg",
    "file-warning": "/icons/file-warning.svg",
    eye: "/icons/eye.svg",
    "arrow-left": "/icons/arrow-left.svg",
    menu: "/icons/menu.svg",
    sun: "/icons/sun.svg",
    moon: "/icons/moon.svg",
    login: "/icons/login.svg",
    logout: "/icons/logout.svg",
    mail: "/icons/mail.svg",
    lock: "/icons/lock.svg",
    clock: "/icons/clock.svg",
    hash: "/icons/hash.svg",
    briefcase: "/icons/briefcase.svg",
    activity: "/icons/activity.svg",
    heart: "/icons/heart.svg",
    "heart-handshake": "/icons/heart-handshake.svg",
    shield: "/icons/shield.svg",
    phone: "/icons/phone.svg",
    "map-pin": "/icons/map-pin.svg",
    loader: "/icons/loader.svg",
    logo: "/icons/logo.svg",
  };

  return Object.keys(iconMap).sort();
}
