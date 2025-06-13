import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { getAllAppointments, getUsersByRole } from "../../lib/kv.ts";
import AppointmentDetailsModal from "../../islands/AppointmentDetailsModal.tsx";
import AppointmentStatusSelector from "../../islands/AppointmentStatusSelector.tsx";
import AppointmentFilters from "../../islands/AppointmentFilters.tsx";

import { Icon } from "../../components/ui/Icon.tsx";
import type {
  Appointment,
  AppointmentStatus,
  UserProfile,
} from "../../types/index.ts";
import DeleteAppointmentButton from "../../islands/DeleteAppointmentButton.tsx";

interface AppointmentsPageData {
  appointments: Appointment[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  psychologists: UserProfile[];
  currentUser: UserProfile | null;
  filters: {
    search?: string;
    status?: AppointmentStatus;
    psychologist?: string;
    date?: string;
  };
}

export const handler: Handlers<AppointmentsPageData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const search = url.searchParams.get("search") || "";
    const status = (url.searchParams.get("status") as AppointmentStatus) || "";
    const psychologist = url.searchParams.get("psychologist") || "";
    const date = url.searchParams.get("date") || "";

    try {
      let allAppointments = await getAllAppointments();
      const psychologists = await getUsersByRole("psychologist");
      const currentUser = ctx.state.user as UserProfile | null;

      // Aplicar filtros
      if (search) {
        const searchLower = search.toLowerCase();
        allAppointments = allAppointments.filter(
          (apt) =>
            apt.patientName.toLowerCase().includes(searchLower) ||
            (apt.psychologistName &&
              apt.psychologistName.toLowerCase().includes(searchLower)) ||
            apt.psychologistEmail.toLowerCase().includes(searchLower) ||
            apt.id.toLowerCase().includes(searchLower)
        );
      }

      if (status) {
        allAppointments = allAppointments.filter(
          (apt) => apt.status === status
        );
      }

      if (psychologist) {
        allAppointments = allAppointments.filter((apt) => {
          const psychologistLower = psychologist.toLowerCase();
          return (
            (apt.psychologistName &&
              apt.psychologistName.toLowerCase().includes(psychologistLower)) ||
            apt.psychologistEmail.toLowerCase().includes(psychologistLower)
          );
        });
      }

      if (date) {
        allAppointments = allAppointments.filter(
          (apt) => apt.appointmentDate === date
        );
      }

      const totalCount = allAppointments.length;
      const totalPages = Math.ceil(totalCount / limit);
      const startIndex = (page - 1) * limit;
      const appointments = allAppointments.slice(
        startIndex,
        startIndex + limit
      );

      return ctx.render({
        appointments,
        totalCount,
        currentPage: page,
        totalPages,
        psychologists,
        currentUser,
        filters: { search, status, psychologist, date },
      });
    } catch (error) {
      console.error("Error loading appointments:", error);
      return ctx.render({
        appointments: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 1,
        psychologists: [],
        currentUser: null,
        filters: {},
      });
    }
  },
};

export default function AppointmentsPage({
  data,
}: PageProps<AppointmentsPageData>) {
  const {
    appointments,
    totalCount,
    currentPage,
    totalPages,
    psychologists,
    currentUser,
    filters,
  } = data;

  const buildUrl = (params: Record<string, string | number | undefined>) => {
    const url = new URL(
      "/appointments",
      globalThis.location?.origin || "http://localhost:8000"
    );
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, value.toString());
      }
    });
    return url.pathname + url.search;
  };

  const getPaginationPages = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <>
      <Head>
        <title>Gestión de Citas - Horizonte Clínica</title>
        <meta
          name="description"
          content="Gestiona todas las citas de la clínica"
        />
      </Head>

      {/* Usar el mismo container que header/footer */}
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header de la página */}
          <div class="mb-8">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <Icon name="calendar" className="h-8 w-8 text-blue-600" />
                  Gestión de Citas
                </h1>
                <p class="mt-2 text-gray-600 dark:text-gray-400">
                  Administra y supervisa todas las citas de la clínica
                </p>
              </div>
              <a
                href="/appointments/new"
                class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Icon
                  name="calendar-plus"
                  className="h-5 w-5 filter brightness-0 invert"
                  disableAutoFilter
                />
                Nueva Cita
              </a>
            </div>
          </div>

          {/* Filtros */}
          <div class="mb-8">
            {currentUser && (
              <AppointmentFilters
                psychologists={psychologists}
                currentUser={currentUser}
                filters={filters}
              />
            )}
          </div>

          {/* Estadísticas rápidas */}
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total de Citas
                  </p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalCount}
                  </p>
                </div>
                <div class="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Icon
                    name="calendar"
                    className="h-6 w-6 text-blue-600 dark:text-blue-400"
                  />
                </div>
              </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Mostrando
                  </p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    {appointments.length}
                  </p>
                </div>
                <div class="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Icon
                    name="eye"
                    className="h-6 w-6 text-green-600 dark:text-green-400"
                  />
                </div>
              </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Página Actual
                  </p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentPage}
                  </p>
                </div>
                <div class="h-12 w-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Icon
                    name="file-digit"
                    className="h-6 w-6 text-purple-600 dark:text-purple-400"
                  />
                </div>
              </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Páginas
                  </p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalPages}
                  </p>
                </div>
                <div class="h-12 w-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <Icon
                    name="file-digit"
                    className="h-6 w-6 text-orange-600 dark:text-orange-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          {appointments.length === 0 ? (
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Icon
                name="calendar"
                className="h-16 w-16 text-gray-400 mx-auto mb-4"
              />
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No se encontraron citas
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-6">
                {totalCount === 0
                  ? "Aún no hay citas registradas en el sistema."
                  : "No hay citas que coincidan con los filtros aplicados."}
              </p>
              <a
                href="/appointments/new"
                class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Icon
                  name="calendar-plus"
                  className="h-5 w-5 filter brightness-0 invert"
                  disableAutoFilter
                />
                Crear Primera Cita
              </a>
            </div>
          ) : (
            <>
              {/* Tabla para desktop */}
              <div class="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                      <tr>
                        <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          ID / Paciente
                        </th>
                        <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Psicólogo
                        </th>
                        <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Fecha y Hora
                        </th>
                        <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Estado
                        </th>
                        <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {appointments.map((appointment, index) => (
                        <tr
                          key={appointment.id}
                          class={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            index % 2 === 0
                              ? "bg-white dark:bg-gray-800"
                              : "bg-gray-50/50 dark:bg-gray-700/50"
                          }`}
                        >
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center space-x-3">
                              <div class="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                {appointment.patientName
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <div class="text-sm font-medium text-gray-900 dark:text-white">
                                  {appointment.patientName}
                                </div>
                                <div class="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                  {appointment.id.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900 dark:text-white">
                              {appointment.psychologistName ||
                                appointment.psychologistEmail}
                            </div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900 dark:text-white">
                              {appointment.appointmentDate}
                            </div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">
                              {appointment.appointmentTime}
                            </div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <AppointmentStatusSelector
                              appointmentId={appointment.id}
                              currentStatus={appointment.status}
                            />
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div class="flex items-center space-x-2">
                              {/* Botón Ver */}
                              <AppointmentDetailsModal
                                appointment={appointment}
                              />

                              {/* Botón Editar */}
                              <a
                                href={`/appointments/edit/${appointment.id}`}
                                class="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Editar cita"
                              >
                                <Icon
                                  name="edit"
                                  size={16}
                                  className="text-current"
                                />
                              </a>

                              {/* Botón Eliminar */}
                              <DeleteAppointmentButton
                                appointmentId={appointment.id}
                                className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <Icon
                                  name="trash-2"
                                  size={16}
                                  className="text-current"
                                />
                              </DeleteAppointmentButton>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cards para mobile/tablet */}
              <div class="lg:hidden space-y-4">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <div class="flex items-start justify-between mb-4">
                      <div class="flex items-center space-x-3">
                        <div class="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                          {appointment.patientName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                            {appointment.patientName}
                          </h3>
                          <p class="text-sm text-gray-500 dark:text-gray-400 font-mono">
                            {appointment.id.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <AppointmentStatusSelector
                        appointmentId={appointment.id}
                        currentStatus={appointment.status}
                      />
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Psicólogo
                        </p>
                        <p class="text-sm text-gray-900 dark:text-white mt-1">
                          {appointment.psychologistName ||
                            appointment.psychologistEmail}
                        </p>
                      </div>
                      <div>
                        <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Fecha y Hora
                        </p>
                        <p class="text-sm text-gray-900 dark:text-white mt-1">
                          {appointment.appointmentDate}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          {appointment.appointmentTime}
                        </p>
                      </div>
                    </div>

                    <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <AppointmentDetailsModal appointment={appointment} />
                      <div class="flex items-center space-x-2">
                        <a
                          href={`/appointments/edit/${appointment.id}`}
                          class="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Editar cita"
                        >
                          <Icon
                            name="edit"
                            size={16}
                            className="text-current"
                          />
                        </a>
                        <DeleteAppointmentButton
                          appointmentId={appointment.id}
                          className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Icon
                            name="trash-2"
                            size={16}
                            className="text-current"
                          />
                        </DeleteAppointmentButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div class="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
                  {/* Información de resultados - Móvil */}
                  <div class="sm:hidden text-center mb-4">
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                      Página {currentPage} de {totalPages}
                    </span>
                    <div class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {totalCount} citas en total
                    </div>
                  </div>

                  {/* Paginación móvil - Solo botones anterior/siguiente y página actual */}
                  <div class="sm:hidden flex items-center justify-between">
                    <a
                      href={
                        currentPage > 1
                          ? buildUrl({ ...filters, page: currentPage - 1 })
                          : "#"
                      }
                      class={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage > 1
                          ? "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                          : "text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <Icon name="arrow-left" size={16} className="mr-1" />
                      Anterior
                    </a>

                    <div class="flex items-center space-x-1">
                      {/* Solo mostrar página actual y adyacentes en móvil */}
                      {currentPage > 1 && (
                        <a
                          href={buildUrl({ ...filters, page: currentPage - 1 })}
                          class="px-2 py-1 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {currentPage - 1}
                        </a>
                      )}

                      <span class="px-3 py-1 rounded bg-blue-600 text-white text-sm font-medium">
                        {currentPage}
                      </span>

                      {currentPage < totalPages && (
                        <a
                          href={buildUrl({ ...filters, page: currentPage + 1 })}
                          class="px-2 py-1 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {currentPage + 1}
                        </a>
                      )}
                    </div>

                    <a
                      href={
                        currentPage < totalPages
                          ? buildUrl({ ...filters, page: currentPage + 1 })
                          : "#"
                      }
                      class={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage < totalPages
                          ? "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                          : "text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      Siguiente
                      <Icon
                        name="arrow-left"
                        size={16}
                        className="ml-1 rotate-180"
                      />
                    </a>
                  </div>

                  {/* Paginación desktop - Versión completa */}
                  <div class="hidden sm:flex items-center justify-between">
                    <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        Mostrando {(currentPage - 1) * 10 + 1} -{" "}
                        {Math.min(currentPage * 10, totalCount)} de {totalCount}{" "}
                        citas
                      </span>
                    </div>

                    <div class="flex items-center space-x-1">
                      {/* Botón anterior */}
                      <a
                        href={
                          currentPage > 1
                            ? buildUrl({ ...filters, page: currentPage - 1 })
                            : "#"
                        }
                        class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage > 1
                            ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                        }`}
                      >
                        Anterior
                      </a>

                      {/* Números de página */}
                      {getPaginationPages().map((page, index) => (
                        <span key={index}>
                          {page === "..." ? (
                            <span class="px-3 py-2 text-gray-400 dark:text-gray-600">
                              ...
                            </span>
                          ) : (
                            <a
                              href={buildUrl({ ...filters, page })}
                              class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                currentPage === page
                                  ? "bg-blue-600 text-white"
                                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              }`}
                            >
                              {page}
                            </a>
                          )}
                        </span>
                      ))}

                      {/* Botón siguiente */}
                      <a
                        href={
                          currentPage < totalPages
                            ? buildUrl({ ...filters, page: currentPage + 1 })
                            : "#"
                        }
                        class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage < totalPages
                            ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                        }`}
                      >
                        Siguiente
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
