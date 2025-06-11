import { type FreshContext, type PageProps } from "$fresh/server.ts";
import {
  type Appointment,
  type AppointmentStatus,
  type AppState,
  type Room,
} from "../../types/index.ts";
import { Icon } from "../../components/ui/Icon.tsx";
import { getAllAppointments, getAllRooms } from "../../lib/kv.ts";
import AppointmentStatusSelector from "../../islands/AppointmentStatusSelector.tsx";
import DeleteAppointmentButton from "../../islands/DeleteAppointmentButton.tsx";

// Función para obtener el color del estado
function getStatusColor(status: AppointmentStatus): string {
  switch (status) {
    case "pending":
      return "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200";
    case "scheduled":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "in_progress":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200";
  }
}

// Función para obtener el texto del estado
function getStatusText(status: AppointmentStatus): string {
  switch (status) {
    case "pending":
      return "Pendiente";
    case "scheduled":
      return "Programada";
    case "in_progress":
      return "En Curso";
    case "completed":
      return "Finalizada";
    case "cancelled":
      return "Cancelada";
    default:
      return "Desconocido";
  }
}

// Función para obtener los siguientes estados posibles
function getNextStatuses(
  currentStatus: AppointmentStatus
): AppointmentStatus[] {
  switch (currentStatus) {
    case "pending":
      return ["scheduled", "cancelled"];
    case "scheduled":
      return ["in_progress", "cancelled"];
    case "in_progress":
      return ["completed", "cancelled"];
    case "completed":
      return []; // No se puede cambiar desde completada
    case "cancelled":
      return ["scheduled"]; // Se puede reprogramar
    default:
      return [];
  }
}

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

export async function handler(_req: Request, ctx: FreshContext<AppState>) {
  const kv = await Deno.openKv();

  try {
    let appointments: Appointment[];
    const rooms = await getAllRooms();

    // Si es superadmin, puede ver todas las citas
    if (ctx.state.user?.role === "superadmin") {
      appointments = await getAllAppointments();
    } else {
      // Si es psicólogo, solo puede ver sus propias citas
      appointments = await getAllAppointments();
      appointments = appointments.filter(
        (appointment) => appointment.psychologistEmail === ctx.state.user?.email
      );
    }

    return ctx.render({ appointments, rooms });
  } finally {
    await kv.close();
  }
}

export default function AppointmentsPage({
  data,
}: PageProps<{ appointments: Appointment[]; rooms: Room[] }, AppState>) {
  const { appointments, rooms: _rooms } = data;

  // Crear un mapa de salas para acceso rápido
  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main class="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div class="sm:flex sm:items-center sm:justify-between">
          <div class="sm:flex-auto">
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Citas
            </h1>
            <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
              Lista de todas las citas programadas en el sistema.
            </p>
          </div>
          <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <a
              href="/appointments/new"
              class="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
            >
              <Icon name="plus" className="h-4 w-4 mr-2" />
              Nueva Cita
            </a>
          </div>
        </div>

        {/* Vista Desktop - Tabla */}
        <div class="mt-8 hidden lg:block">
          <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table class="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Psicólogo
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fecha y Hora
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {appointments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      class="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      <div class="flex flex-col items-center">
                        <Icon
                          name="calendar"
                          className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4"
                        />
                        <p class="text-lg font-medium">
                          No hay citas programadas
                        </p>
                        <p class="mt-1">Comienza creando una nueva cita.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  appointments.map((appointment) => (
                    <tr
                      key={appointment.id}
                      class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {appointment.patientName}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {appointment.psychologistName ||
                          appointment.psychologistEmail}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(
                          `${appointment.appointmentDate}T${appointment.appointmentTime}`
                        ).toLocaleString("es-ES", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center space-x-2">
                          <span
                            class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              appointment.status
                            )}`}
                          >
                            {getStatusText(appointment.status)}
                          </span>
                          {getNextStatuses(appointment.status).length > 0 && (
                            <AppointmentStatusSelector
                              appointmentId={appointment.id}
                              currentStatus={appointment.status}
                              availableStatuses={getNextStatuses(
                                appointment.status
                              )}
                              getStatusText={getStatusText}
                              getStatusColor={getStatusColor}
                            />
                          )}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div class="flex items-center space-x-3">
                          <a
                            href={`/appointments/${appointment.id}`}
                            class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                            title="Ver detalles"
                          >
                            <Icon name="eye" className="h-4 w-4" />
                          </a>
                          <a
                            href={`/appointments/edit/${appointment.id}`}
                            class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                            title="Editar cita"
                          >
                            <Icon name="user-cog" className="h-4 w-4" />
                          </a>
                          <DeleteAppointmentButton
                            appointmentId={appointment.id}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          >
                            <Icon name="trash-2" className="h-4 w-4" />
                          </DeleteAppointmentButton>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vista Mobile - Cards */}
        <div class="mt-6 lg:hidden">
          {appointments.length === 0 ? (
            <div class="text-center py-12">
              <Icon
                name="calendar"
                className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4"
              />
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay citas programadas
              </h3>
              <p class="text-gray-500 dark:text-gray-400 mb-6">
                Comienza creando una nueva cita.
              </p>
              <a
                href="/appointments/new"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                <Icon name="plus" className="h-4 w-4 mr-2" />
                Nueva Cita
              </a>
            </div>
          ) : (
            <div class="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
                >
                  {/* Header de la card */}
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                        {appointment.patientName}
                      </h3>
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        {appointment.psychologistName ||
                          appointment.psychologistEmail}
                      </p>
                    </div>
                    <span
                      class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        appointment.status
                      )}`}
                    >
                      {getStatusText(appointment.status)}
                    </span>
                  </div>

                  {/* Fecha y hora */}
                  <div class="flex items-center mb-4 text-sm text-gray-600 dark:text-gray-400">
                    <Icon name="calendar" className="h-4 w-4 mr-2" />
                    <span>
                      {new Date(
                        `${appointment.appointmentDate}T${appointment.appointmentTime}`
                      ).toLocaleString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Cambio de estado */}
                  {getNextStatuses(appointment.status).length > 0 && (
                    <div class="mb-4">
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Cambiar estado:
                      </label>
                      <AppointmentStatusSelector
                        appointmentId={appointment.id}
                        currentStatus={appointment.status}
                        availableStatuses={getNextStatuses(appointment.status)}
                        getStatusText={getStatusText}
                        getStatusColor={getStatusColor}
                      />
                    </div>
                  )}

                  {/* Acciones */}
                  <div class="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div class="flex items-center space-x-4">
                      <a
                        href={`/appointments/${appointment.id}`}
                        class="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                      >
                        <Icon name="eye" className="h-4 w-4 mr-1" />
                        Ver
                      </a>
                      <a
                        href={`/appointments/edit/${appointment.id}`}
                        class="inline-flex items-center text-sm text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                      >
                        <Icon name="user-cog" className="h-4 w-4 mr-1" />
                        Editar
                      </a>
                    </div>
                    <DeleteAppointmentButton
                      appointmentId={appointment.id}
                      className="inline-flex items-center text-sm text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    >
                      <Icon name="trash-2" className="h-4 w-4 mr-1" />
                      Eliminar
                    </DeleteAppointmentButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
