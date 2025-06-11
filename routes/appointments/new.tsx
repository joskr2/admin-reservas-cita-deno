import { type PageProps, type FreshContext } from "$fresh/server.ts";
import { type AppState, type UserProfile } from "../../types/index.ts";
import { Icon } from "../../components/ui/Icon.tsx";
import { Button } from "../../components/ui/Button.tsx";
import { Input } from "../../components/ui/Input.tsx";
import { Select } from "../../components/ui/Select.tsx";
import { getAllUsers, createAppointment } from "../../lib/kv.ts";

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  if (req.method === "GET") {
    const kv = await Deno.openKv();

    try {
      const users = await getAllUsers();
      const psychologists = users
        .filter((user) => user.role === "psychologist")
        .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));

      return ctx.render({ psychologists });
    } finally {
      await kv.close();
    }
  }

  if (req.method === "POST") {
    const formData = await req.formData();
    const patientName = formData.get("patientName")?.toString();
    const psychologistEmail = formData.get("psychologistEmail")?.toString();
    const appointmentDate = formData.get("appointmentDate")?.toString();
    const appointmentTime = formData.get("appointmentTime")?.toString();

    if (
      !patientName ||
      !psychologistEmail ||
      !appointmentDate ||
      !appointmentTime
    ) {
      const kv = await Deno.openKv();
      try {
        const users = await getAllUsers();
        const psychologists = users
          .filter((user) => user.role === "psychologist")
          .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));

        return ctx.render({
          psychologists,
          error: "Todos los campos son requeridos",
        });
      } finally {
        await kv.close();
      }
    }

    const kv = await Deno.openKv();

    try {
      // Obtener el nombre del psicólogo
      const psychologist = await getAllUsers().then((users) =>
        users.find((user) => user.email === psychologistEmail)
      );

      const appointmentData = {
        patientName,
        psychologistEmail,
        psychologistName: psychologist?.name,
        appointmentDate,
        appointmentTime,
        status: "scheduled" as const,
      };

      await createAppointment(appointmentData);

      return new Response(null, {
        status: 307,
        headers: { Location: "/appointments" },
      });
    } finally {
      await kv.close();
    }
  }

  return new Response("Method not allowed", { status: 405 });
}

export default function NewAppointmentPage({
  data,
}: PageProps<{ psychologists: UserProfile[]; error?: string }, AppState>) {
  const { psychologists, error } = data || { psychologists: [] };

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="mb-8">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                  Nueva Cita
                </h1>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Programa una nueva cita para un paciente
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

          <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-lg font-medium text-gray-900 dark:text-white">
                Información de la Cita
              </h2>
            </div>

            <form method="POST" class="px-6 py-4 space-y-6">
              {error && (
                <div class="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
                  <div class="flex">
                    <div class="flex-shrink-0">
                      <Icon
                        name="file-warning"
                        className="h-5 w-5 text-red-400"
                      />
                    </div>
                    <div class="ml-3">
                      <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                        Error en el formulario
                      </h3>
                      <div class="mt-2 text-sm text-red-700 dark:text-red-300">
                        {error}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="patientName"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    <Icon name="user" className="h-4 w-4 inline mr-2" />
                    Nombre del Paciente
                  </label>
                  <Input
                    id="patientName"
                    name="patientName"
                    type="text"
                    required
                    placeholder="Ingrese el nombre completo del paciente"
                  />
                </div>

                <div>
                  <label
                    htmlFor="psychologistEmail"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    <Icon name="user-cog" className="h-4 w-4 inline mr-2" />
                    Psicólogo Asignado
                  </label>
                  <Select
                    id="psychologistEmail"
                    name="psychologistEmail"
                    required
                  >
                    <option value="">Seleccione un psicólogo</option>
                    {psychologists.map((psychologist) => (
                      <option
                        key={psychologist.email}
                        value={psychologist.email}
                      >
                        {psychologist.name || psychologist.email} - Psicólogo
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="appointmentDate"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    <Icon name="calendar" className="h-4 w-4 inline mr-2" />
                    Fecha de la Cita
                  </label>
                  <Input
                    id="appointmentDate"
                    name="appointmentDate"
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div>
                  <label
                    htmlFor="appointmentTime"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    <Icon name="clock" className="h-4 w-4 inline mr-2" />
                    Hora de la Cita
                  </label>
                  <Input
                    id="appointmentTime"
                    name="appointmentTime"
                    type="time"
                    required
                  />
                </div>
              </div>

              <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <a
                  href="/appointments"
                  class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </a>
                <Button
                  type="submit"
                  variant="primary"
                  className="inline-flex items-center"
                >
                  <Icon name="calendar-plus" className="h-4 w-4 mr-2" />
                  Crear Cita
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
