import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { getAllAppointments } from "../../lib/kv.ts";
import AppointmentDetailsModal from "../../islands/AppointmentDetailsModal.tsx";
import AppointmentStatusSelector from "../../islands/AppointmentStatusSelector.tsx";
import { Button } from "../../components/ui/Button.tsx";
import { Icon } from "../../components/ui/Icon.tsx";
import type { Appointment, AppointmentStatus } from "../../types/index.ts";

interface AppointmentsPageData {
  appointments: Appointment[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
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

      // Aplicar filtros
      if (search) {
        const searchLower = search.toLowerCase();
        allAppointments = allAppointments.filter(
          (apt) =>
            apt.patientName.toLowerCase().includes(searchLower) ||
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
        allAppointments = allAppointments.filter((apt) =>
          apt.psychologistEmail
            .toLowerCase()
            .includes(psychologist.toLowerCase())
        );
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
        filters: { search, status, psychologist, date },
      });
    } catch (error) {
      console.error("Error loading appointments:", error);
      return ctx.render({
        appointments: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 1,
        filters: {},
      });
    }
  },
};

export default function AppointmentsPage({
  data,
}: PageProps<AppointmentsPageData>) {
  const { appointments, totalCount, currentPage, totalPages, filters } = data;

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
              <Button
                variant="primary"
                class="flex items-center gap-2 px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => (globalThis.location.href = "/appointments/new")}
              >
                <Icon name="calendar-plus" className="h-5 w-5" />
                Nueva Cita
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <div class="mb-8">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-2">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Filtros de Búsqueda
                  </h3>
                </div>
                {(filters.search ||
                  filters.status ||
                  filters.psychologist ||
                  filters.date) && (
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Filtros activos
                  </span>
                )}
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Búsqueda general */}
                <div class="space-y-2">
                  <label class="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Icon name="hash" className="h-4 w-4 text-gray-500" />
                    <span>Buscar</span>
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Icon name="hash" className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Paciente, psicólogo o ID..."
                      value={filters.search || ""}
                      onInput={(e) => {
                        const value = (e.target as HTMLInputElement).value;
                        const url = buildUrl({
                          ...filters,
                          search: value || undefined,
                          page: 1,
                        });
                        globalThis.location.href = url;
                      }}
                      class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                </div>

                {/* Filtro por estado */}
                <div class="space-y-2">
                  <label class="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Icon name="circle" className="h-4 w-4 text-gray-500" />
                    <span>Estado</span>
                  </label>
                  <select
                    value={filters.status || ""}
                    onChange={(e) => {
                      const value = (e.target as HTMLSelectElement).value;
                      const url = buildUrl({
                        ...filters,
                        status: value || undefined,
                        page: 1,
                      });
                      globalThis.location.href = url;
                    }}
                    title="Filtrar por estado de cita"
                    aria-label="Filtrar por estado de cita"
                    class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value="">Todos los estados</option>
                    <option value="pending">🟡 Pendiente</option>
                    <option value="scheduled">🔵 Programada</option>
                    <option value="in_progress">🟣 En Progreso</option>
                    <option value="completed">🟢 Completada</option>
                    <option value="cancelled">🔴 Cancelada</option>
                  </select>
                </div>

                {/* Filtro por psicólogo */}
                <div class="space-y-2">
                  <label class="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Icon name="user-cog" className="h-4 w-4 text-gray-500" />
                    <span>Psicólogo</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Email del psicólogo..."
                    value={filters.psychologist || ""}
                    onInput={(e) => {
                      const value = (e.target as HTMLInputElement).value;
                      const url = buildUrl({
                        ...filters,
                        psychologist: value || undefined,
                        page: 1,
                      });
                      globalThis.location.href = url;
                    }}
                    class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>

                {/* Filtro por fecha */}
                <div class="space-y-2">
                  <label class="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Icon name="calendar" className="h-4 w-4 text-gray-500" />
                    <span>Fecha</span>
                  </label>
                  <input
                    type="date"
                    value={filters.date || ""}
                    onChange={(e) => {
                      const value = (e.target as HTMLInputElement).value;
                      const url = buildUrl({
                        ...filters,
                        date: value || undefined,
                        page: 1,
                      });
                      globalThis.location.href = url;
                    }}
                    title="Filtrar por fecha de cita"
                    aria-label="Filtrar por fecha de cita"
                    class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
              </div>

              {/* Limpiar filtros */}
              {(filters.search ||
                filters.status ||
                filters.psychologist ||
                filters.date) && (
                <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Icon name="check" className="h-4 w-4 text-green-500" />
                      <span>
                        Filtros aplicados:{" "}
                        {[
                          filters.search && "Búsqueda",
                          filters.status && "Estado",
                          filters.psychologist && "Psicólogo",
                          filters.date && "Fecha",
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        (globalThis.location.href = "/appointments")
                      }
                      class="inline-flex items-center gap-1"
                    >
                      <Icon name="x" className="h-3 w-3" />
                      Limpiar Filtros
                    </Button>
                  </div>
                </div>
              )}
            </div>
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
              <Button
                variant="primary"
                onClick={() => (globalThis.location.href = "/appointments/new")}
                class="inline-flex items-center gap-2"
              >
                <Icon name="calendar-plus" className="h-5 w-5" />
                Crear Primera Cita
              </Button>
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
                              {appointment.psychologistEmail}
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
                          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <AppointmentDetailsModal
                              appointment={appointment}
                            />
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                (globalThis.location.href = `/appointments/edit/${appointment.id}`)
                              }
                              class="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                            >
                              <Icon name="edit" className="h-3 w-3" />
                              Editar
                            </Button>
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
                          {appointment.psychologistEmail}
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
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          (globalThis.location.href = `/appointments/edit/${appointment.id}`)
                        }
                        class="inline-flex items-center gap-1"
                      >
                        <Icon name="edit" className="h-3 w-3" />
                        Editar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div class="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-4">
                  <div class="flex items-center justify-between">
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
