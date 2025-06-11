import { type PageProps, type FreshContext } from "$fresh/server.ts";
import { type AppState, type Appointment } from "../../types/index.ts";
import { Icon } from "../../components/ui/Icon.tsx";
import { getAllAppointments } from "../../lib/kv.ts";

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  const kv = await Deno.openKv();

  try {
    const appointments = await getAllAppointments();
    return ctx.render({ appointments });
  } finally {
    await kv.close();
  }
}

export default function AppointmentsPage({
  data,
}: PageProps<{ appointments: Appointment[] }, AppState>) {
  const { appointments } = data;

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="sm:flex sm:items-center">
            <div class="sm:flex-auto">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                Citas
              </h1>
              <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Lista de todas las citas programadas en el sistema.
              </p>
            </div>
            <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
              <a
                href="/appointments/new"
                class="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <Icon name="plus" className="h-4 w-4 mr-2" />
                Nueva Cita
              </a>
            </div>
          </div>

          <div class="mt-8 flow-root">
            <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                  <table class="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th
                          scope="col"
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Paciente
                        </th>
                        <th
                          scope="col"
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Psicólogo
                        </th>
                        <th
                          scope="col"
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Fecha y Hora
                        </th>
                        <th
                          scope="col"
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Estado
                        </th>
                        <th scope="col" class="relative px-6 py-3">
                          <span class="sr-only">Acciones</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {appointments.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                          >
                            No hay citas programadas
                          </td>
                        </tr>
                      ) : (
                        appointments.map((appointment) => (
                          <tr
                            key={appointment.id}
                            class="hover:bg-gray-50 dark:hover:bg-gray-800"
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
                              ).toLocaleString()}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <span
                                class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  appointment.status === "scheduled"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                    : appointment.status === "completed"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                }`}
                              >
                                {appointment.status === "scheduled"
                                  ? "Programada"
                                  : appointment.status === "completed"
                                  ? "Completada"
                                  : "Cancelada"}
                              </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <a
                                href={`/appointments/${appointment.id}`}
                                class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                                title="Ver detalles de la cita"
                              >
                                <Icon name="eye" className="h-4 w-4" />
                              </a>
                              <button
                                title="Eliminar cita"
                                class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                onClick={() => {
                                  if (
                                    confirm(
                                      "¿Estás seguro de que quieres eliminar esta cita?"
                                    )
                                  ) {
                                    window.location.href = `/api/appointments/${appointment.id}/delete`;
                                  }
                                }}
                              >
                                <Icon name="trash-2" className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
