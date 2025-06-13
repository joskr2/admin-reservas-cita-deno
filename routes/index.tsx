import { type PageProps } from "$fresh/server.ts";
import { Icon } from "../components/ui/Icon.tsx";

export default function Home({}: PageProps) {
  return (
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-800">
      {/* Hero Section */}
      <section class="relative overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div class="text-center">
            <h1 class="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Guía de Uso
              <span class="block text-3xl md:text-4xl text-blue-600 dark:text-blue-400 mt-2">
                Horizonte Clínica
              </span>
            </h1>
            <p class="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Aprende a usar todas las funcionalidades del sistema de gestión
              para consultorios psicológicos. Esta guía te ayudará a dominar la
              plataforma paso a paso.
            </p>

            {/* CTA Buttons */}
            <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <a
                href="/login"
                class="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <Icon name="login" size={20} className="text-white" />
                Iniciar Sesión
              </a>
              <a
                href="#guia-rapida"
                class="inline-flex items-center gap-3 px-8 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
              >
                <Icon
                  name="activity"
                  size={20}
                  className="text-blue-600 dark:text-blue-400"
                />
                Ver Guía Completa
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Inicio Rápido */}
      <section id="guia-rapida" class="py-16 bg-white dark:bg-gray-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              🚀 Inicio Rápido
            </h2>
            <p class="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Comienza a usar el sistema en menos de 5 minutos siguiendo estos
              pasos
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Paso 1 */}
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800/50 h-full flex flex-col">
              <div class="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-xl mb-4 font-bold text-lg">
                1
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Iniciar Sesión
              </h3>
              <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed flex-1">
                Accede al sistema con tus credenciales. Si es tu primera vez,
                contacta al administrador.
              </p>
              <div class="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                <span class="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  ⏱️ 1 minuto
                </span>
              </div>
            </div>

            {/* Paso 2 */}
            <div class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border border-green-200 dark:border-green-800/50 h-full flex flex-col">
              <div class="flex items-center justify-center w-12 h-12 bg-green-600 text-white rounded-xl mb-4 font-bold text-lg">
                2
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Explorar Dashboard
              </h3>
              <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed flex-1">
                Familiarízate con el panel principal y las estadísticas del
                sistema.
              </p>
              <div class="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
                <span class="text-xs text-green-600 dark:text-green-400 font-medium">
                  ⏱️ 2 minutos
                </span>
              </div>
            </div>

            {/* Paso 3 */}
            <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800/50 h-full flex flex-col">
              <div class="flex items-center justify-center w-12 h-12 bg-purple-600 text-white rounded-xl mb-4 font-bold text-lg">
                3
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Crear Primera Cita
              </h3>
              <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed flex-1">
                Programa tu primera cita usando el formulario intuitivo del
                sistema.
              </p>
              <div class="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
                <span class="text-xs text-purple-600 dark:text-purple-400 font-medium">
                  ⏱️ 2 minutos
                </span>
              </div>
            </div>

            {/* Paso 4 */}
            <div class="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800/50 h-full flex flex-col">
              <div class="flex items-center justify-center w-12 h-12 bg-orange-600 text-white rounded-xl mb-4 font-bold text-lg">
                4
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                ¡Listo para usar!
              </h3>
              <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed flex-1">
                Ya puedes gestionar citas, pacientes y salas de manera
                eficiente.
              </p>
              <div class="mt-4 pt-4 border-t border-orange-200 dark:border-orange-700">
                <span class="text-xs text-orange-600 dark:text-orange-400 font-medium">
                  ✅ Completado
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guía Detallada */}
      <section class="py-16 bg-gray-50 dark:bg-gray-900">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              📚 Guía Detallada de Funciones
            </h2>
            <p class="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Aprende a usar cada sección del sistema de manera efectiva
            </p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Dashboard */}
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 h-full">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Icon
                    name="dashboard"
                    size={24}
                    className="text-blue-600 dark:text-blue-400"
                  />
                </div>
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white">
                  Dashboard
                </h3>
              </div>

              <div class="space-y-4">
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                    ¿Qué puedes hacer?
                  </h4>
                  <ul class="space-y-2 text-gray-600 dark:text-gray-300">
                    <li class="flex items-start gap-2">
                      <span class="text-green-500 mt-1">•</span>
                      Ver estadísticas generales del sistema
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-green-500 mt-1">•</span>
                      Monitorear actividad reciente
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-green-500 mt-1">•</span>
                      Acceder rápidamente a funciones principales
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                    Filtros disponibles:
                  </h4>
                  <div class="flex flex-wrap gap-2">
                    <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                      Búsqueda
                    </span>
                    <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                      Por tipo
                    </span>
                    <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                      Por período
                    </span>
                  </div>
                </div>

                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <p class="text-sm text-blue-700 dark:text-blue-300">
                    <strong>💡 Consejo:</strong> Usa los filtros para encontrar
                    información específica rápidamente
                  </p>
                </div>
              </div>
            </div>

            {/* Gestión de Citas */}
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 h-full">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <Icon
                    name="calendar"
                    size={24}
                    className="text-green-600 dark:text-green-400"
                  />
                </div>
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white">
                  Gestión de Citas
                </h3>
              </div>

              <div class="space-y-4">
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                    Proceso paso a paso:
                  </h4>
                  <ol class="space-y-2 text-gray-600 dark:text-gray-300">
                    <li class="flex items-start gap-2">
                      <span class="text-green-500 font-bold">1.</span>
                      Selecciona paciente (o crea uno nuevo)
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-green-500 font-bold">2.</span>
                      Elige psicólogo y sala disponible
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-green-500 font-bold">3.</span>
                      Define fecha, hora y observaciones
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-green-500 font-bold">4.</span>
                      Confirma y gestiona el estado de la cita
                    </li>
                  </ol>
                </div>

                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                    Estados de cita:
                  </h4>
                  <div class="grid grid-cols-2 gap-2">
                    <span class="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded text-xs text-center">
                      Pendiente
                    </span>
                    <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs text-center">
                      Programada
                    </span>
                    <span class="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs text-center">
                      En progreso
                    </span>
                    <span class="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs text-center">
                      Completada
                    </span>
                  </div>
                </div>

                <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <p class="text-sm text-green-700 dark:text-green-300">
                    <strong>⚡ Función avanzada:</strong> Cambia estados
                    directamente desde la lista de citas
                  </p>
                </div>
              </div>
            </div>

            {/* Gestión de Pacientes */}
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 h-full">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <Icon
                    name="user"
                    size={24}
                    className="text-purple-600 dark:text-purple-400"
                  />
                </div>
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white">
                  Gestión de Pacientes
                </h3>
              </div>

              <div class="space-y-4">
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                    Información que puedes registrar:
                  </h4>
                  <ul class="space-y-2 text-gray-600 dark:text-gray-300">
                    <li class="flex items-start gap-2">
                      <span class="text-purple-500 mt-1">•</span>
                      Datos personales completos
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-purple-500 mt-1">•</span>
                      Información de contacto
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-purple-500 mt-1">•</span>
                      Historial médico y observaciones
                    </li>
                    <li class="flex items-start gap-2">
                      <span class="text-purple-500 mt-1">•</span>
                      Contacto de emergencia
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                    Búsqueda inteligente:
                  </h4>
                  <p class="text-gray-600 dark:text-gray-300 text-sm">
                    Encuentra pacientes por nombre, teléfono, email o cualquier
                    dato registrado
                  </p>
                </div>

                <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <p class="text-sm text-purple-700 dark:text-purple-300">
                    <strong>🔒 Privacidad:</strong> Toda la información está
                    protegida y encriptada
                  </p>
                </div>
              </div>
            </div>

            {/* Gestión de Salas */}
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 h-full">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <Icon
                    name="briefcase"
                    size={24}
                    className="text-orange-600 dark:text-orange-400"
                  />
                </div>
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white">
                  Gestión de Salas
                </h3>
              </div>

              <div class="space-y-4">
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                    Tipos de sala disponibles:
                  </h4>
                  <div class="grid grid-cols-1 gap-2">
                    <span class="px-3 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg text-sm">
                      🏠 Individual - Terapia personal
                    </span>
                    <span class="px-3 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg text-sm">
                      👨‍👩‍👧‍👦 Familiar - Terapia familiar
                    </span>
                    <span class="px-3 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg text-sm">
                      👥 Grupal - Sesiones grupales
                    </span>
                  </div>
                </div>

                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                    Gestión de disponibilidad:
                  </h4>
                  <p class="text-gray-600 dark:text-gray-300 text-sm">
                    Cambia el estado de las salas entre disponible/ocupada con
                    un solo clic
                  </p>
                </div>

                <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                  <p class="text-sm text-orange-700 dark:text-orange-300">
                    <strong>🏢 Equipamiento:</strong> Registra el equipamiento
                    disponible en cada sala
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Consejos y Mejores Prácticas */}
      <section class="py-16 bg-white dark:bg-gray-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              💡 Consejos y Mejores Prácticas
            </h2>
            <p class="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Optimiza tu flujo de trabajo con estos consejos profesionales
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Organización */}
            <div class="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 h-full">
              <div class="w-12 h-12 bg-slate-600 text-white rounded-xl flex items-center justify-center mb-4">
                <Icon name="briefcase" size={24} className="text-white" />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Organización
              </h3>
              <ul class="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                <li class="flex items-start gap-2">
                  <span class="text-slate-500 mt-1">•</span>
                  Revisa el dashboard cada mañana
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-slate-500 mt-1">•</span>
                  Mantén actualizada la información de pacientes
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-slate-500 mt-1">•</span>
                  Usa filtros para encontrar información rápido
                </li>
              </ul>
            </div>

            {/* Eficiencia */}
            <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-800/50 dark:to-emerald-700/50 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-700 h-full">
              <div class="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center mb-4">
                <Icon name="activity" size={24} className="text-white" />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Eficiencia
              </h3>
              <ul class="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                <li class="flex items-start gap-2">
                  <span class="text-emerald-500 mt-1">•</span>
                  Programa citas con anticipación
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-emerald-500 mt-1">•</span>
                  Usa atajos de teclado cuando sea posible
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-emerald-500 mt-1">•</span>
                  Actualiza estados de citas en tiempo real
                </li>
              </ul>
            </div>

            {/* Comunicación */}
            <div class="bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-800/50 dark:to-sky-700/50 rounded-2xl p-6 border border-sky-200 dark:border-sky-700 h-full">
              <div class="w-12 h-12 bg-sky-600 text-white rounded-xl flex items-center justify-center mb-4">
                <Icon name="mail" size={24} className="text-white" />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Comunicación
              </h3>
              <ul class="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                <li class="flex items-start gap-2">
                  <span class="text-sky-500 mt-1">•</span>
                  Mantén notas detalladas en cada cita
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-sky-500 mt-1">•</span>
                  Coordina con otros psicólogos del equipo
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-sky-500 mt-1">•</span>
                  Verifica disponibilidad antes de programar
                </li>
              </ul>
            </div>

            {/* Seguridad */}
            <div class="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-800/50 dark:to-red-700/50 rounded-2xl p-6 border border-red-200 dark:border-red-700 h-full">
              <div class="w-12 h-12 bg-red-600 text-white rounded-xl flex items-center justify-center mb-4">
                <Icon name="shield" size={24} className="text-white" />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Seguridad
              </h3>
              <ul class="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                <li class="flex items-start gap-2">
                  <span class="text-red-500 mt-1">•</span>
                  Cierra sesión al terminar tu turno
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-red-500 mt-1">•</span>
                  No compartas credenciales de acceso
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-red-500 mt-1">•</span>
                  Respeta la confidencialidad de pacientes
                </li>
              </ul>
            </div>

            {/* Mantenimiento */}
            <div class="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-800/50 dark:to-amber-700/50 rounded-2xl p-6 border border-amber-200 dark:border-amber-700 h-full">
              <div class="w-12 h-12 bg-amber-600 text-white rounded-xl flex items-center justify-center mb-4">
                <Icon name="user-cog" size={24} className="text-white" />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Mantenimiento
              </h3>
              <ul class="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                <li class="flex items-start gap-2">
                  <span class="text-amber-500 mt-1">•</span>
                  Revisa y actualiza datos regularmente
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-amber-500 mt-1">•</span>
                  Reporta problemas técnicos inmediatamente
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-amber-500 mt-1">•</span>
                  Mantén limpio tu espacio de trabajo digital
                </li>
              </ul>
            </div>

            {/* Productividad */}
            <div class="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-800/50 dark:to-violet-700/50 rounded-2xl p-6 border border-violet-200 dark:border-violet-700 h-full">
              <div class="w-12 h-12 bg-violet-600 text-white rounded-xl flex items-center justify-center mb-4">
                <Icon name="activity" size={24} className="text-white" />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Productividad
              </h3>
              <ul class="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                <li class="flex items-start gap-2">
                  <span class="text-violet-500 mt-1">•</span>
                  Establece rutinas de trabajo consistentes
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-violet-500 mt-1">•</span>
                  Aprovecha las estadísticas del dashboard
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-violet-500 mt-1">•</span>
                  Planifica tu agenda con anticipación
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Soporte y Recursos */}
      <section class="py-16 bg-gray-50 dark:bg-gray-900">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              🆘 Soporte y Recursos
            </h2>
            <p class="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              ¿Necesitas ayuda? Aquí tienes todos los recursos disponibles
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Documentación */}
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center h-full flex flex-col">
              <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon
                  name="file-digit"
                  size={32}
                  className="text-blue-600 dark:text-blue-400"
                />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Documentación
              </h3>
              <p class="text-gray-600 dark:text-gray-300 text-sm mb-4 flex-1">
                Guías detalladas y manuales de usuario completos
              </p>
              <div class="text-blue-600 dark:text-blue-400 font-medium text-sm">
                📖 Disponible 24/7
              </div>
            </div>

            {/* Soporte Técnico */}
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center h-full flex flex-col">
              <div class="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon
                  name="user-cog"
                  size={32}
                  className="text-green-600 dark:text-green-400"
                />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Soporte Técnico
              </h3>
              <p class="text-gray-600 dark:text-gray-300 text-sm mb-4 flex-1">
                Asistencia técnica especializada para resolver problemas
              </p>
              <div class="text-green-600 dark:text-green-400 font-medium text-sm">
                🕐 Lun-Vie 9:00-18:00
              </div>
            </div>

            {/* Capacitación */}
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center h-full flex flex-col">
              <div class="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon
                  name="users"
                  size={32}
                  className="text-purple-600 dark:text-purple-400"
                />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Capacitación
              </h3>
              <p class="text-gray-600 dark:text-gray-300 text-sm mb-4 flex-1">
                Sesiones de entrenamiento para nuevos usuarios
              </p>
              <div class="text-purple-600 dark:text-purple-400 font-medium text-sm">
                📅 Programar sesión
              </div>
            </div>

            {/* Actualizaciones */}
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 text-center h-full flex flex-col">
              <div class="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon
                  name="activity"
                  size={32}
                  className="text-orange-600 dark:text-orange-400"
                />
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Actualizaciones
              </h3>
              <p class="text-gray-600 dark:text-gray-300 text-sm mb-4 flex-1">
                Novedades y mejoras del sistema
              </p>
              <div class="text-orange-600 dark:text-orange-400 font-medium text-sm">
                🔄 Automáticas
              </div>
            </div>
          </div>

          {/* CTA Final */}
          <div class="mt-12 text-center">
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
              <h3 class="text-2xl font-bold mb-4">¿Listo para comenzar?</h3>
              <p class="text-blue-100 mb-6 max-w-2xl mx-auto">
                Inicia sesión ahora y comienza a gestionar tu clínica de manera
                más eficiente
              </p>
              <a
                href="/login"
                class="inline-flex items-center gap-3 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <Icon name="login" size={20} className="text-blue-600" />
                Acceder al Sistema
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
