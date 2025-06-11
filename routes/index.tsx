import { type PageProps } from "$fresh/server.ts";
import { type AppState } from "../types/index.ts";
import { Icon } from "../components/ui/Icon.tsx";

export default function Home({ state }: PageProps<unknown, AppState>) {
  return (
    <div class="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section class="relative overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div class="text-center">
            <h1 class="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Horizonte Clínica
            </h1>
            <p class="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Sistema integral de gestión para consultorios psicológicos.
              Organiza citas, gestiona pacientes y optimiza tu práctica
              profesional.
            </p>

            {state.user ? (
              <div class="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                <a
                  href="/dashboard"
                  class="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                >
                  <Icon name="briefcase" className="h-5 w-5 mr-2" />
                  Ir al Dashboard
                </a>
                <a
                  href="/appointments"
                  class="inline-flex items-center px-8 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 md:py-4 md:text-lg md:px-10"
                >
                  <Icon name="calendar" className="h-5 w-5 mr-2" />
                  Ver Citas
                </a>
              </div>
            ) : (
              <div class="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                <a
                  href="/login"
                  class="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                >
                  <Icon name="login" className="h-5 w-5 mr-2" />
                  Iniciar Sesión
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section class="py-16 bg-white dark:bg-gray-900">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Características Principales
            </h2>
            <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Todo lo que necesitas para gestionar tu consulta psicológica de
              manera eficiente
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div class="text-center p-6 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div class="w-16 h-16 mx-auto mb-4 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <Icon
                  name="calendar-plus"
                  className="h-8 w-8 text-indigo-600 dark:text-indigo-400"
                />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Gestión de Citas
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                Programa, modifica y gestiona todas tus citas de manera sencilla
                e intuitiva.
              </p>
            </div>

            {/* Feature 2 */}
            <div class="text-center p-6 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div class="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Icon
                  name="users"
                  className="h-8 w-8 text-green-600 dark:text-green-400"
                />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Gestión de Pacientes
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                Mantén un registro completo de todos tus pacientes y su
                historial.
              </p>
            </div>

            {/* Feature 3 */}
            <div class="text-center p-6 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div class="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <Icon
                  name="dashboard"
                  className="h-8 w-8 text-purple-600 dark:text-purple-400"
                />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Reportes y Estadísticas
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                Obtén insights valiosos sobre tu práctica con reportes
                detallados.
              </p>
            </div>

            {/* Feature 4 */}
            <div class="text-center p-6 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div class="w-16 h-16 mx-auto mb-4 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <Icon
                  name="shield"
                  className="h-8 w-8 text-yellow-600 dark:text-yellow-400"
                />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Seguridad y Privacidad
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                Protección total de datos con los más altos estándares de
                seguridad.
              </p>
            </div>

            {/* Feature 5 */}
            <div class="text-center p-6 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div class="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <Icon
                  name="heart"
                  className="h-8 w-8 text-red-600 dark:text-red-400"
                />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Enfoque Humano
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                Diseñado pensando en la relación terapéutica y el bienestar del
                paciente.
              </p>
            </div>

            {/* Feature 6 */}
            <div class="text-center p-6 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div class="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Icon
                  name="heart-handshake"
                  className="h-8 w-8 text-blue-600 dark:text-blue-400"
                />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Soporte Continuo
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                Acompañamiento y soporte técnico para que te enfoques en lo
                importante.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section class="py-16 bg-indigo-600 dark:bg-indigo-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
            ¿Listo para transformar tu práctica?
          </h2>
          <p class="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Únete a los profesionales que ya confían en Horizonte Clínica para
            gestionar su consulta.
          </p>

          {!state.user && (
            <a
              href="/login"
              class="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
            >
              <Icon name="login" className="h-5 w-5 mr-2" />
              Comenzar Ahora
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
