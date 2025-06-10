import { useEffect } from "preact/hooks";
import { signal, effect } from "@preact/signals";

// Signal to hold the current theme state. Default to 'light'.
const theme = signal<"light" | "dark">("light");

// Global effect that runs when theme changes
effect(() => {
  if (typeof window !== "undefined") {
    const currentTheme = theme.value;

    // Update the class on the <html> element
    if (currentTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Persist the user's choice in localStorage
    localStorage.setItem("theme", currentTheme);
  }
});

export default function ThemeToggle() {
  // Initialize the theme once when the component mounts on the client.
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("theme") as
        | "light"
        | "dark"
        | null;
      const prefersDark = globalThis.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      // Set theme from localStorage or system preference
      const initialTheme = storedTheme || (prefersDark ? "dark" : "light");
      theme.value = initialTheme;
    }
  }, []);

  // Function to toggle the theme signal's value.
  const toggleTheme = () => {
    theme.value = theme.value === "light" ? "dark" : "light";
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      class="inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 transition duration-150 ease-in-out"
      aria-label="Toggle theme"
    >
      {/* El componente se re-renderiza automáticamente cuando theme.value cambia */}
      {theme.value === "light" ? (
        <img src="/icons/moon.svg" alt="Modo claro" width={24} height={24} />
      ) : (
        <img src="/icons/sun.svg" alt="Modo oscuro" width={24} height={24} />
      )}
    </button>
  );
}
