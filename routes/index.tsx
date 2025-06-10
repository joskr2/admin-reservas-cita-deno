import type { Handlers, PageProps } from "$fresh/server.ts";
import type { AppState } from "./_middleware.ts";
import Header from "../islands/Header.tsx";
import Footer from "../components/layout/Footer.tsx";

export const handler: Handlers<unknown, AppState> = {
  GET(_req, ctx) {
    return ctx.render();
  },
};

export default function HomePage(props: PageProps<unknown, AppState>) {
  const { user } = props.state;
  const currentPath = "/";

  // Map user.role to the expected union type if user exists
  const headerUser: {
    email: string;
    role: "superadmin" | "psychologist";
  } | null = user
    ? {
        email: user.email,
        // Only allow "superadmin" or "psychologist", fallback to "psychologist" if not matching
        role:
          user.role === "superadmin" || user.role === "psychologist"
            ? user.role
            : "psychologist",
      }
    : null;

  return (
    <div>
      <Header user={headerUser} currentPath={currentPath} />

      <main>
        <section class="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
          <div class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />

          <div class="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
            <div class="text-center">
              <h1 class="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
                <span class="block">Horizonte</span>
                <span class="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Clínica Psicológica
                </span>
              </h1>
              <p class="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Sistema profesional de gestión de citas psicológicas. Conectamos
                profesionales de la salud mental con sus pacientes de manera
                eficiente y segura.
              </p>

              <div class="mt-10 flex items-center justify-center gap-x-6">
                {user ? (
                  <a
                    href="/dashboard"
                    class="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-xl hover:from-blue-700 hover:to-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25"
                  >
                    Ir al Dashboard
                  </a>
                ) : (
                  <a
                    href="/login"
                    class="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-xl hover:from-blue-700 hover:to-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25"
                  >
                    <img
                      src="/icons/login.svg"
                      alt="Iniciar Sesión"
                      width={20}
                      height={20}
                      class="mr-3"
                    />
                    Iniciar Sesión
                  </a>
                )}

                <a
                  href="#features"
                  class="text-lg font-semibold leading-6 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Conoce más <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" class="py-24 bg-white dark:bg-gray-900">
          <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="text-center">
              <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                ¿Por qué elegir Horizonte?
              </h2>
              <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Nuestra plataforma está diseñada específicamente para
                profesionales de la salud mental
              </p>
            </div>

            <div class="mt-20 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div class="relative group">
                <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <img
                    src="/icons/heart.svg"
                    alt="Enfoque Humano"
                    width={32}
                    height={32}
                  />
                </div>
                <h3 class="mt-6 text-xl font-semibold text-gray-900 dark:text-white">
                  Enfoque Humano
                </h3>
                <p class="mt-2 text-gray-600 dark:text-gray-400">
                  Priorizamos la conexión humana y el bienestar emocional en
                  cada interacción.
                </p>
              </div>

              {/* Feature 2 */}
              <div class="relative group">
                <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <img
                    src="/icons/shield.svg"
                    alt="Seguridad Total"
                    width={32}
                    height={32}
                  />
                </div>
                <h3 class="mt-6 text-xl font-semibold text-gray-900 dark:text-white">
                  Seguridad Total
                </h3>
                <p class="mt-2 text-gray-600 dark:text-gray-400">
                  Protección completa de datos personales y confidencialidad
                  garantizada.
                </p>
              </div>

              {/* Feature 3 */}
              <div class="relative group">
                <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <img
                    src="/icons/clock.svg"
                    alt="Gestión Eficiente"
                    width={32}
                    height={32}
                  />
                </div>
                <h3 class="mt-6 text-xl font-semibold text-gray-900 dark:text-white">
                  Gestión Eficiente
                </h3>
                <p class="mt-2 text-gray-600 dark:text-gray-400">
                  Organiza tus citas y pacientes de manera simple e intuitiva.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section class="bg-gradient-to-r from-blue-600 to-purple-600">
          <div class="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <div class="text-center">
              <h2 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                ¿Listo para comenzar?
              </h2>
              <p class="mt-4 text-xl text-blue-100">
                Únete a nuestra plataforma y optimiza la gestión de tu práctica
                psicológica.
              </p>

              {!user && (
                <div class="mt-8">
                  <a
                    href="/login"
                    class="inline-flex items-center rounded-xl bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-lg hover:bg-gray-50 transition-all duration-300 transform hover:scale-105"
                  >
                    <img
                      src="/icons/login.svg"
                      alt="Acceder al Sistema"
                      width={20}
                      height={20}
                      class="mr-3"
                    />
                    Acceder al Sistema
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
