import type { Handlers, PageProps } from "$fresh/server.ts";
import Header from "../../islands/Header.tsx";
import Footer from "../../components/layout/Footer.tsx";
import type { AppState, Appointment } from "../../types/index.ts";
import { Button } from "../../components/ui/Button.tsx";
import { Icon } from "../../components/ui/Icon.tsx";

interface Data {
  appointment: Appointment;
  error?: string;
}

// Helper to fetch and validate appointment access
async function getAppointment(
  kv: Deno.Kv,
  id: string,
  user: AppState["user"]
): Promise<Appointment | null> {
  const result = await kv.get<Appointment>(["appointments", id]);
  if (!result.value) return null;

  // Superadmins can see everything
  if (user?.role === "superadmin") {
    return result.value;
  }

  // Psychologists can only see their own appointments
  if (
    user?.role === "psychologist" &&
    result.value.psychologistEmail === user.email
  ) {
    return result.value;
  }

  // Deny access otherwise
  return null;
}

export const handler: Handlers<Data, AppState> = {
  // --- RENDER THE DETAILS PAGE ---
  async GET(_req, ctx) {
    const { id } = ctx.params;
    const kv = await Deno.openKv();
    const appointment = await getAppointment(kv, id, ctx.state.user);
    kv.close();

    if (!appointment) {
      return new Response(null, {
        status: 303,
        headers: { Location: "/appointments" },
      });
    }

    return ctx.render({ appointment });
  },

  // --- HANDLE ACTIONS (UPDATE/DELETE) ---
  async POST(req, ctx) {
    const { id } = ctx.params;
    const form = await req.formData();
    const action = form.get("_action")?.toString();

    const kv = await Deno.openKv();
    const appointment = await getAppointment(kv, id, ctx.state.user);

    if (!appointment) {
      kv.close();
      return new Response("Appointment not found or access denied.", {
        status: 404,
      });
    }

    let newStatus: Appointment["status"] | undefined;
    if (action === "complete" && appointment.status === "scheduled") {
      newStatus = "completed";
    } else if (action === "cancel" && appointment.status === "scheduled") {
      newStatus = "cancelled";
    }

    if (newStatus) {
      const updatedAppointment = { ...appointment, status: newStatus };
      await kv.set(["appointments", id], updatedAppointment);
      // Note: We might also want to update the indexed value, though it's less critical for status changes.
    }
    kv.close();

    // Redirect back to the same page to show the update
    return new Response(null, {
      status: 303,
      headers: { Location: `/appointments/${id}` },
    });
  },
};

export default function AppointmentDetailsPage({ data }: PageProps<Data>) {
  const { appointment } = data;

  const statusInfo = {
    scheduled: {
      text: "Agendada",
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    },
    completed: {
      text: "Completada",
      color:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    },
    cancelled: {
      text: "Cancelada",
      color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    },
  };

  return (
    <div class="flex flex-col min-h-screen">
      <Header />
      <main class="flex-grow bg-gray-50 dark:bg-gray-900">
        <div class="mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8">
          <div class="mb-8">
            {/* Enlace volver */}
            <a
              href="/appointments"
              class="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Icon
                name="arrow-left"
                size={16}
                className="text-gray-500 dark:text-gray-400"
              />
              Volver a la lista de citas
            </a>
          </div>
          <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
            <div class="p-6 border-b border-gray-200 dark:border-gray-700">
              <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                    Detalles de la Cita
                  </h2>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Cita con{" "}
                    <span class="font-medium">{appointment.patientName}</span>.
                  </p>
                </div>
                <div
                  class={`mt-3 sm:mt-0 sm:ml-4 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                    statusInfo[appointment.status].color
                  }`}
                >
                  {statusInfo[appointment.status].text}
                </div>
              </div>
            </div>
            <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
              {/* Paciente */}
              <div class="flex items-center gap-4">
                <Icon
                  name="user"
                  size={24}
                  className="text-gray-400 dark:text-gray-500"
                />
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Paciente
                  </dt>
                  <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                    {appointment.patientName}
                  </dd>
                </dl>
              </div>
              {/* Psicólogo */}
              <div class="flex items-center gap-4">
                <Icon
                  name="user"
                  size={24}
                  className="text-gray-400 dark:text-gray-500"
                />
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Psicólogo
                  </dt>
                  <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                    {appointment.psychologistEmail}
                  </dd>
                </dl>
              </div>
              {/* Fecha */}
              <div class="flex items-center gap-4">
                <Icon
                  name="calendar"
                  size={24}
                  className="text-gray-400 dark:text-gray-500"
                />
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Fecha
                  </dt>
                  <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                    {new Date(appointment.appointmentDate).toLocaleDateString(
                      "es-PE",
                      { timeZone: "UTC" }
                    )}
                  </dd>
                </dl>
              </div>
              {/* Hora */}
              <div class="flex items-center gap-4">
                <Icon
                  name="clock"
                  size={24}
                  className="text-gray-400 dark:text-gray-500"
                />
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Hora
                  </dt>
                  <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                    {appointment.appointmentTime}
                  </dd>
                </dl>
              </div>
              {/* ID de Cita */}
              <div class="flex items-center gap-4">
                <Icon
                  name="hash"
                  size={24}
                  className="text-gray-400 dark:text-gray-500"
                />
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                    ID de Cita
                  </dt>
                  <dd class="mt-1 text-xs text-gray-900 dark:text-white font-mono">
                    {appointment.id}
                  </dd>
                </dl>
              </div>
            </div>
            {appointment.status === "scheduled" && (
              <div class="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                <form
                  method="POST"
                  class="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-4"
                >
                  <p class="text-sm text-gray-600 dark:text-gray-300">
                    Acciones disponibles:
                  </p>
                  {/* Botón Cancelar */}
                  <Button
                    type="submit"
                    name="_action"
                    value="cancel"
                    variant="danger"
                  >
                    <Icon name="circle" size={20} className="mr-2" />
                    Cancelar Cita
                  </Button>
                  {/* Botón Completar */}
                  <Button
                    type="submit"
                    name="_action"
                    value="complete"
                    variant="primary"
                  >
                    <Icon name="check" size={20} className="mr-2" />
                    Marcar como Completada
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
