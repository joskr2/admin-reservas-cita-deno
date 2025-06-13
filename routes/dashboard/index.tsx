import { type FreshContext, type PageProps } from "$fresh/server.ts";
import {
  type Appointment,
  type AppState,
  type DashboardData,
  type PatientProfile,
  type UserProfile,
} from "../../types/index.ts";
import { Icon } from "../../components/ui/Icon.tsx";
import DashboardStats from "../../islands/DashboardStats.tsx";
import GenericFilters from "../../islands/GenericFilters.tsx";
import {
  getAppointmentRepository,
  getDashboardService,
  getPatientRepository,
  getUserRepository,
} from "../../lib/database/index.ts";

interface DashboardPageData {
  dashboardData: DashboardData;
  recentAppointments: Appointment[];
  recentPatients: PatientProfile[];
  recentUsers: UserProfile[];
  filters: {
    search?: string;
    type?: string;
    period?: string;
  };
}

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const type = url.searchParams.get("type") || "";
  const period = url.searchParams.get("period") || "week";

  try {
    const dashboardService = getDashboardService();
    const appointmentRepository = getAppointmentRepository();
    const patientRepository = getPatientRepository();
    const userRepository = getUserRepository();

    const dashboardData = await dashboardService.getStats();

    // Obtener datos recientes
    let recentAppointments = await appointmentRepository.getAll();
    let recentPatients = await patientRepository.getAllPatientsAsProfiles();
    let recentUsers = await userRepository.getAllUsersAsProfiles();

    // Filtrar por período
    const now = new Date();
    let dateFilter: Date;
    switch (period) {
      case "today":
        dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Aplicar filtros
    if (search) {
      const searchLower = search.toLowerCase();
      recentAppointments = recentAppointments.filter(
        (apt) =>
          apt.patientName.toLowerCase().includes(searchLower) ||
          apt.psychologistEmail.toLowerCase().includes(searchLower) ||
          apt.id.toLowerCase().includes(searchLower)
      );
      recentPatients = recentPatients.filter(
        (patient) =>
          patient.name.toLowerCase().includes(searchLower) ||
          patient.id.toLowerCase().includes(searchLower)
      );
      recentUsers = recentUsers.filter(
        (user) =>
          (user.name && user.name.toLowerCase().includes(searchLower)) ||
          user.email.toLowerCase().includes(searchLower)
      );
    }

    if (type) {
      switch (type) {
        case "appointments":
          recentPatients = [];
          recentUsers = [];
          break;
        case "patients":
          recentAppointments = [];
          recentUsers = [];
          break;
        case "users":
          recentAppointments = [];
          recentPatients = [];
          break;
      }
    }

    // Filtrar por fecha y limitar resultados
    recentAppointments = recentAppointments
      .filter((apt) => new Date(apt.createdAt) >= dateFilter)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 10);

    recentPatients = recentPatients
      .filter((patient) => new Date(patient.createdAt) >= dateFilter)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 10);

    recentUsers = recentUsers
      .filter((user) => new Date(user.createdAt) >= dateFilter)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 10);

    return ctx.render({
      dashboardData,
      recentAppointments,
      recentPatients,
      recentUsers,
      filters: { search, type, period },
    });
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
    return ctx.render({
      dashboardData,
      recentAppointments: [],
      recentPatients: [],
      recentUsers: [],
      filters: {},
    });
  }
}

export default function Dashboard({
  data,
}: PageProps<DashboardPageData, AppState>) {
  const {
    dashboardData,
    recentAppointments,
    recentPatients,
    recentUsers,
    filters,
  } = data;

  // Configuración de filtros para el dashboard
  const filterFields = [
    {
      key: "search",
      label: "Buscar",
      icon: "activity",
      type: "search" as const,
      placeholder: "Buscar en actividad reciente...",
    },
    {
      key: "type",
      label: "Tipo",
      icon: "hash",
      type: "select" as const,
      options: [
        { value: "appointments", label: "Citas", emoji: "📅" },
        { value: "patients", label: "Pacientes", emoji: "👤" },
        { value: "users", label: "Usuarios", emoji: "👥" },
      ],
    },
    {
      key: "period",
      label: "Período",
      icon: "clock",
      type: "select" as const,
      options: [
        { value: "today", label: "Hoy", emoji: "📅" },
        { value: "week", label: "Esta semana", emoji: "📊" },
        { value: "month", label: "Este mes", emoji: "📈" },
      ],
    },
  ];

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

          {/* Filtros para actividad reciente */}
          <GenericFilters
            title="Filtros de Actividad Reciente"
            basePath="/dashboard"
            filters={filters}
            fields={filterFields}
          />

          {/* Actividad Reciente */}
          <div class="mt-8">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Actividad Reciente
            </h2>

            <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {/* Citas Recientes */}
              {(!filters.type || filters.type === "appointments") && (
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                  <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                      <h3 class="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                        <Icon
                          name="calendar"
                          className="h-5 w-5 text-blue-500 mr-2"
                        />
                        Citas Recientes
                      </h3>
                      <span class="text-sm text-gray-500 dark:text-gray-400">
                        {recentAppointments.length}
                      </span>
                    </div>
                    <div class="space-y-3 max-h-64 overflow-y-auto">
                      {recentAppointments.length === 0 ? (
                        <p class="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                          No hay citas recientes
                        </p>
                      ) : (
                        recentAppointments.map((appointment) => (
                          <div
                            key={appointment.id}
                            class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <Icon
                                name="calendar"
                                className="h-4 w-4 text-blue-600 dark:text-blue-400"
                              />
                            </div>
                            <div class="flex-1 min-w-0">
                              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {appointment.patientName}
                              </p>
                              <p class="text-xs text-gray-500 dark:text-gray-400">
                                {appointment.appointmentDate} -{" "}
                                {appointment.appointmentTime}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {recentAppointments.length > 0 && (
                      <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <a
                          href="/appointments"
                          class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Ver todas las citas →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pacientes Recientes */}
              {(!filters.type || filters.type === "patients") && (
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                  <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                      <h3 class="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                        <Icon
                          name="user"
                          className="h-5 w-5 text-green-500 mr-2"
                        />
                        Pacientes Recientes
                      </h3>
                      <span class="text-sm text-gray-500 dark:text-gray-400">
                        {recentPatients.length}
                      </span>
                    </div>
                    <div class="space-y-3 max-h-64 overflow-y-auto">
                      {recentPatients.length === 0 ? (
                        <p class="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                          No hay pacientes recientes
                        </p>
                      ) : (
                        recentPatients.map((patient) => (
                          <div
                            key={patient.id}
                            class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div class="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                              <span class="text-xs font-medium text-green-600 dark:text-green-400">
                                {patient.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div class="flex-1 min-w-0">
                              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {patient.name}
                              </p>
                              <p class="text-xs text-gray-500 dark:text-gray-400">
                                {patient.email || "Sin email"}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {recentPatients.length > 0 && (
                      <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <a
                          href="/patients"
                          class="text-sm text-green-600 dark:text-green-400 hover:underline"
                        >
                          Ver todos los pacientes →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Usuarios Recientes */}
              {(!filters.type || filters.type === "users") && (
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                  <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                      <h3 class="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                        <Icon
                          name="users"
                          className="h-5 w-5 text-purple-500 mr-2"
                        />
                        Usuarios Recientes
                      </h3>
                      <span class="text-sm text-gray-500 dark:text-gray-400">
                        {recentUsers.length}
                      </span>
                    </div>
                    <div class="space-y-3 max-h-64 overflow-y-auto">
                      {recentUsers.length === 0 ? (
                        <p class="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                          No hay usuarios recientes
                        </p>
                      ) : (
                        recentUsers.map((user) => (
                          <div
                            key={user.id}
                            class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                              <span class="text-xs font-medium text-purple-600 dark:text-purple-400">
                                {(user.name || user.email)
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            </div>
                            <div class="flex-1 min-w-0">
                              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {user.name || user.email}
                              </p>
                              <p class="text-xs text-gray-500 dark:text-gray-400">
                                {user.role === "psychologist"
                                  ? "Psicólogo"
                                  : "Administrador"}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {recentUsers.length > 0 && (
                      <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <a
                          href="/psychologists"
                          class="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          Ver todos los usuarios →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

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
