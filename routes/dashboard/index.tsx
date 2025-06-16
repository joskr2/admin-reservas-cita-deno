import { type FreshContext, type PageProps } from "$fresh/server.ts";
import {
  type Appointment,
  type AppState,
  type DashboardData,
  type PatientProfile,
  type Room,
  type UserProfile,
} from "../../types/index.ts";
import GenericFilters from "../../islands/GenericFilters.tsx";
import DashboardStats from "../../islands/DashboardStats.tsx";
import AvailabilityDashboard from "../../islands/AvailabilityDashboard.tsx";
import {
  getAppointmentRepository,
  getDashboardService,
  getPatientRepository,
  getRoomRepository,
  getUserRepository,
} from "../../lib/database/index.ts";
import { Icon } from "../../components/ui/Icon.tsx";
import { logger, extractUserContext } from "../../lib/logger.ts";

interface DashboardPageData {
  dashboardData: DashboardData;
  recentAppointments: Appointment[];
  recentPatients: PatientProfile[];
  recentUsers: UserProfile[];
  recentRooms: Room[];
  allAppointments: Appointment[];
  allRooms: Room[];
  currentUser: {
    role: string;
    email: string;
    id?: string;
    name?: string;
  };
  filters: {
    search?: string;
    type?: string;
    period?: string;
  };
}

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  const requestId = ctx.state.requestId || 'unknown';
  const userContext = extractUserContext(ctx.state.user);
  
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const type = url.searchParams.get("type") || "";
  const period = url.searchParams.get("period") || "week";

  await logger.info('DASHBOARD', 'Dashboard page requested', {
    search,
    type,
    period,
    url: req.url,
  }, { requestId, ...userContext });

  const currentUser = ctx.state.user;
  if (!currentUser) {
    await logger.warn('DASHBOARD', 'Unauthenticated user redirected to login', {
      url: req.url,
    }, { requestId });
    return Response.redirect(new URL("/login", url.origin), 302);
  }

  try {
    await logger.debug('DASHBOARD', 'Loading dashboard data', {
      userRole: currentUser.role,
      userEmail: currentUser.email,
    }, { requestId, ...userContext });
    
    const dashboardService = getDashboardService();
    const appointmentRepository = getAppointmentRepository();
    const patientRepository = getPatientRepository();
    const userRepository = getUserRepository();
    const roomRepository = getRoomRepository();

    // Usar el método correcto según el rol del usuario
    const dashboardData = currentUser.role === "superadmin" 
      ? await dashboardService.getStats()
      : await dashboardService.getPsychologistStats(currentUser.email);
    
    await logger.debug('DASHBOARD', 'Dashboard stats retrieved', {
      userRole: currentUser.role,
      totalUsers: dashboardData.totalUsers,
      totalPsychologists: dashboardData.totalPsychologists,
      totalAppointments: dashboardData.totalAppointments,
      totalPatients: dashboardData.totalPatients,
      totalRooms: dashboardData.totalRooms,
      availableRooms: dashboardData.availableRooms,
      roomUtilization: dashboardData.roomUtilization,
      availableTimeSlots: dashboardData.availableTimeSlots,
      todayAppointments: dashboardData.todayAppointments,
      upcomingAppointments: dashboardData.upcomingAppointments,
    }, { requestId, ...userContext });

    // Obtener datos recientes según el rol del usuario
    let recentAppointments: Appointment[];
    let recentPatients: PatientProfile[];
    let recentUsers: UserProfile[];
    let recentRooms: Room[];
    let allAppointments: Appointment[];
    let allRooms: Room[];

    if (currentUser.role === "superadmin") {
      await logger.debug('DASHBOARD', 'Loading data for superadmin user', {}, { requestId, ...userContext });
      
      // Superadmin ve todo
      recentAppointments = await appointmentRepository.getAll();
      recentPatients = await patientRepository.getAllPatientsAsProfiles();
      recentUsers = await userRepository.getAllUsersAsProfiles();
      recentRooms = await roomRepository.getAll();
      allAppointments = recentAppointments;
      allRooms = recentRooms;
      
      await logger.debug('DASHBOARD', 'Superadmin data loaded', {
        appointmentsCount: recentAppointments.length,
        patientsCount: recentPatients.length,
        usersCount: recentUsers.length,
        roomsCount: recentRooms.length,
      }, { requestId, ...userContext });
    } else {
      await logger.debug('DASHBOARD', 'Loading data for psychologist user', {
        psychologistEmail: currentUser.email,
      }, { requestId, ...userContext });
      
      // Psicólogos solo ven sus propias citas y datos relacionados
      recentAppointments =
        await appointmentRepository.getAppointmentsByPsychologist(
          currentUser.email
        );

      // Para pacientes, solo mostrar aquellos que tienen citas con este psicólogo
      const allPatients = await patientRepository.getAllPatientsAsProfiles();
      const patientNamesWithAppointments = new Set(
        recentAppointments.map((apt) => apt.patientName)
      );
      recentPatients = allPatients.filter((patient) =>
        patientNamesWithAppointments.has(patient.name)
      );

      // Los psicólogos no ven otros usuarios
      recentUsers = [];

      // Los psicólogos pueden ver las salas (información general)
      recentRooms = await roomRepository.getAll();
      allAppointments = recentAppointments;
      allRooms = recentRooms;
      
      await logger.debug('DASHBOARD', 'Psychologist data loaded', {
        appointmentsCount: recentAppointments.length,
        patientsCount: recentPatients.length,
        totalPatients: allPatients.length,
        patientsWithAppointments: patientNamesWithAppointments.size,
        roomsCount: recentRooms.length,
      }, { requestId, ...userContext });
    }

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
    
    await logger.debug('DASHBOARD', 'Applying filters', {
      period,
      dateFilter: dateFilter.toISOString(),
      search,
      type,
    }, { requestId, ...userContext });

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
      recentRooms = recentRooms.filter(
        (room) =>
          room.name.toLowerCase().includes(searchLower) ||
          room.id.toLowerCase().includes(searchLower) ||
          (room.description &&
            room.description.toLowerCase().includes(searchLower))
      );
    }

    if (type) {
      switch (type) {
        case "appointments":
          recentPatients = [];
          recentUsers = [];
          recentRooms = [];
          break;
        case "patients":
          recentAppointments = [];
          recentUsers = [];
          recentRooms = [];
          break;
        case "users":
          recentAppointments = [];
          recentPatients = [];
          recentRooms = [];
          break;
        case "rooms":
          recentAppointments = [];
          recentPatients = [];
          recentUsers = [];
          break;
      }
    }

    // Filtrar por fecha y limitar resultados
    const originalCounts = {
      appointments: recentAppointments.length,
      patients: recentPatients.length,
      users: recentUsers.length,
      rooms: recentRooms.length,
    };
    
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

    recentRooms = recentRooms
      .filter((room) => new Date(room.createdAt) >= dateFilter)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 10);
      
    await logger.info('DASHBOARD', 'Dashboard data processing completed', {
      originalCounts,
      filteredCounts: {
        appointments: recentAppointments.length,
        patients: recentPatients.length,
        users: recentUsers.length,
        rooms: recentRooms.length,
      },
      filters: { search, type, period },
    }, { requestId, ...userContext });

    return ctx.render({
      dashboardData,
      recentAppointments,
      recentPatients,
      recentUsers,
      recentRooms,
      allAppointments,
      allRooms,
      currentUser: {
        role: currentUser.role,
        email: currentUser.email,
        id: currentUser.id,
        name: currentUser.name,
      },
      filters: { search, type, period },
    });
  } catch (error) {
    await logger.error('DASHBOARD', 'Error loading dashboard data', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userRole: currentUser?.role,
      filters: { search, type, period },
    }, { requestId, ...userContext });
    
    // Retornar datos vacíos en caso de error
    const dashboardData: DashboardData = {
      totalUsers: 0,
      totalPsychologists: 0,
      totalAppointments: 0,
      totalPatients: 0,
      totalRooms: 0,
      availableRooms: 0,
      roomUtilization: 0,
      availableTimeSlots: 0,
      todayAppointments: 0,
      upcomingAppointments: 0,
    };
    return ctx.render({
      dashboardData,
      recentAppointments: [],
      recentPatients: [],
      recentUsers: [],
      recentRooms: [],
      allAppointments: [],
      allRooms: [],
      currentUser: {
        role: currentUser?.role || "psychologist",
        email: currentUser?.email || "",
        id: currentUser?.id,
        name: currentUser?.name,
      },
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
    recentRooms,
    allAppointments,
    allRooms,
    currentUser,
    filters,
  } = data;

  // Configuración de filtros para el dashboard
  const typeOptions = [
    { value: "appointments", label: "Citas", emoji: "📅" },
    { value: "patients", label: "Pacientes", emoji: "👤" },
    { value: "rooms", label: "Salas", emoji: "🏢" },
  ];

  // Solo agregar "users" para superadmin
  if (currentUser.role === "superadmin") {
    typeOptions.splice(2, 0, { value: "users", label: "Usuarios", emoji: "👥" });
  }

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
      options: typeOptions,
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
          {/* Header */}
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p class="mt-2 text-gray-600 dark:text-gray-400">
              Resumen general del sistema y actividad reciente
            </p>
          </div>

          {/* 1. Filtros de Búsqueda - PRIMERO */}
          <div class="mb-8">
            <GenericFilters
              title="Filtros de Búsqueda"
              basePath="/dashboard"
              filters={filters}
              fields={filterFields}
              showActiveIndicator
            />
          </div>

          {/* 2. Estadísticas - SEGUNDO */}
          <div class="mb-8">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <Icon name="bar-chart-3" className="h-5 w-5 text-blue-500 mr-2" />
              Estadísticas del Sistema
            </h2>
            <DashboardStats {...dashboardData} userRole={currentUser.role} />
          </div>

          {/* 3. Disponibilidad de Horarios y Salas - TERCERO */}
          <div class="mb-8">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <Icon name="clock" className="h-5 w-5 text-green-500 mr-2" />
              Disponibilidad de Horarios y Salas
            </h2>
            <AvailabilityDashboard
              appointments={allAppointments}
              rooms={allRooms}
              patients={recentPatients}
              psychologistEmail={currentUser.email}
              userRole={currentUser.role}
            />
          </div>

          {/* 4. Acciones Rápidas - CUARTO */}
          <div class="mb-8">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <Icon name="activity" className="h-5 w-5 text-purple-500 mr-2" />
              Acciones Rápidas
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <a
                href="/appointments/new"
                class="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
              >
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                      <Icon
                        name="calendar-plus"
                        className="h-6 w-6 text-blue-600 dark:text-blue-400"
                      />
                    </div>
                  </div>
                  <div class="ml-4">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Nueva Cita
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      Programar una nueva cita
                    </p>
                  </div>
                </div>
              </a>

              <a
                href="/patients/new"
                class="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600"
              >
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                      <Icon
                        name="user-plus"
                        className="h-6 w-6 text-green-600 dark:text-green-400"
                      />
                    </div>
                  </div>
                  <div class="ml-4">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      Nuevo Paciente
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      Registrar nuevo paciente
                    </p>
                  </div>
                </div>
              </a>

              <a
                href="/appointments"
                class="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600"
              >
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                      <Icon
                        name="calendar"
                        className="h-6 w-6 text-purple-600 dark:text-purple-400"
                      />
                    </div>
                  </div>
                  <div class="ml-4">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      Ver Citas
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      Gestionar todas las citas
                    </p>
                  </div>
                </div>
              </a>

              <a
                href="/rooms"
                class="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600"
              >
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
                      <Icon
                        name="briefcase"
                        className="h-6 w-6 text-orange-600 dark:text-orange-400"
                      />
                    </div>
                  </div>
                  <div class="ml-4">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      Ver Salas
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      Estado de las salas
                    </p>
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* 4. Actividad Reciente - CUARTO */}
          <div>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <Icon name="activity" className="h-5 w-5 text-indigo-500 mr-2" />
              Actividad Reciente
            </h2>

            {(() => {
              // Calcular cuántas cards se van a mostrar
              const visibleCards = [
                (!filters.type || filters.type === "appointments") &&
                  recentAppointments.length > 0,
                (!filters.type || filters.type === "patients") &&
                  recentPatients.length > 0,
                (!filters.type || filters.type === "users") &&
                  currentUser.role === "superadmin" &&
                  recentUsers.length > 0,
                (!filters.type || filters.type === "rooms") &&
                  recentRooms.length > 0,
              ].filter(Boolean).length;

              // Determinar las clases del grid basado en el número de cards
              let gridClasses = "grid gap-6";
              if (visibleCards === 1) {
                gridClasses += " grid-cols-1 max-w-2xl mx-auto"; // Una card: centrada y más ancha
              } else if (visibleCards === 2) {
                gridClasses += " grid-cols-1 lg:grid-cols-2 max-w-4xl mx-auto"; // Dos cards: centradas
              } else if (visibleCards === 3) {
                gridClasses += " grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"; // Tres cards: layout normal
              } else {
                gridClasses += " grid-cols-1 lg:grid-cols-2 xl:grid-cols-4"; // Cuatro cards: 4 columnas en XL
              }

              return (
                <div class={gridClasses}>
                  {/* Citas Recientes */}
                  {(!filters.type || filters.type === "appointments") && (
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                      <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                          <h3 class="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                            <Icon
                              name="calendar"
                              className="h-5 w-5 text-blue-500 mr-2"
                            />
                            Citas Recientes
                          </h3>
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            {recentAppointments.length}
                          </span>
                        </div>
                        <div class="space-y-3 max-h-64 overflow-y-auto">
                          {recentAppointments.length === 0 ? (
                            <div class="text-center py-8">
                              <Icon
                                name="calendar"
                                className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3"
                              />
                              <p class="text-gray-500 dark:text-gray-400 text-sm">
                                No hay citas recientes
                              </p>
                            </div>
                          ) : (
                            recentAppointments.map((appointment) => (
                              <div
                                key={appointment.id}
                                class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
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
                              class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center"
                            >
                              Ver todas las citas
                              <Icon
                                name="arrow-left"
                                className="h-4 w-4 ml-1 rotate-180"
                              />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pacientes Recientes */}
                  {(!filters.type || filters.type === "patients") && (
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                      <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                          <h3 class="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                            <Icon
                              name="user"
                              className="h-5 w-5 text-green-500 mr-2"
                            />
                            Pacientes Recientes
                          </h3>
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            {recentPatients.length}
                          </span>
                        </div>
                        <div class="space-y-3 max-h-64 overflow-y-auto">
                          {recentPatients.length === 0 ? (
                            <div class="text-center py-8">
                              <Icon
                                name="user"
                                className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3"
                              />
                              <p class="text-gray-500 dark:text-gray-400 text-sm">
                                No hay pacientes recientes
                              </p>
                            </div>
                          ) : (
                            recentPatients.map((patient) => (
                              <div
                                key={patient.id}
                                class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <div class="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                                  <span class="text-sm font-medium text-green-600 dark:text-green-400">
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
                              class="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium flex items-center"
                            >
                              Ver todos los pacientes
                              <Icon
                                name="arrow-left"
                                className="h-4 w-4 ml-1 rotate-180"
                              />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Usuarios Recientes - Solo para superadmin */}
                  {currentUser.role === "superadmin" && (!filters.type || filters.type === "users") && (
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                      <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                          <h3 class="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                            <Icon
                              name="users"
                              className="h-5 w-5 text-purple-500 mr-2"
                            />
                            Usuarios Recientes
                          </h3>
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                            {recentUsers.length}
                          </span>
                        </div>
                        <div class="space-y-3 max-h-64 overflow-y-auto">
                          {recentUsers.length === 0 ? (
                            <div class="text-center py-8">
                              <Icon
                                name="users"
                                className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3"
                              />
                              <p class="text-gray-500 dark:text-gray-400 text-sm">
                                No hay usuarios recientes
                              </p>
                            </div>
                          ) : (
                            recentUsers.map((user) => (
                              <div
                                key={user.id}
                                class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                                  <span class="text-sm font-medium text-purple-600 dark:text-purple-400">
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
                              class="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center"
                            >
                              Ver todos los usuarios
                              <Icon
                                name="arrow-left"
                                className="h-4 w-4 ml-1 rotate-180"
                              />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Salas Recientes */}
                  {(!filters.type || filters.type === "rooms") && (
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                      <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                          <h3 class="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                            <Icon
                              name="briefcase"
                              className="h-5 w-5 text-orange-500 mr-2"
                            />
                            Salas Recientes
                          </h3>
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                            {recentRooms.length}
                          </span>
                        </div>
                        <div class="space-y-3 max-h-64 overflow-y-auto">
                          {recentRooms.length === 0 ? (
                            <div class="text-center py-8">
                              <Icon
                                name="briefcase"
                                className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3"
                              />
                              <p class="text-gray-500 dark:text-gray-400 text-sm">
                                No hay salas recientes
                              </p>
                            </div>
                          ) : (
                            recentRooms.map((room) => (
                              <div
                                key={room.id}
                                class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <div class="w-10 h-10 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center">
                                  <span class="text-sm font-medium text-orange-600 dark:text-orange-400">
                                    {room.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div class="flex-1 min-w-0">
                                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {room.name}
                                  </p>
                                  <p class="text-xs text-gray-500 dark:text-gray-400">
                                    {room.description || "Sin descripción"}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        {recentRooms.length > 0 && (
                          <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <a
                              href="/rooms"
                              class="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium flex items-center"
                            >
                              Ver todas las salas
                              <Icon
                                name="arrow-left"
                                className="h-4 w-4 ml-1 rotate-180"
                              />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </main>
    </div>
  );
}
