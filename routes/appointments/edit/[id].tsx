import { type PageProps, type FreshContext } from "$fresh/server.ts";
import {
  type AppState,
  type Appointment,
  type UserProfile,
} from "../../../types/index.ts";
import { Icon } from "../../../components/ui/Icon.tsx";

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  const appointmentId = ctx.params.id;

  if (!appointmentId) {
    return new Response("ID de cita requerido", { status: 400 });
  }

  const kv = await Deno.openKv();

  try {
    // Obtener la cita
    const appointmentEntry = await kv.get(["appointments", appointmentId]);

    if (!appointmentEntry.value) {
      return new Response("Cita no encontrada", { status: 404 });
    }

    const appointment = appointmentEntry.value as Appointment;

    // Obtener lista de psicólogos
    const psychologists: UserProfile[] = [];
    const iter = kv.list({ prefix: ["users"] });

    for await (const entry of iter) {
      const user = entry.value as UserProfile;
      if (user.role === "psychologist") {
        psychologists.push(user);
      }
    }

    // Si es POST, procesar la actualización
    if (req.method === "POST") {
      const formData = await req.formData();
      const patientName = formData.get("patientName")?.toString();
      const psychologistEmail = formData.get("psychologistEmail")?.toString();
      const appointmentDate = formData.get("appointmentDate")?.toString();
      const appointmentTime = formData.get("appointmentTime")?.toString();
      const notes = formData.get("notes")?.toString();

      if (
        !patientName ||
        !psychologistEmail ||
        !appointmentDate ||
        !appointmentTime
      ) {
        return ctx.render({
          appointment,
          psychologists,
          error: "Todos los campos son requeridos",
        });
      }

      // Buscar el nombre del psicólogo
      const psychologist = psychologists.find(
        (p) => p.email === psychologistEmail
      );

      const updatedAppointment: Appointment = {
        ...appointment,
        patientName,
        psychologistEmail,
        psychologistName: psychologist?.name,
        appointmentDate,
        appointmentTime,
        notes,
        updatedAt: new Date().toISOString(),
      };

      // Actualizar en la base de datos
      const result = await kv
        .atomic()
        .check(appointmentEntry)
        .set(["appointments", appointmentId], updatedAppointment)
        .commit();

      if (result.ok) {
        return new Response("", {
          status: 302,
          headers: { Location: "/appointments" },
        });
      } else {
        return ctx.render({
          appointment,
          psychologists,
          error: "Error al actualizar la cita",
        });
      }
    }

    return ctx.render({ appointment, psychologists });
  } finally {
    await kv.close();
  }
}

export default function EditAppointmentPage({
  data,
}: PageProps<
  {
    appointment: Appointment;
    psychologists: UserProfile[];
    error?: string;
  },
  AppState
>) {
  const { appointment, psychologists, error } = data;

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main class="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div class="mb-8">
          <div class="flex items-center mb-4">
            <a
              href="/appointments"
              class="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <Icon name="arrow-left" className="h-4 w-4 mr-2" />
              Volver a Citas
            </a>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            Editar Cita
          </h1>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Modifica los detalles de la cita programada.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div class="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div class="flex">
              <Icon name="x" className="h-5 w-5 text-red-400 mr-2" />
              <p class="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div class="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
          <form method="POST" class="p-6 space-y-6">
            {/* Nombre del Paciente */}
            <div>
              <label
                htmlFor="patientName"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Nombre del Paciente
              </label>
              <input
                type="text"
                id="patientName"
                name="patientName"
                value={appointment.patientName}
                required
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                placeholder="Ingresa el nombre completo del paciente"
              />
            </div>

            {/* Psicólogo */}
            <div>
              <label
                htmlFor="psychologistEmail"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Psicólogo Asignado
              </label>
              <select
                id="psychologistEmail"
                name="psychologistEmail"
                required
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              >
                <option value="">Selecciona un psicólogo</option>
                {psychologists.map((psychologist) => (
                  <option
                    key={psychologist.email}
                    value={psychologist.email}
                    selected={
                      psychologist.email === appointment.psychologistEmail
                    }
                  >
                    {psychologist.name || psychologist.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha y Hora */}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="appointmentDate"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Fecha de la Cita
                </label>
                <input
                  type="date"
                  id="appointmentDate"
                  name="appointmentDate"
                  value={appointment.appointmentDate}
                  required
                  class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="appointmentTime"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Hora de la Cita
                </label>
                <input
                  type="time"
                  id="appointmentTime"
                  name="appointmentTime"
                  value={appointment.appointmentTime}
                  required
                  class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
              </div>
            </div>

            {/* Notas */}
            <div>
              <label
                htmlFor="notes"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Notas (Opcional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={appointment.notes || ""}
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                placeholder="Agrega notas adicionales sobre la cita..."
              />
            </div>

            {/* Estado Actual */}
            <div class="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
              <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado Actual
              </h3>
              <span
                class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  appointment.status === "pending"
                    ? "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                    : appointment.status === "scheduled"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    : appointment.status === "in_progress"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    : appointment.status === "completed"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}
              >
                {appointment.status === "pending"
                  ? "Pendiente"
                  : appointment.status === "scheduled"
                  ? "Programada"
                  : appointment.status === "in_progress"
                  ? "En Curso"
                  : appointment.status === "completed"
                  ? "Finalizada"
                  : "Cancelada"}
              </span>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Para cambiar el estado, ve a la lista de citas.
              </p>
            </div>

            {/* Botones */}
            <div class="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                class="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <Icon name="check" className="h-4 w-4 mr-2" />
                Guardar Cambios
              </button>

              <a
                href="/appointments"
                class="inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Cancelar
              </a>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
