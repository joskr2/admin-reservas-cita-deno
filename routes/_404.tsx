import { Head } from "$fresh/runtime.ts";
import { Icon } from "../components/ui/Icon.tsx";

export default function Error404() {
  return (
    <>
      <Head>
        <title>404 - Página no encontrada</title>
      </Head>
      <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 px-4">
        <div class="max-w-md mx-auto text-center">
          <div class="mb-8">
            <div class="mx-auto w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
              <Icon
                name="activity"
                size={48}
                className="text-white filter brightness-0 invert"
              />
            </div>
            <h1 class="text-6xl font-bold text-gray-900 dark:text-white mb-2">
              404
            </h1>
            <h2 class="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Página no encontrada
            </h2>
            <p class="text-gray-600 dark:text-gray-400 mb-8">
              La página que buscas no existe o ha sido movida.
            </p>
          </div>

          <div class="space-y-4">
            <a
              href="/"
              class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              <Icon
                name="home"
                size={20}
                className="text-white filter brightness-0 invert"
              />
              Volver al inicio
            </a>

            <div class="text-sm text-gray-500 dark:text-gray-400">
              <p>¿Necesitas ayuda? Contacta al administrador del sistema.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
