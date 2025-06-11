import { type FreshContext, type PageProps } from "$fresh/server.ts";
import { type Appointment, type AppState } from "../../types/index.ts";
import { Icon } from "../../components/ui/Icon.tsx";
import { getAppointmentById } from "../../lib/kv.ts";
import DeleteAppointmentButton from "../../islands/DeleteAppointmentButton.tsx";

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return new Response("ID de cita requerido", { status: 400 });
  }

  const kv = await Deno.openKv();

  try {
    const appointment = await getAppointmentById(id);

    if (!appointment) {
      return new Response("Cita no encontrada", { status: 404 });
    }

    return ctx.render({ appointment });
  } finally {
    await kv.close();
  }
}

export default function AppointmentDetailPage({
  data,
}: PageProps<{ appointment: Appointment }, AppState>) {
  const { appointment } = data;

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          {/* Header */}
          <div class="mb-8">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                  Detalles de la Cita
                </h1>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Información completa de la cita programada
                </p>
              </div>
              <a
                href="/appointments"
                class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Icon name="arrow-left" className="h-4 w-4 mr-2" />
                Volver a Citas
              </a>
            </div>
          </div>

          {/* Appointment Details */}
          <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-lg font-medium text-gray-900 dark:text-white">
                Información de la Cita
              </h2>
            </div>

            <div class="px-6 py-4 space-y-6">
              {/* Patient Information */}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Icon name="user" className="h-4 w-4 inline mr-2" />
                    Paciente
                  </label>
                  <p class="text-lg text-gray-900 dark:text-white">
                    {appointment.patientName}
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Icon name="user-cog" className="h-4 w-4 inline mr-2" />
                    Psicólogo
                  </label>
                  <p class="text-lg text-gray-900 dark:text-white">
                    {appointment.psychologistName ||
                      appointment.psychologistEmail}
                  </p>
                </div>
              </div>

              {/* Date and Time */}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Icon name="calendar" className="h-4 w-4 inline mr-2" />
                    Fecha
                  </label>
                  <p class="text-lg text-gray-900 dark:text-white">
                    {new Date(appointment.appointmentDate).toLocaleDateString(
                      "es-ES",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Icon name="clock" className="h-4 w-4 inline mr-2" />
                    Hora
                  </label>
                  <p class="text-lg text-gray-900 dark:text-white">
                    {appointment.appointmentTime}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Icon name="circle" className="h-4 w-4 inline mr-2" />
                  Estado
                </label>
                <span
                  class={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
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
              </div>

              {/* Notes */}
              {appointment.notes && (
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Icon name="file-warning" className="h-4 w-4 inline mr-2" />
                    Notas
                  </label>
                  <p class="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                    {appointment.notes}
                  </p>
                </div>
              )}

              {/* Created Date */}
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Icon name="calendar-plus" className="h-4 w-4 inline mr-2" />
                  Fecha de Creación
                </label>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(appointment.createdAt).toLocaleString("es-ES")}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <DeleteAppointmentButton
                appointmentId={appointment.id}
                className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-600 rounded-md shadow-sm text-sm font-medium text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Icon name="trash-2" className="h-4 w-4 mr-2" />
                Eliminar Cita
              </DeleteAppointmentButton>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
