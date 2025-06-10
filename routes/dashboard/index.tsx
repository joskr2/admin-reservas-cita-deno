import type { Handlers, PageProps } from "$fresh/server.ts";
import type { AppState } from "../_middleware.ts";
import Header from "../../components/layout/Header.tsx";
import Footer from "../../components/layout/Footer.tsx";
import StatsCard from "../../components/dashboard/StatsCard.tsx";

import {
  LuUsers,
  LuCalendar,
  LuUserPlus,
  LuLogOut,
  LuActivity,
  LuBriefcase,
} from "@preact-icons/lu";

// Data that the handler calculates and passes to the component
interface DashboardStats {
  totalUsers: number;
  totalPsychologists: number;
  totalAppointments: number;
}

export const handler: Handlers<DashboardStats, AppState> = {
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
  props: PageProps<DashboardStats, AppState>
) {
  const { user } = props.state;
  const { totalUsers, totalPsychologists, totalAppointments } = props.data;
  const isSuperAdmin = user?.role === "superadmin";

  return (
    <div class="flex flex-col min-h-screen">
      <Header />

      <main class="flex-grow bg-gray-50 dark:bg-gray-900">
        <div class="mx-auto max-w-7xl py-12 px-4 sm:px-6 lg:px-8">
          {/* Dashboard Header */}
          <div class="pb-8 border-b border-gray-200 dark:border-gray-700 sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 class="text-3xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Bienvenido de vuelta,{" "}
                <span class="font-medium text-indigo-600 dark:text-indigo-400">
                  {user?.email}
                </span>
                !
              </p>
            </div>
            <div class="mt-4 flex sm:mt-0 sm:ml-4">
              <a
                href="/api/logout"
                class="inline-flex items-center rounded-md bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:ring-offset-gray-800"
              >
                <LuLogOut class="-ml-1 mr-2 h-5 w-5" />
                Cerrar Sesión
              </a>
            </div>
          </div>

          {/* Stats Cards Grid - Only shown to superadmins */}
          {isSuperAdmin && (
            <div class="mt-10">
              <h2 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                Estadísticas del Sistema
              </h2>
              <div class="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <StatsCard
                  title="Usuarios Totales"
                  value={totalUsers}
                  icon={<LuUsers class="h-6 w-6" />}
                  colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300"
                />
                <StatsCard
                  title="Psicólogos Activos"
                  value={totalPsychologists}
                  icon={<LuBriefcase class="h-6 w-6" />}
                  colorClass="bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300"
                />
                <StatsCard
                  title="Citas Agendadas"
                  value={totalAppointments}
                  icon={<LuCalendar class="h-6 w-6" />}
                  colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300"
                />
              </div>
            </div>
          )}

          {/* Main Actions Grid */}
          <div class="mt-10">
            <h2 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              Acciones Principales
            </h2>
            <ul
              class="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {isSuperAdmin && (
                <li class="col-span-1 flex rounded-md shadow-sm">
                  <div class="flex-shrink-0 flex items-center justify-center w-16 bg-indigo-600 text-white text-sm font-medium rounded-l-md">
                    <LuUserPlus class="h-6 w-6" />
                  </div>
                  <div class="flex flex-1 items-center justify-between truncate rounded-r-md border-b border-r border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div class="flex-1 truncate px-4 py-2 text-sm">
                      <a
                        href="/profiles"
                        class="font-medium text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        Gestionar Perfiles
                      </a>
                      <p class="text-gray-500 dark:text-gray-400">
                        Administra los usuarios del sistema.
                      </p>
                    </div>
                  </div>
                </li>
              )}
              <li class="col-span-1 flex rounded-md shadow-sm">
                <div class="flex-shrink-0 flex items-center justify-center w-16 bg-purple-600 text-white text-sm font-medium rounded-l-md">
                  <LuActivity class="h-6 w-6" />
                </div>
                <div class="flex flex-1 items-center justify-between truncate rounded-r-md border-b border-r border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div class="flex-1 truncate px-4 py-2 text-sm">
                    <a
                      href="/appointments"
                      class="font-medium text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      Ver Citas
                    </a>
                    <p class="text-gray-500 dark:text-gray-400">
                      Revisa y administra las citas.
                    </p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
