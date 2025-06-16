import { Icon } from "../ui/Icon.tsx";
import type { Appointment, AppointmentStatus } from "../../types/index.ts";

interface AppointmentCalendarProps {
  appointments: Appointment[];
  currentDate?: Date;
  currentUserRole?: string;
  currentUserEmail?: string;
  compact?: boolean;
}

interface CalendarDay {
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  appointments: Appointment[];
}

export default function AppointmentCalendar({
  appointments,
  currentDate = new Date(),
  currentUserRole = "psychologist",
  currentUserEmail = "",
  compact = false,
}: AppointmentCalendarProps) {
  // Filtrar citas según el rol del usuario
  const filteredAppointments = appointments.filter((apt) => {
    if (currentUserRole === "superadmin") {
      return true; // Superadmin ve todas las citas
    }
    return apt.psychologistEmail === currentUserEmail; // Psicólogos solo ven sus citas
  });

  const getStatusColor = (status: AppointmentStatus): string => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "in_progress":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Primer día del mes
    const firstDay = new Date(year, month, 1);

    // Primer día de la semana (lunes = 1, domingo = 0)
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - daysToSubtract);

    // Generar 42 días (6 semanas)
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const dateString = date.toISOString().split("T")[0];
      const dayAppointments = filteredAppointments.filter(
        (apt) => apt.appointmentDate === dateString,
      );

      days.push({
        date,
        dateString: dateString || "",
        isCurrentMonth: date.getMonth() === month,
        isToday: date.getTime() === today.getTime(),
        appointments: dayAppointments,
      });
    }

    return days;
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const days = generateCalendarDays();
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div
      class={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${
        compact ? "p-4" : "p-6"
      }`}
    >
      {/* Header del calendario */}
      <div class="flex items-center justify-between mb-6">
        <h2
          class={`font-semibold text-gray-900 dark:text-white ${
            compact ? "text-lg" : "text-xl"
          }`}
        >
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>

        <div class="flex items-center space-x-2">
          <a
            href="/appointments/new"
            class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Icon name="calendar-plus" size={16} className="mr-2" />
            Nueva Cita
          </a>
        </div>
      </div>

      {/* Encabezados de días */}
      <div class="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden mb-4">
        {dayNames.map((dayName) => (
          <div
            key={dayName}
            class="bg-gray-50 dark:bg-gray-700 px-3 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Grid del calendario */}
      <div class="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden">
        {days.map((day) => (
          <div
            key={day.dateString}
            class={`
              bg-white dark:bg-gray-800 p-2 transition-colors
              ${compact ? "min-h-[80px]" : "min-h-[120px]"}
              ${!day.isCurrentMonth ? "opacity-40" : ""}
              ${day.isToday ? "ring-2 ring-blue-500 ring-inset" : ""}
            `}
          >
            {/* Número del día */}
            <div class="flex items-center justify-between mb-1">
              <span
                class={`text-sm font-medium ${
                  day.isToday
                    ? "text-blue-600 dark:text-blue-400"
                    : day.isCurrentMonth
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {day.date.getDate()}
              </span>

              {day.appointments.length > 0 && (
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {day.appointments.length}
                </span>
              )}
            </div>

            {/* Citas del día */}
            <div class="space-y-1">
              {day.appointments.slice(0, compact ? 2 : 3).map((appointment) => (
                <a
                  key={appointment.id}
                  href={`/appointments/${appointment.id}`}
                  class={`
                    block text-xs p-1 rounded hover:opacity-80 transition-opacity
                    ${getStatusColor(appointment.status)}
                  `}
                  title={`${appointment.patientName} - ${
                    formatTime(
                      appointment.appointmentTime,
                    )
                  }`}
                >
                  <div class="truncate font-medium">
                    {appointment.patientName}
                  </div>
                  <div class="truncate">
                    {formatTime(appointment.appointmentTime)}
                  </div>
                </a>
              ))}

              {day.appointments.length > (compact ? 2 : 3) && (
                <div class="text-xs text-gray-500 dark:text-gray-400 text-center">
                  +{day.appointments.length - (compact ? 2 : 3)} más
                </div>
              )}
            </div>

            {/* Indicador para crear cita */}
            {day.appointments.length === 0 && day.isCurrentMonth && (
              <a
                href={`/appointments/new?date=${day.dateString}`}
                class="block w-full mt-2 p-1 text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 border border-dashed border-gray-300 dark:border-gray-600 rounded hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-center"
                title={`Crear nueva cita para el ${
                  day.date.toLocaleDateString(
                    "es-ES",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )
                }`}
                aria-label={`Crear nueva cita para el ${
                  day.date.toLocaleDateString(
                    "es-ES",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )
                }`}
              >
                <Icon name="plus" size={12} className="mx-auto" />
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Leyenda */}
      <div class="mt-4 flex flex-wrap items-center gap-4 text-xs">
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-yellow-200 rounded"></div>
          <span class="text-gray-600 dark:text-gray-400">Pendiente</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-blue-200 rounded"></div>
          <span class="text-gray-600 dark:text-gray-400">Programada</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-purple-200 rounded"></div>
          <span class="text-gray-600 dark:text-gray-400">En Progreso</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-green-200 rounded"></div>
          <span class="text-gray-600 dark:text-gray-400">Completada</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-red-200 rounded"></div>
          <span class="text-gray-600 dark:text-gray-400">Cancelada</span>
        </div>
      </div>
    </div>
  );
}
