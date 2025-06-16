import { type FreshContext, type PageProps } from "$fresh/server.ts";
import { type Appointment, type AppState } from "../../types/index.ts";
import { getAppointmentRepository, getUserRepository, getRoomRepository } from "../../lib/database/index.ts";
import { extractUserContext, logger } from "../../lib/logger.ts";
import InteractiveCalendar from "../../islands/InteractiveCalendar.tsx";

interface CalendarPageData {
  appointments: Appointment[];
  currentUser: {
    role: string;
    email: string;
    id?: string;
    name?: string;
  };
  view: "day" | "week" | "month" | "year";
  date: string; // ISO date string
}

// Función para enriquecer citas con nombres de psicólogos y salas
async function enrichAppointmentsWithNames(appointments: Appointment[]): Promise<Appointment[]> {
  if (appointments.length === 0) return appointments;

  const userRepository = getUserRepository();
  const roomRepository = getRoomRepository();

  const enrichedAppointments: Appointment[] = [];

  for (const appointment of appointments) {
    const enrichedAppointment = { ...appointment };

    // Enriquecer con nombre del psicólogo si no existe
    if (!appointment.psychologistName && appointment.psychologistEmail) {
      try {
        const psychologist = await userRepository.getUserByEmail(appointment.psychologistEmail);
        if (psychologist && psychologist.name) {
          enrichedAppointment.psychologistName = psychologist.name;
        }
      } catch (error) {
        console.warn(`Failed to fetch psychologist name for ${appointment.psychologistEmail}:`, error);
      }
    }

    // Enriquecer con nombre de la sala si no existe
    if (!appointment.roomName && appointment.roomId) {
      try {
        const room = await roomRepository.getById(appointment.roomId);
        if (room && room.name) {
          enrichedAppointment.roomName = room.name;
        }
      } catch (error) {
        console.warn(`Failed to fetch room name for ${appointment.roomId}:`, error);
      }
    }

    enrichedAppointments.push(enrichedAppointment);
  }

  return enrichedAppointments;
}

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  const requestId = ctx.state.requestId || "unknown";
  const userContext = extractUserContext(ctx.state.user);

  const url = new URL(req.url);
  const view = (url.searchParams.get("view") || "month") as
    | "day"
    | "week"
    | "month"
    | "year";
  const date = url.searchParams.get("date") ||
    new Date().toISOString().split("T")[0];

  await logger.info("APPOINTMENTS_CALENDAR", "Calendar page requested", {
    view,
    date,
    url: req.url,
  }, { requestId, ...userContext });

  const currentUser = ctx.state.user;
  if (!currentUser) {
    await logger.warn(
      "APPOINTMENTS_CALENDAR",
      "Unauthenticated user redirected to login",
      {
        url: req.url,
      },
      { requestId },
    );
    return Response.redirect(new URL("/auth/login", url.origin), 302);
  }

  try {
    await logger.debug("APPOINTMENTS_CALENDAR", "Loading calendar data", {
      userRole: currentUser.role,
      userEmail: currentUser.email,
      view,
      date,
    }, { requestId, ...userContext });

    const appointmentRepository = getAppointmentRepository();

    // Obtener citas según el rol del usuario
    let appointments: Appointment[];
    if (currentUser.role === "superadmin") {
      appointments = await appointmentRepository.getAll();
      await logger.debug(
        "APPOINTMENTS_CALENDAR",
        "Loaded all appointments for superadmin",
        {
          appointmentsCount: appointments.length,
        },
        { requestId, ...userContext },
      );
    } else {
      appointments = await appointmentRepository.getAppointmentsByPsychologist(
        currentUser.email,
      );
      await logger.debug(
        "APPOINTMENTS_CALENDAR",
        "Loaded psychologist appointments",
        {
          psychologistEmail: currentUser.email,
          appointmentsCount: appointments.length,
        },
        { requestId, ...userContext },
      );
    }

    // Enriquecer citas con nombres de psicólogos y salas
    const enrichedAppointments = await enrichAppointmentsWithNames(appointments);
    
    await logger.debug("APPOINTMENTS_CALENDAR", "Enriched appointments with names", {
      originalCount: appointments.length,
      enrichedCount: enrichedAppointments.length,
    }, { requestId, ...userContext });

    await logger.info(
      "APPOINTMENTS_CALENDAR",
      "Calendar data loaded successfully",
      {
        userRole: currentUser.role,
        appointmentsCount: appointments.length,
        view,
        date,
      },
      { requestId, ...userContext },
    );

    return ctx.render({
      appointments: enrichedAppointments,
      currentUser: {
        role: currentUser.role,
        email: currentUser.email,
        id: currentUser.id,
        name: currentUser.name,
      },
      view,
      date,
    });
  } catch (error) {
    await logger.error("APPOINTMENTS_CALENDAR", "Error loading calendar data", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userRole: currentUser?.role,
      view,
      date,
    }, { requestId, ...userContext });

    // Retornar datos vacíos en caso de error
    return ctx.render({
      appointments: [],
      currentUser: {
        role: currentUser?.role || "psychologist",
        email: currentUser?.email || "",
        id: currentUser?.id,
        name: currentUser?.name,
      },
      view,
      date,
    });
  }
}

export default function CalendarPage({
  data,
}: PageProps<CalendarPageData, AppState>) {
  const {
    appointments,
    currentUser,
    view,
    date,
  } = data;

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          {/* Header - Optimizado para móviles */}
          <div class="mb-6">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div class="text-center sm:text-left">
                  <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                    📅 Calendario de Citas
                  </h1>
                  <p class="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {currentUser.role === "superadmin"
                      ? "Vista completa del sistema"
                      : "Mis citas programadas"}
                  </p>
                </div>

                <div class="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <a
                    href="/appointments"
                    class="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg
                      class="h-4 w-4 mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width={2}
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                    <span class="hidden sm:inline">Vista Lista</span>
                    <span class="sm:hidden">Lista</span>
                  </a>
                  <a
                    href="/appointments/new"
                    class="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <svg
                      class="h-4 w-4 mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span class="hidden sm:inline">Nueva Cita</span>
                    <span class="sm:hidden">Nueva</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Component */}
          <InteractiveCalendar
            appointments={appointments}
            currentUser={currentUser}
            initialView={view}
            initialDate={date}
          />
        </div>
      </main>
    </div>
  );
}
