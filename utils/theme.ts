export type Theme = "light" | "dark";

// Función para obtener el tema inicial del servidor/cliente
export function getInitialTheme(): Theme {
  // En el servidor, usar 'light' por defecto
  if (typeof window === "undefined") {
    return "light";
  }

  // En el cliente, intentar obtener de localStorage
  const storedTheme = localStorage.getItem("theme") as Theme | null;
  if (storedTheme) {
    return storedTheme;
  }

  // Si no hay tema guardado, usar preferencia del sistema
  const prefersDark = globalThis.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;
  return prefersDark ? "dark" : "light";
}

// Función para aplicar el tema al HTML
export function applyTheme(theme: Theme) {
  if (typeof window === "undefined") return;

  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  localStorage.setItem("theme", theme);
}

// Script que se ejecuta inmediatamente para evitar flash
export const themeScript = `
(function() {
  function getStoredTheme() {
    try {
      return localStorage.getItem('theme');
    } catch (e) {
      return null;
    }
  }

  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  const storedTheme = getStoredTheme();
  const theme = storedTheme || getSystemTheme();

  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
})();
`;
