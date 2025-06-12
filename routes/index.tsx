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
              <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
                <a
                  href="/dashboard"
                  class="inline-flex items-center px-8 py-4 text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <Icon
                    name="briefcase"
                    size={20}
                    className="mr-3 text-current"
                  />
                  Ir al Dashboard
                </a>
                <a
                  href="/appointments"
                  class="inline-flex items-center px-8 py-4 text-base font-semibold rounded-xl text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 border-2 border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <Icon
                    name="calendar"
                    size={20}
                    className="mr-3 text-current"
                  />
                  Ver Citas
                </a>
              </div>
            ) : (
              <div class="flex justify-center mt-10">
                <a
                  href="/login"
                  class="inline-flex items-center px-10 py-4 text-lg font-semibold rounded-xl text-indigo-600 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-indigo-400 dark:hover:bg-gray-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <Icon name="login" size={24} className="mr-3 text-current" />
                  Comenzar Ahora
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
            <div class="text-center p-8 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-700">
              <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Icon
                  name="calendar-plus"
                  size={32}
                  className="text-white filter brightness-0 invert"
                />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Gestión de Citas
              </h3>
              <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                Programa, modifica y gestiona todas tus citas de manera sencilla
                e intuitiva.
              </p>
            </div>

            {/* Feature 2 */}
            <div class="text-center p-8 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-700">
              <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Icon
                  name="users"
                  size={32}
                  className="text-white filter brightness-0 invert"
                />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Gestión de Pacientes
              </h3>
              <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                Mantén un registro completo de todos tus pacientes y su
                historial.
              </p>
            </div>

            {/* Feature 3 */}
            <div class="text-center p-8 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-700">
              <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Icon
                  name="dashboard"
                  size={32}
                  className="text-white filter brightness-0 invert"
                />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Reportes y Estadísticas
              </h3>
              <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                Obtén insights valiosos sobre tu práctica con reportes
                detallados.
              </p>
            </div>

            {/* Feature 4 */}
            <div class="text-center p-8 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-700">
              <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Icon
                  name="shield"
                  size={32}
                  className="text-white filter brightness-0 invert"
                />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Seguridad y Privacidad
              </h3>
              <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                Protección total de datos con los más altos estándares de
                seguridad.
              </p>
            </div>

            {/* Feature 5 */}
            <div class="text-center p-8 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-700">
              <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Icon
                  name="heart"
                  size={32}
                  className="text-white filter brightness-0 invert"
                />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Enfoque Humano
              </h3>
              <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                Diseñado pensando en la relación terapéutica y el bienestar del
                paciente.
              </p>
            </div>

            {/* Feature 6 */}
            <div class="text-center p-8 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-700">
              <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Icon
                  name="heart-handshake"
                  size={32}
                  className="text-white filter brightness-0 invert"
                />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Soporte Continuo
              </h3>
              <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
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
              class="inline-flex items-center px-10 py-4 text-lg font-semibold rounded-xl text-indigo-600 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-indigo-400 dark:hover:bg-gray-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Icon name="login" size={24} className="mr-3 text-current" />
              Comenzar Ahora
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
