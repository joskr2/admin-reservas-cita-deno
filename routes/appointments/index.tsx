import type { Handlers, PageProps } from "$fresh/server.ts";
import Header from "../../islands/Header.tsx";
import Footer from "../../components/layout/Footer.tsx";
import type { AppState } from "../_middleware.ts";

// Define the shape of an appointment record
interface Appointment {
  id: string;
  psychologistEmail: string;
  patientName: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM
  status: "scheduled" | "completed" | "cancelled";
  createdAt: string;
}

// Data passed from the handler to the component
interface Data {
  appointments: Appointment[];
}

export const handler: Handlers<Data, AppState> = {
  async GET(_req, ctx) {
    const { user } = ctx.state;
    if (!user) {
      // Should be handled by middleware, but as a safeguard
      return new Response(null, {
        status: 307,
        headers: { Location: "/login" },
      });
    }

    const kv = await Deno.openKv();
    const appointments: Appointment[] = [];
    let iterator: Deno.KvListIterator<Appointment>;

    if (user.role === "superadmin") {
      // Superadmin sees all appointments
      iterator = kv.list<Appointment>({ prefix: ["appointments"] });
    } else {
      // Psychologist sees only their own appointments
      iterator = kv.list<Appointment>({
        prefix: ["appointments_by_psychologist", user.email],
      });
    }

    for await (const entry of iterator) {
      // For the psychologist's index, the value is the primary key of the appointment
      if (user.role === "psychologist") {
        const appointmentKey = entry.value as unknown as Deno.KvKey;
        const mainEntry = await kv.get<Appointment>(appointmentKey);
        if (mainEntry.value) {
          appointments.push(mainEntry.value);
        }
      } else {
        appointments.push(entry.value);
      }
    }
    kv.close();

    // Sort appointments by date, newest first
    appointments.sort(
      (a, b) =>
        new Date(b.appointmentDate).getTime() -
        new Date(a.appointmentDate).getTime()
    );

    return ctx.render({ appointments });
  },
};

export default function AppointmentsPage(props: PageProps<Data, AppState>) {
  const { appointments } = props.data;
  const { user } = props.state;
  const isSuperAdmin = user?.role === "superadmin";

  return (
    <div class="flex flex-col min-h-screen">
      <Header />
      <main class="flex-grow bg-gray-50 dark:bg-gray-900">
        <div class="mx-auto max-w-7xl py-12 px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div class="sm:flex sm:items-center sm:justify-between pb-8 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h1 class="text-3xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
                {isSuperAdmin ? "Gestión de Citas" : "Mis Citas"}
              </h1>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Visualiza y administra todas las citas programadas.
              </p>
            </div>
            <div class="mt-4 sm:mt-0 sm:ml-4">
              <a
                href="/appointments/new"
                class="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:ring-offset-gray-800"
              >
                <img
                  src="/icons/calendar-plus.svg"
                  alt="Agendar"
                  width="20"
                  height="20"
                  class="mr-2 text-white"
                />
                Agendar Nueva Cita
              </a>
            </div>
          </div>

          {/* Appointments List */}
          <div class="mt-8">
            {appointments.length === 0 ? (
              <div class="text-center py-16 px-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                <img
                  src="/icons/calendar.svg"
                  alt="Sin citas"
                  class="mx-auto h-12 w-12 text-gray-400"
                />
                <h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                  No hay citas agendadas
                </h3>
                <p class="mt-1 text-sm text-gray-500">
                  Comienza por agendar una nueva cita.
                </p>
              </div>
            ) : (
              <ul class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {appointments.map((appt) => (
                  <li
                    key={appt.id}
                    class="col-span-1 divide-y divide-gray-200 dark:divide-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow"
                  >
                    <div class="flex w-full items-center justify-between space-x-6 p-6">
                      <div class="flex-1 truncate">
                        <div class="flex items-center space-x-3">
                          <h3 class="truncate text-sm font-medium text-gray-900 dark:text-white">
                            {appt.patientName}
                          </h3>
                          <span
                            class={`inline-block flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                              appt.status === "scheduled"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                            }`}
                          >
                            {appt.status === "scheduled"
                              ? "Agendada"
                              : "Completada"}
                          </span>
                        </div>
                        {isSuperAdmin && (
                          <p class="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                            Psic. {appt.psychologistEmail.split("@")[0]}
                          </p>
                        )}
                        <div class="mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                          <p class="flex items-center gap-2">
                            <img
                              src="/icons/calendar.svg"
                              alt="Fecha"
                              width="16"
                              height="16"
                              class="text-gray-400"
                            />
                            {new Date(appt.appointmentDate).toLocaleDateString(
                              "es-PE",
                              { timeZone: "UTC" }
                            )}
                          </p>
                          <p class="flex items-center gap-2">
                            <img
                              src="/icons/clock.svg"
                              alt="Hora"
                              width="16"
                              height="16"
                              class="text-gray-400"
                            />
                            {appt.appointmentTime}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div class="-mt-px flex divide-x divide-gray-200 dark:divide-gray-700">
                        <div class="flex w-0 flex-1">
                          <a
                            href={`/appointments/${appt.id}`}
                            class="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            Ver Detalles
                          </a>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
