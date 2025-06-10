export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div class="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-center">
          <p class="text-center text-sm text-gray-500 dark:text-gray-400">
            © {currentYear} Horizonte. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
