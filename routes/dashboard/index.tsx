import type { Handlers, PageProps } from "$fresh/server.ts";
import type { AppState } from "../_middleware.ts";
import Header from "../../islands/Header.tsx";
import Footer from "../../components/layout/Footer.tsx";
import DashboardStats from "../../islands/DashboardStats.tsx";

// Data that the handler calculates and passes to the component
interface DashboardData {
  totalUsers: number;
  totalPsychologists: number;
  totalAppointments: number;
}

export const handler: Handlers<DashboardData, AppState> = {
  async GET(_req, ctx) {
    // Only superadmins should see these global stats
    if (ctx.state.user?.role !== "superadmin") {
      // For now, psychologists can see the dashboard, but with fewer stats.
      // We can refine this later. Let's return zeroed stats for them.
      return ctx.render({
        totalUsers: 0,
        totalPsychologists: 0,
        totalAppointments: 0,
      });
    }

    const kv = await Deno.openKv();

    // Calculate stats using iterators for efficiency
    let totalUsers = 0;
    let totalPsychologists = 0;
    let totalAppointments = 0;

    const usersIter = kv.list({ prefix: ["users"] });
    for await (const _ of usersIter) {
      totalUsers++;
    }

    const psychologistsIter = kv.list({
      prefix: ["users_by_role", "psychologist"],
    });
    for await (const _ of psychologistsIter) {
      totalPsychologists++;
    }

    const appointmentsIter = kv.list({ prefix: ["appointments"] });
    for await (const _ of appointmentsIter) {
      totalAppointments++;
    }

    kv.close();

    return ctx.render({ totalUsers, totalPsychologists, totalAppointments });
  },
};

export default function DashboardPage(
  props: PageProps<DashboardData, AppState>
) {
  const { user } = props.state;
  const { totalUsers, totalPsychologists, totalAppointments } = props.data;
  const isSuperAdmin = user?.role === "superadmin";
  const currentPath = "/dashboard";

  // Ensure user.role is "superadmin" or "psychologist" for Header
  const headerUser =
    user && (user.role === "superadmin" || user.role === "psychologist")
      ? { email: user.email, role: user.role as "superadmin" | "psychologist" }
      : null;

  return (
    <div class="flex flex-col min-h-screen">
      <Header currentPath={currentPath} user={headerUser} title="Dashboard" />

      <main class="flex-grow bg-gray-50 dark:bg-gray-900">
        <div class="mx-auto max-w-7xl py-12 px-4 sm:px-6 lg:px-8">
          {/* Dashboard Welcome */}
          <div class="pb-8">
            <h1 class="text-3xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
              Panel de Control
            </h1>
            <p class="mt-2 text-lg text-gray-600 dark:text-gray-400">
              Bienvenido de vuelta,{" "}
              <span class="font-medium text-indigo-600 dark:text-indigo-400">
                {user?.email}
              </span>
              ! Aquí tienes un resumen de tu actividad.
            </p>
          </div>

          {/* Stats Cards Grid - Only shown to superadmins */}
          {isSuperAdmin && (
            <div class="mb-10">
              <h2 class="text-xl font-semibold leading-6 text-gray-900 dark:text-white mb-6">
                📊 Estadísticas del Sistema
              </h2>
              <DashboardStats
                totalUsers={totalUsers}
                totalPsychologists={totalPsychologists}
                totalAppointments={totalAppointments}
              />
            </div>
          )}

          {/* Quick Actions Grid */}
          <div class="space-y-6">
            <h2 class="text-xl font-semibold leading-6 text-gray-900 dark:text-white">
              🚀 Acciones Rápidas
            </h2>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Gestionar Perfiles - Solo superadmin */}
              {isSuperAdmin && (
                <a
                  href="/profiles"
                  class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/25 hover:-translate-y-1"
                >
                  <div class="flex items-center gap-4">
                    <div class="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                      <img
                        src="/icons/user-plus.svg"
                        alt="Usuarios"
                        width={24}
                        height={24}
                      />
                    </div>
                    <div>
                      <h3 class="text-lg font-semibold">Gestionar Usuarios</h3>
                      <p class="text-indigo-100">
                        Administra perfiles del sistema
                      </p>
                    </div>
                  </div>
                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </a>
              )}

              {/* Ver Citas */}
              <a
                href="/appointments"
                class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 p-6 text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/25 hover:-translate-y-1"
              >
                <div class="flex items-center gap-4">
                  <div class="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                    <img
                      src="/icons/activity.svg"
                      alt="Ver Citas"
                      width={24}
                      height={24}
                    />
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold">Ver Citas</h3>
                    <p class="text-purple-100">Revisa y administra citas</p>
                  </div>
                </div>
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </a>

              {/* Programar Nueva Cita */}
              <a
                href="/appointments/new"
                class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/25 hover:-translate-y-1"
              >
                <div class="flex items-center gap-4">
                  <div class="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                    <img
                      src="/icons/activity.svg"
                      alt="Nueva Cita"
                      width={24}
                      height={24}
                    />
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold">Nueva Cita</h3>
                    <p class="text-emerald-100">Agenda una nueva cita</p>
                  </div>
                </div>
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </a>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div class="mt-10">
            <h2 class="text-xl font-semibold leading-6 text-gray-900 dark:text-white mb-6">
              🕒 Actividad Reciente
            </h2>
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <p class="text-gray-500 dark:text-gray-400 text-center py-8">
                Próximamente: Historial de actividad reciente
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
