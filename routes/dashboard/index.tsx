import { type FreshContext, type PageProps } from "$fresh/server.ts";
import { type AppState, type DashboardData } from "../../types/index.ts";
import { Icon } from "../../components/ui/Icon.tsx";
import DashboardStats from "../../islands/DashboardStats.tsx";
import { getAllAppointments, getAllUsers } from "../../lib/kv.ts";

export async function handler(_req: Request, ctx: FreshContext<AppState>) {
  const kv = await Deno.openKv();

  try {
    const [users, appointments] = await Promise.all([
      getAllUsers(),
      getAllAppointments(),
    ]);

    const totalUsers = users.length;
    const totalPsychologists = users.filter(
      (user) => user.role === "psychologist",
    ).length;
    const totalAppointments = appointments.length;

    const dashboardData: DashboardData = {
      totalUsers,
      totalPsychologists,
      totalAppointments,
    };

    return ctx.render({ dashboardData });
  } finally {
    await kv.close();
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
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                href="/psychologists/new"
                class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
              >
                <div class="flex items-center">
                  <Icon name="user-plus" className="h-8 w-8 text-green-500" />
                  <div class="ml-4">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                      Nuevo Usuario
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400">
                      Crear perfil de usuario
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
