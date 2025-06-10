import type { Handlers, PageProps } from "$fresh/server.ts";
import Header from "../../components/layout/Header.tsx";
import Footer from "../../components/layout/Footer.tsx";
import type { AppState } from "../_middleware.ts";

import { Input } from "../../components/ui/Input.tsx";
import { Select } from "../../components/ui/Select.tsx";
import { Button } from "../../components/ui/Button.tsx";

// Interface for a user who can be assigned an appointment
interface AssignableUser {
  email: string;
  role: "superadmin" | "psychologist";
}

// Data passed from GET handler to the component
interface Data {
  psychologists: AssignableUser[];
  error?: string;
}

// Helper function to fetch assignable users to avoid code duplication
async function getAssignableUsers(kv: Deno.Kv): Promise<AssignableUser[]> {
  const users: AssignableUser[] = [];
  const iter = kv.list<AssignableUser>({ prefix: ["users_by_role"] });
  for await (const entry of iter) {
    // We only want psychologists and superadmins to be assignable
    if (entry.key[1] === "psychologist" || entry.key[1] === "superadmin") {
      users.push(entry.value);
    }
  }
  // Remove duplicates just in case and sort
  const uniqueUsers = Array.from(
    new Map(users.map((u) => [u.email, u])).values()
  );
  uniqueUsers.sort((a, b) => a.email.localeCompare(b.email));
  return uniqueUsers;
}

export const handler: Handlers<Data, AppState> = {
  // --- RENDER THE FORM ---
  async GET(_req, ctx) {
    const kv = await Deno.openKv();
    const psychologists = await getAssignableUsers(kv);
    kv.close();

    return ctx.render({ psychologists });
  },

  // --- PROCESS FORM SUBMISSION ---
  async POST(req, ctx) {
    const form = await req.formData();
    const patientName = form.get("patientName")?.toString();
    let psychologistEmail = form.get("psychologistEmail")?.toString();
    const appointmentDate = form.get("appointmentDate")?.toString();
    const appointmentTime = form.get("appointmentTime")?.toString();

    // If the logged-in user is a psychologist, they can only book for themselves
    if (ctx.state.user?.role === "psychologist") {
      psychologistEmail = ctx.state.user.email;
    }

    // --- Validation ---
    if (
      !patientName ||
      !psychologistEmail ||
      !appointmentDate ||
      !appointmentTime
    ) {
      const kv = await Deno.openKv();
      const psychologists = await getAssignableUsers(kv);
      kv.close();
      return ctx.render({
        psychologists,
        error: "Todos los campos son requeridos.",
      });
    }

    // --- Create Appointment Record ---
    const kv = await Deno.openKv();
    const appointmentId = crypto.randomUUID();
    const newAppointment = {
      id: appointmentId,
      psychologistEmail,
      patientName,
      appointmentDate,
      appointmentTime,
      status: "scheduled" as const,
      createdAt: new Date().toISOString(),
    };

    // Use an atomic operation to ensure data consistency
    const result = await kv
      .atomic()
      .set(["appointments", appointmentId], newAppointment)
      .set(
        ["appointments_by_psychologist", psychologistEmail, appointmentId],
        newAppointment
      )
      .commit();

    kv.close();

    if (!result.ok) {
      const psychologists = await getAssignableUsers(kv);
      return ctx.render({
        psychologists,
        error: "Error al guardar la cita en la base de datos.",
      });
    }

    // Redirect to appointments list on success
    return new Response(null, {
      status: 303,
      headers: { Location: "/appointments" },
    });
  },
};

export default function NewAppointmentPage({
  data,
  state,
}: PageProps<Data, AppState>) {
  const { psychologists, error } = data;
  const currentUser = state.user;
  const isPsychologist = currentUser?.role === "psychologist";

  return (
    <div class="flex flex-col min-h-screen">
      <Header />
      <main class="flex-grow bg-gray-50 dark:bg-gray-900">
        <div class="mx-auto max-w-2xl py-12 px-4 sm:px-6 lg:px-8">
          <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-8">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Agendar Nueva Cita
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Completa los detalles para programar una nueva consulta.
            </p>

            <form method="POST" class="space-y-6">
              {error && (
                <div
                  class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
                  role="alert"
                >
                  <p class="font-bold">Error</p>
                  <p>{error}</p>
                </div>
              )}

              <div>
                <label
                  for="patientName"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Nombre del Paciente
                </label>
                <div class="mt-1">
                  <Input
                    type="text"
                    name="patientName"
                    id="patientName"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  for="psychologistEmail"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Psicólogo Asignado
                </label>
                <div class="mt-1">
                  <Select
                    name="psychologistEmail"
                    id="psychologistEmail"
                    disabled={isPsychologist}
                  >
                    {psychologists.map((p) => (
                      <option
                        key={p.email}
                        value={p.email}
                        selected={currentUser?.email === p.email}
                      >
                        {p.email} ({p.role})
                      </option>
                    ))}
                  </Select>
                </div>
                {isPsychologist && (
                  <p class="mt-2 text-xs text-gray-500">
                    Como psicólogo, solo puedes agendar citas para ti mismo.
                  </p>
                )}
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label
                    for="appointmentDate"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Fecha de la Cita
                  </label>
                  <div class="mt-1">
                    <Input
                      type="date"
                      name="appointmentDate"
                      id="appointmentDate"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label
                    for="appointmentTime"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Hora de la Cita
                  </label>
                  <div class="mt-1">
                    <Input
                      type="time"
                      name="appointmentTime"
                      id="appointmentTime"
                      required
                    />
                  </div>
                </div>
              </div>

              <div class="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <a
                  href="/appointments"
                  class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Cancelar
                </a>
                <Button type="submit">
                  <img
                    src="/icons/calendar-plus.svg"
                    alt="Agendar"
                    width="20"
                    height="20"
                    class="mr-2"
                  />
                  Agendar Cita
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
