import { type FreshContext, type PageProps } from "$fresh/server.ts";
import { type AppState, type DashboardData } from "../../types/index.ts";
import { Icon } from "../../components/ui/Icon.tsx";
import DashboardStats from "../../islands/DashboardStats.tsx";
import { getDashboardService } from "../../lib/database/index.ts";

export async function handler(_req: Request, ctx: FreshContext<AppState>) {
  try {
    const dashboardService = getDashboardService();
    const dashboardData = await dashboardService.getStats();

    return ctx.render({ dashboardData });
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    // Retornar datos vacíos en caso de error
    const dashboardData: DashboardData = {
      totalUsers: 0,
      totalPsychologists: 0,
      totalAppointments: 0,
      totalPatients: 0,
      totalRooms: 0,
      availableRooms: 0,
    };
    return ctx.render({ dashboardData });
  }
}

export default function Dashboard({
  data,
}: PageProps<{ dashboardData: DashboardData }, AppState>) {
  const { dashboardData } = data;

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p class="mt-2 text-gray-600 dark:text-gray-400">
              Resumen general del sistema
            </p>
          </div>

          {/* Stats Cards */}
          <DashboardStats {...dashboardData} />

          {/* Quick Actions */}
          <div class="mt-8">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Acciones Rápidas
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <a
                href="/appointments/new"
                class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
              >
                <div class="flex items-center">
                  <Icon
                    name="calendar-plus"
                    className="h-8 w-8 text-blue-500"
                  />
                  <div class="ml-4">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                      Nueva Cita
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400">
                      Programar una nueva cita
                    </p>
                  </div>
                </div>
              </a>

              <a
                href="/patients/new"
                class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
              >
                <div class="flex items-center">
                  <Icon name="user-plus" className="h-8 w-8 text-green-500" />
                  <div class="ml-4">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                      Nuevo Paciente
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400">
                      Registrar nuevo paciente
                    </p>
                  </div>
                </div>
              </a>

              <a
                href="/appointments"
                class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
              >
                <div class="flex items-center">
                  <Icon name="calendar" className="h-8 w-8 text-purple-500" />
                  <div class="ml-4">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                      Ver Citas
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400">
                      Gestionar todas las citas
                    </p>
                  </div>
                </div>
              </a>

              <a
                href="/rooms"
                class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
              >
                <div class="flex items-center">
                  <Icon name="briefcase" className="h-8 w-8 text-orange-500" />
                  <div class="ml-4">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                      Ver Salas
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400">
                      Estado de las salas
                    </p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
