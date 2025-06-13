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
              Guía de Uso
              <span class="block text-3xl md:text-4xl text-blue-600 dark:text-blue-400 mt-2">
                Horizonte Clínica
              </span>
            </h1>
            <p class="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-4xl mx-auto">
              Aprende a usar todas las funcionalidades del sistema de gestión
              para consultorios psicológicos. Esta guía te ayudará a dominar la
              plataforma paso a paso.
            </p>

            {state.user ? (
              <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
                <a
                  href="/dashboard"
                  class="inline-flex items-center px-8 py-4 text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <Icon
                    name="dashboard"
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
                  Comenzar a Usar
                </a>
              </div>
            ) : (
              <div class="flex justify-center mt-10">
                <a
                  href="/login"
                  class="inline-flex items-center px-10 py-4 text-lg font-semibold rounded-xl text-indigo-600 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-indigo-400 dark:hover:bg-gray-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <Icon name="login" size={24} className="mr-3 text-current" />
                  Iniciar Sesión para Comenzar
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick Start Guide */}
      <section class="py-16 bg-white dark:bg-gray-900">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              🚀 Inicio Rápido
            </h2>
            <p class="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Sigue estos pasos para comenzar a usar Horizonte Clínica en menos
              de 5 minutos
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div class="relative">
              <div class="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-2 border-blue-200 dark:border-blue-800">
                <div class="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  1
                </div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Accede al Dashboard
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Inicia sesión y ve al panel principal para ver el resumen de
                  tu clínica
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div class="relative">
              <div class="text-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-2 border-green-200 dark:border-green-800">
                <div class="w-16 h-16 mx-auto mb-4 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  2
                </div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Registra Pacientes
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Agrega la información de tus pacientes en la sección
                  "Pacientes"
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div class="relative">
              <div class="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-2 border-purple-200 dark:border-purple-800">
                <div class="w-16 h-16 mx-auto mb-4 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  3
                </div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Programa Citas
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Crea y gestiona citas desde la sección "Citas" o "Nueva Cita"
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div class="relative">
              <div class="text-center p-6 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 border-2 border-orange-200 dark:border-orange-800">
                <div class="w-16 h-16 mx-auto mb-4 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  4
                </div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Gestiona tu Práctica
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Usa las herramientas de filtrado y reportes para optimizar tu
                  trabajo
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Features Guide */}
      <section class="py-16 bg-gray-50 dark:bg-gray-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              📚 Guía Detallada de Funciones
            </h2>
            <p class="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Aprende a usar cada sección de la aplicación con ejemplos
              prácticos
            </p>
          </div>

          <div class="space-y-12">
            {/* Dashboard Guide */}
            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mr-4">
                  <Icon name="dashboard" size={24} className="text-white" />
                </div>
                <div>
                  <h3 class="text-2xl font-bold text-gray-900 dark:text-white">
                    Dashboard
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400">
                    Panel principal de control
                  </p>
                </div>
              </div>
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    ¿Qué puedes hacer?
                  </h4>
                  <ul class="space-y-2 text-gray-600 dark:text-gray-400">
                    <li class="flex items-center">
                      <Icon
                        name="check"
                        size={16}
                        className="text-green-500 mr-2"
                      />
                      Ver estadísticas generales de tu clínica
                    </li>
                    <li class="flex items-center">
                      <Icon
                        name="check"
                        size={16}
                        className="text-green-500 mr-2"
                      />
                      Filtrar actividad reciente por tipo y período
                    </li>
                    <li class="flex items-center">
                      <Icon
                        name="check"
                        size={16}
                        className="text-green-500 mr-2"
                      />
                      Acceder rápidamente a todas las secciones
                    </li>
                    <li class="flex items-center">
                      <Icon
                        name="check"
                        size={16}
                        className="text-green-500 mr-2"
                      />
                      Monitorear citas, pacientes, usuarios y salas
                    </li>
                  </ul>
                </div>
                <div class="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                  <h4 class="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
                    💡 Consejo
                  </h4>
                  <p class="text-blue-800 dark:text-blue-400 text-sm">
                    Usa los filtros de búsqueda para encontrar rápidamente
                    información específica. El dashboard se actualiza
                    automáticamente según tus filtros.
                  </p>
                </div>
              </div>
            </div>

            {/* Appointments Guide */}
            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mr-4">
                  <Icon name="calendar" size={24} className="text-white" />
                </div>
                <div>
                  <h3 class="text-2xl font-bold text-gray-900 dark:text-white">
                    Gestión de Citas
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400">
                    Programa y administra todas tus sesiones
                  </p>
                </div>
              </div>
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div>
                  <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Crear Citas
                  </h4>
                  <ol class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li class="flex items-start">
                      <span class="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">
                        1
                      </span>
                      Haz clic en "Nueva Cita"
                    </li>
                    <li class="flex items-start">
                      <span class="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">
                        2
                      </span>
                      Selecciona o busca el paciente
                    </li>
                    <li class="flex items-start">
                      <span class="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">
                        3
                      </span>
                      Elige fecha, hora y sala
                    </li>
                    <li class="flex items-start">
                      <span class="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">
                        4
                      </span>
                      Agrega notas si es necesario
                    </li>
                  </ol>
                </div>
                <div>
                  <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Estados de Citas
                  </h4>
                  <div class="space-y-2">
                    <div class="flex items-center">
                      <span class="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded-full text-xs font-medium mr-2">
                        Pendiente
                      </span>
                      <span class="text-sm text-gray-600 dark:text-gray-400">
                        Recién creada
                      </span>
                    </div>
                    <div class="flex items-center">
                      <span class="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full text-xs font-medium mr-2">
                        Programada
                      </span>
                      <span class="text-sm text-gray-600 dark:text-gray-400">
                        Confirmada
                      </span>
                    </div>
                    <div class="flex items-center">
                      <span class="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-1 rounded-full text-xs font-medium mr-2">
                        En Progreso
                      </span>
                      <span class="text-sm text-gray-600 dark:text-gray-400">
                        Sesión activa
                      </span>
                    </div>
                    <div class="flex items-center">
                      <span class="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full text-xs font-medium mr-2">
                        Completada
                      </span>
                      <span class="text-sm text-gray-600 dark:text-gray-400">
                        Finalizada
                      </span>
                    </div>
                  </div>
                </div>
                <div class="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4">
                  <h4 class="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-2">
                    ⚡ Funciones Avanzadas
                  </h4>
                  <ul class="text-purple-800 dark:text-purple-400 text-sm space-y-1">
                    <li>• Cambiar estado con un clic</li>
                    <li>• Filtrar por psicólogo, fecha o estado</li>
                    <li>• Ver historial completo de cambios</li>
                    <li>• Editar o eliminar citas existentes</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Patients Guide */}
            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mr-4">
                  <Icon name="user" size={24} className="text-white" />
                </div>
                <div>
                  <h3 class="text-2xl font-bold text-gray-900 dark:text-white">
                    Gestión de Pacientes
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400">
                    Administra la información de tus pacientes
                  </p>
                </div>
              </div>
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Información que puedes registrar:
                  </h4>
                  <div class="grid grid-cols-2 gap-4">
                    <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li class="flex items-center">
                        <Icon
                          name="check"
                          size={14}
                          className="text-green-500 mr-2"
                        />
                        Datos personales
                      </li>
                      <li class="flex items-center">
                        <Icon
                          name="check"
                          size={14}
                          className="text-green-500 mr-2"
                        />
                        Información de contacto
                      </li>
                      <li class="flex items-center">
                        <Icon
                          name="check"
                          size={14}
                          className="text-green-500 mr-2"
                        />
                        Contacto de emergencia
                      </li>
                    </ul>
                    <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li class="flex items-center">
                        <Icon
                          name="check"
                          size={14}
                          className="text-green-500 mr-2"
                        />
                        Historial médico
                      </li>
                      <li class="flex items-center">
                        <Icon
                          name="check"
                          size={14}
                          className="text-green-500 mr-2"
                        />
                        Notas importantes
                      </li>
                      <li class="flex items-center">
                        <Icon
                          name="check"
                          size={14}
                          className="text-green-500 mr-2"
                        />
                        Estado activo/inactivo
                      </li>
                    </ul>
                  </div>
                </div>
                <div class="bg-green-50 dark:bg-green-950/30 rounded-lg p-4">
                  <h4 class="text-lg font-semibold text-green-900 dark:text-green-300 mb-2">
                    🔍 Búsqueda Inteligente
                  </h4>
                  <p class="text-green-800 dark:text-green-400 text-sm mb-3">
                    Encuentra pacientes rápidamente buscando por:
                  </p>
                  <ul class="text-green-800 dark:text-green-400 text-sm space-y-1">
                    <li>• Nombre completo o parcial</li>
                    <li>• Número de teléfono</li>
                    <li>• Dirección de email</li>
                    <li>• ID único del paciente</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Rooms and Users Guide */}
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Rooms */}
              <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center mb-6">
                  <div class="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center mr-4">
                    <Icon name="briefcase" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                      Salas
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400">
                      Gestiona espacios de terapia
                    </p>
                  </div>
                </div>
                <div class="space-y-4">
                  <div>
                    <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                      Tipos de Sala:
                    </h4>
                    <div class="space-y-1 text-sm">
                      <div class="flex items-center">
                        <span class="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded text-xs mr-2">
                          Individual
                        </span>
                        <span class="text-gray-600 dark:text-gray-400">
                          Terapia personal
                        </span>
                      </div>
                      <div class="flex items-center">
                        <span class="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded text-xs mr-2">
                          Familiar
                        </span>
                        <span class="text-gray-600 dark:text-gray-400">
                          Terapia familiar
                        </span>
                      </div>
                      <div class="flex items-center">
                        <span class="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-1 rounded text-xs mr-2">
                          Grupal
                        </span>
                        <span class="text-gray-600 dark:text-gray-400">
                          Sesiones grupales
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3">
                    <p class="text-orange-800 dark:text-orange-400 text-sm">
                      💡 Cambia la disponibilidad de las salas con un clic para
                      optimizar la programación.
                    </p>
                  </div>
                </div>
              </div>

              {/* Users */}
              <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center mb-6">
                  <div class="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mr-4">
                    <Icon name="users" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                      Psicólogos
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400">
                      Directorio de profesionales
                    </p>
                  </div>
                </div>
                <div class="space-y-4">
                  <div>
                    <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                      Roles del Sistema:
                    </h4>
                    <div class="space-y-2 text-sm">
                      <div class="flex items-center">
                        <span class="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded text-xs mr-2">
                          Superadmin
                        </span>
                        <span class="text-gray-600 dark:text-gray-400">
                          Control total del sistema
                        </span>
                      </div>
                      <div class="flex items-center">
                        <span class="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded text-xs mr-2">
                          Admin
                        </span>
                        <span class="text-gray-600 dark:text-gray-400">
                          Gestión administrativa
                        </span>
                      </div>
                      <div class="flex items-center">
                        <span class="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded text-xs mr-2">
                          Psicólogo
                        </span>
                        <span class="text-gray-600 dark:text-gray-400">
                          Profesional de la salud
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="bg-indigo-50 dark:bg-indigo-950/30 rounded-lg p-3">
                    <p class="text-indigo-800 dark:text-indigo-400 text-sm">
                      🔐 Los permisos se asignan automáticamente según el rol
                      del usuario.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tips and Best Practices */}
      <section class="py-16 bg-white dark:bg-gray-900">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              💡 Consejos y Mejores Prácticas
            </h2>
            <p class="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Optimiza tu flujo de trabajo con estos consejos profesionales
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Tip 1 */}
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <div class="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Icon name="clock" size={24} className="text-white" />
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Gestión del Tiempo
              </h3>
              <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>• Programa citas con 15 min de buffer</li>
                <li>• Usa el filtro de fecha para planificar la semana</li>
                <li>• Revisa el dashboard cada mañana</li>
              </ul>
            </div>

            {/* Tip 2 */}
            <div class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 rounded-xl p-6 border border-green-200 dark:border-green-800">
              <div class="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <Icon name="user" size={24} className="text-white" />
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Organización de Pacientes
              </h3>
              <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>• Mantén actualizada la información de contacto</li>
                <li>• Usa las notas para recordatorios importantes</li>
                <li>• Marca como inactivos a pacientes que no continúan</li>
              </ul>
            </div>

            {/* Tip 3 */}
            <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
              <div class="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Icon name="shield" size={24} className="text-white" />
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Seguridad y Privacidad
              </h3>
              <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>• Cierra sesión al terminar el día</li>
                <li>• No compartas credenciales de acceso</li>
                <li>• Mantén confidencial la información de pacientes</li>
              </ul>
            </div>

            {/* Tip 4 */}
            <div class="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
              <div class="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-4">
                <Icon name="activity" size={24} className="text-white" />
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Seguimiento y Reportes
              </h3>
              <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>• Revisa las estadísticas semanalmente</li>
                <li>• Usa los filtros para análisis específicos</li>
                <li>• Actualiza estados de citas puntualmente</li>
              </ul>
            </div>

            {/* Tip 5 */}
            <div class="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 rounded-xl p-6 border border-red-200 dark:border-red-800">
              <div class="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                <Icon name="briefcase" size={24} className="text-white" />
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Gestión de Salas
              </h3>
              <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>• Verifica disponibilidad antes de programar</li>
                <li>• Mantén actualizado el equipamiento</li>
                <li>• Asigna salas según el tipo de terapia</li>
              </ul>
            </div>

            {/* Tip 6 */}
            <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/30 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
              <div class="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <Icon name="heart" size={24} className="text-white" />
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Flujo de Trabajo
              </h3>
              <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>• Establece rutinas diarias de revisión</li>
                <li>• Usa atajos de teclado cuando sea posible</li>
                <li>• Mantén un backup de información importante</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section class="py-16 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
            ¿Listo para comenzar?
          </h2>
          <p class="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Con esta guía tienes todo lo necesario para aprovechar al máximo
            Horizonte Clínica. ¡Comienza a gestionar tu práctica de manera más
            eficiente!
          </p>

          {state.user ? (
            <a
              href="/dashboard"
              class="inline-flex items-center px-10 py-4 text-lg font-semibold rounded-xl text-blue-600 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Icon name="dashboard" size={24} className="mr-3 text-current" />
              Ir al Dashboard
            </a>
          ) : (
            <a
              href="/login"
              class="inline-flex items-center px-10 py-4 text-lg font-semibold rounded-xl text-blue-600 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Icon name="login" size={24} className="mr-3 text-current" />
              Iniciar Sesión
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
