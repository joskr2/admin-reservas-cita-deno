import ThemeToggle from "../../islands/ThemeToggle.tsx";

export default function Header() {
  return (
    <header class="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <div class="flex items-center">
            <a href="/" class="flex-shrink-0 flex items-center gap-2">
              <img
                src="/icons/logo.svg"
                alt="Logo Horizonte"
                width="32"
                height="32"
              />
              <span class="text-xl font-bold text-gray-900 dark:text-white">
                Horizonte
              </span>
            </a>
          </div>
          <div class="flex items-center">
            {/* The ThemeToggle island is rendered here for client-side interactivity */}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
