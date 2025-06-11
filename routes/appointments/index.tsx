import { type PageProps } from "$fresh/server.ts";
import { type FreshContext } from "$fresh/server.ts";
import {
  type Appointment,
  type AppState,
  type User,
} from "../../types/index.ts";
import { Icon } from "../../components/ui/Icon.tsx";
import AppointmentStatusSelector from "../../islands/AppointmentStatusSelector.tsx";
import {
  getStatusColor,
  getStatusText,
} from "../../lib/utils/appointmentUtils.ts";
import { getKv } from "../../lib/kv.ts";
import { AppointmentCard } from "../../components/appointments/AppointmentCard.tsx";
import { Button } from "../../components/ui/Button.tsx";
import AppointmentDetailsModal from "../../islands/AppointmentDetailsModal.tsx";
import AppointmentFilters from "../../islands/AppointmentFilters.tsx";

// Función para formatear fecha
function _formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Función para formatear hora
function _formatTime(timeString: string): string {
  return timeString;
}

interface AppointmentsPageData {
  appointments: Appointment[];
  psychologists: User[];
  currentUser: User;
  filters: {
    psychologistEmail?: string;
    status?: string;
    searchId?: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  const kv = await getKv();
  const url = new URL(req.url);

  // Verificar autenticación usando el middleware
  if (!ctx.state.user) {
    return new Response("", {
      status: 302,
      headers: { Location: "/login" },
    });
  }

  // Obtener usuario completo de la base de datos
  const userResult = await kv.get(["users", ctx.state.user.email]);
  if (!userResult.value) {
    return new Response("", {
      status: 302,
      headers: { Location: "/login" },
    });
  }

  const currentUser = userResult.value as User;

  // Obtener parámetros de paginación
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.max(
    5,
    Math.min(50, parseInt(url.searchParams.get("limit") || "10"))
  );

  // Obtener filtros de la URL
  const filters = {
    psychologistEmail: url.searchParams.get("psychologist") || undefined,
    status: url.searchParams.get("status") || undefined,
    searchId: url.searchParams.get("searchId") || undefined,
  };

  // Obtener todas las citas
  const appointmentsIter = kv.list({ prefix: ["appointments"] });
  const allAppointments: Appointment[] = [];

  for await (const entry of appointmentsIter) {
    allAppointments.push(entry.value as Appointment);
  }

  // Filtrar citas según el rol del usuario
  let filteredAppointments = allAppointments;

  // Si no es superadmin, solo mostrar sus propias citas
  if (currentUser.role !== "superadmin") {
    filteredAppointments = allAppointments.filter(
      (appointment) => appointment.psychologistEmail === currentUser.email
    );
  }

  // Aplicar filtros adicionales
  if (filters.psychologistEmail) {
    filteredAppointments = filteredAppointments.filter(
      (appointment) =>
        appointment.psychologistEmail === filters.psychologistEmail
    );
  }

  if (filters.status) {
    filteredAppointments = filteredAppointments.filter(
      (appointment) => appointment.status === filters.status
    );
  }

  // Búsqueda por ID (solo para superadmin)
  if (filters.searchId && currentUser.role === "superadmin") {
    filteredAppointments = filteredAppointments.filter((appointment) =>
      appointment.id.toLowerCase().includes(filters.searchId!.toLowerCase())
    );
  }

  // Ordenar por fecha y hora
  filteredAppointments.sort((a, b) => {
    const dateA = new Date(`${a.appointmentDate}T${a.appointmentTime}`);
    const dateB = new Date(`${b.appointmentDate}T${b.appointmentTime}`);
    return dateB.getTime() - dateA.getTime();
  });

  // Calcular paginación
  const total = filteredAppointments.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const paginatedAppointments = filteredAppointments.slice(
    offset,
    offset + limit
  );

  const pagination = {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };

  // Obtener lista de psicólogos para el filtro (solo para superadmin)
  const psychologists: User[] = [];
  if (currentUser.role === "superadmin") {
    const usersIter = kv.list({ prefix: ["users"] });
    for await (const entry of usersIter) {
      const user = entry.value as User;
      if (user.role === "psychologist") {
        psychologists.push(user);
      }
    }
  }

  return ctx.render({
    appointments: paginatedAppointments,
    psychologists,
    currentUser,
    filters,
    pagination,
  });
}

export default function AppointmentsPage({
  data,
}: PageProps<AppointmentsPageData>) {
  const { appointments, psychologists, currentUser, filters, pagination } =
    data;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-ES", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Función para construir URL de paginación
  const buildPaginationUrl = (newPage: number) => {
    const params = new URLSearchParams();
    if (filters.psychologistEmail)
      params.set("psychologist", filters.psychologistEmail);
    if (filters.status) params.set("status", filters.status);
    if (filters.searchId) params.set("searchId", filters.searchId);
    params.set("page", newPage.toString());
    params.set("limit", pagination.limit.toString());
    return `/appointments?${params.toString()}`;
  };

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            Citas Médicas
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            {currentUser.role === "superadmin"
              ? "Gestiona todas las citas del sistema"
              : "Gestiona tus citas programadas"}
          </p>
          <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
            <span class="flex items-center space-x-1">
              <Icon name="file-digit" size={14} />
              <span>Total: {pagination.total} citas</span>
            </span>
            <span class="flex items-center space-x-1">
              <Icon name="eye" size={14} />
              <span>
                Mostrando: {appointments.length} de {pagination.total}
              </span>
            </span>
          </div>
        </div>

        <div class="flex items-center space-x-3">
          <Button
            href="/appointments/new"
            variant="primary"
            class="shadow-lg hover:shadow-xl transition-shadow"
          >
            <Icon name="calendar-plus" size={16} className="mr-2" />
            Nueva Cita
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <AppointmentFilters
        psychologists={psychologists}
        currentUser={currentUser}
        filters={filters}
      />

      {/* Estadísticas rápidas */}
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        {(
          [
            "pending",
            "scheduled",
            "in_progress",
            "completed",
            "cancelled",
          ] as const
        ).map((status) => {
          const count = appointments.filter((a) => a.status === status).length;
          return (
            <div
              key={status}
              class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div class="text-center">
                <div
                  class={`text-2xl font-bold ${
                    getStatusColor(status).includes("yellow")
                      ? "text-yellow-600"
                      : getStatusColor(status).includes("blue")
                      ? "text-blue-600"
                      : getStatusColor(status).includes("purple")
                      ? "text-purple-600"
                      : getStatusColor(status).includes("green")
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {count}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {getStatusText(status)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lista de citas */}
      {appointments.length === 0 ? (
        <div class="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Icon
            name="calendar"
            size={64}
            className="mx-auto text-gray-400 mb-4"
          />
          <h3 class="text-xl font-medium text-gray-900 dark:text-white mb-2">
            No hay citas
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {filters.psychologistEmail || filters.status || filters.searchId
              ? "No se encontraron citas con los filtros aplicados. Intenta ajustar los criterios de búsqueda."
              : "Aún no tienes citas programadas. Crea tu primera cita para comenzar."}
          </p>
          <Button href="/appointments/new" variant="primary" size="lg">
            <Icon name="calendar-plus" size={20} className="mr-2" />
            Crear Primera Cita
          </Button>
        </div>
      ) : (
        <>
          {/* Vista de escritorio - Tabla mejorada */}
          <div class="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                  <tr>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Paciente
                    </th>
                    {currentUser.role === "superadmin" && (
                      <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Psicólogo
                      </th>
                    )}
                    <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Fecha y Hora
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Sala
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Detalles
                    </th>
                    <th class="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {appointments.map((appointment, index) => (
                    <tr
                      key={appointment.id}
                      class={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        index % 2 === 0
                          ? "bg-white dark:bg-gray-800"
                          : "bg-gray-50/30 dark:bg-gray-700/20"
                      }`}
                    >
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                          <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <Icon
                              name="user"
                              size={16}
                              className="text-white"
                            />
                          </div>
                          <div class="ml-3">
                            <div class="text-sm font-medium text-gray-900 dark:text-white">
                              {appointment.patientName}
                            </div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              ID: {appointment.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      {currentUser.role === "superadmin" && (
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="flex items-center">
                            <Icon
                              name="user-cog"
                              size={16}
                              className="text-gray-400 mr-2"
                            />
                            <div class="text-sm text-gray-600 dark:text-gray-300">
                              {appointment.psychologistName ||
                                appointment.psychologistEmail}
                            </div>
                          </div>
                        </td>
                      )}

                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center space-x-2">
                          <Icon
                            name="calendar"
                            size={16}
                            className="text-gray-400"
                          />
                          <div>
                            <div class="text-sm font-medium text-gray-900 dark:text-white">
                              {formatDate(appointment.appointmentDate)}
                            </div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                              <Icon name="clock" size={12} className="mr-1" />
                              {formatTime(appointment.appointmentTime)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                          <Icon
                            name="briefcase"
                            size={16}
                            className="text-gray-400 mr-2"
                          />
                          <span class="text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                            {appointment.roomId}
                          </span>
                        </div>
                      </td>

                      <td class="px-6 py-4 whitespace-nowrap">
                        <AppointmentStatusSelector
                          appointmentId={appointment.id}
                          currentStatus={appointment.status}
                        />
                      </td>

                      <td class="px-6 py-4 whitespace-nowrap">
                        <AppointmentDetailsModal appointment={appointment} />
                      </td>

                      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div class="flex items-center justify-end space-x-2">
                          <a
                            href={`/appointments/edit/${appointment.id}`}
                            class="inline-flex items-center p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 rounded-lg transition-all duration-200 border border-blue-200 dark:border-blue-800"
                            title="Editar cita"
                          >
                            <Icon name="edit" size={16} />
                          </a>
                          <a
                            href={`/appointments/delete/${appointment.id}`}
                            class="inline-flex items-center p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/50 rounded-lg transition-all duration-200 border border-red-200 dark:border-red-800"
                            title="Eliminar cita"
                          >
                            <Icon name="trash-2" size={16} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vista móvil y tablet - Cards */}
          <div class="lg:hidden space-y-4">
            {appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onEdit={(id) =>
                  (globalThis.location.href = `/appointments/edit/${id}`)
                }
                onDelete={(id) => {
                  if (
                    confirm("¿Estás seguro de que quieres eliminar esta cita?")
                  ) {
                    globalThis.location.href = `/appointments/delete/${id}`;
                  }
                }}
              />
            ))}
          </div>

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  <span class="text-gray-400">•</span>
                  <span>{pagination.total} citas en total</span>
                </div>

                <div class="flex items-center space-x-2">
                  {/* Botón anterior */}
                  {pagination.hasPrev ? (
                    <a
                      href={buildPaginationUrl(pagination.page - 1)}
                      class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Icon name="arrow-left" size={16} className="mr-1" />
                      Anterior
                    </a>
                  ) : (
                    <span class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg cursor-not-allowed">
                      <Icon name="arrow-left" size={16} className="mr-1" />
                      Anterior
                    </span>
                  )}

                  {/* Números de página */}
                  <div class="flex items-center space-x-1">
                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        const pageNum =
                          Math.max(
                            1,
                            Math.min(
                              pagination.totalPages - 4,
                              pagination.page - 2
                            )
                          ) + i;

                        if (pageNum > pagination.totalPages) return null;

                        return (
                          <a
                            key={pageNum}
                            href={buildPaginationUrl(pageNum)}
                            class={`inline-flex items-center justify-center w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                              pageNum === pagination.page
                                ? "bg-blue-600 text-white shadow-lg"
                                : "text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                            }`}
                          >
                            {pageNum}
                          </a>
                        );
                      }
                    )}
                  </div>

                  {/* Botón siguiente */}
                  {pagination.hasNext ? (
                    <a
                      href={buildPaginationUrl(pagination.page + 1)}
                      class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      Siguiente
                      <Icon
                        name="arrow-left"
                        size={16}
                        className="ml-1 rotate-180"
                      />
                    </a>
                  ) : (
                    <span class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg cursor-not-allowed">
                      Siguiente
                      <Icon
                        name="arrow-left"
                        size={16}
                        className="ml-1 rotate-180"
                      />
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
