import { useState, useEffect } from "preact/hooks";
import { Icon } from "../components/ui/Icon.tsx";
import { Badge } from "../components/ui/Badge.tsx";
import { Button } from "../components/ui/Button.tsx";
import type { Appointment, AppointmentStatus } from "../types/index.ts";

interface AppointmentCalendarProps {
  appointments: Appointment[];
  currentUserRole?: string;
  currentUserEmail?: string;
  onAppointmentClick?: (appointment: Appointment) => void;
  onDateClick?: (date: string) => void;
  onCreateAppointment?: (date: string, time?: string) => void;
  showCreateButton?: boolean;
  compact?: boolean;
}

interface CalendarDay {
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  appointments: Appointment[];
}

type ViewMode = "month" | "week";

export default function AppointmentCalendar({
  appointments,
  currentUserRole = "psychologist",
  currentUserEmail = "",
  onAppointmentClick,
  onDateClick,
  onCreateAppointment,
  showCreateButton = true,
  compact = false,
}: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

  const getStatusText = (status: AppointmentStatus): string => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "scheduled":
        return "Programada";
      case "in_progress":
        return "En Progreso";
      case "completed":
        return "Completada";
      case "cancelled":
        return "Cancelada";
      default:
        return "Desconocido";
    }
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    // Último día del mes
    const lastDay = new Date(year, month + 1, 0);

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
        (apt) => apt.appointmentDate === dateString
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

  const generateWeekDays = (): CalendarDay[] => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = currentDate.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(currentDate.getDate() - daysToSubtract);

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);

      const dateString = date.toISOString().split("T")[0];
      const dayAppointments = filteredAppointments.filter(
        (apt) => apt.appointmentDate === dateString
      );

      days.push({
        date,
        dateString: dateString || "",
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        appointments: dayAppointments,
      });
    }

    return days;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setDate(currentDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const handleDateClick = (day: CalendarDay) => {
    setSelectedDate(day.dateString);
    if (onDateClick) {
      onDateClick(day.dateString);
    }
  };

  const handleAppointmentClick = (appointment: Appointment, e: Event) => {
    e.stopPropagation();
    if (onAppointmentClick) {
      onAppointmentClick(appointment);
    }
  };

  const handleCreateAppointment = (dateString: string) => {
    if (onCreateAppointment) {
      onCreateAppointment(dateString);
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const days =
    viewMode === "month" ? generateCalendarDays() : generateWeekDays();
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
        <div class="flex items-center space-x-4">
          <h2
            class={`font-semibold text-gray-900 dark:text-white ${
              compact ? "text-lg" : "text-xl"
            }`}
          >
            {viewMode === "month"
              ? `${
                  monthNames[currentDate.getMonth()]
                } ${currentDate.getFullYear()}`
              : `Semana del ${days[0]?.date.getDate() || ""} ${
                  monthNames[days[0]?.date.getMonth() || 0]
                } - ${days[6]?.date.getDate() || ""} ${
                  monthNames[days[6]?.date.getMonth() || 0]
                } ${currentDate.getFullYear()}`}
          </h2>

          {/* Controles de navegación */}
          <div class="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                viewMode === "month"
                  ? navigateMonth("prev")
                  : navigateWeek("prev")
              }
            >
              <Icon name="arrow-left" size={16} />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Hoy
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                viewMode === "month"
                  ? navigateMonth("next")
                  : navigateWeek("next")
              }
            >
              <Icon name="arrow-left" size={16} className="rotate-180" />
            </Button>
          </div>
        </div>

        {/* Controles de vista */}
        <div class="flex items-center space-x-2">
          <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode("month")}
              class={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === "month"
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setViewMode("week")}
              class={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === "week"
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Semana
            </button>
          </div>

          {showCreateButton && (
            <Button
              size="sm"
              onClick={() =>
                handleCreateAppointment(
                  new Date().toISOString().split("T")[0] || ""
                )
              }
            >
              <Icon name="calendar-plus" size={16} className="mr-2" />
              Nueva Cita
            </Button>
          )}
        </div>
      </div>

      {/* Encabezados de días */}
      <div
        class={`grid ${
          viewMode === "month" ? "grid-cols-7" : "grid-cols-7"
        } gap-px bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden mb-4`}
      >
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
      <div
        class={`grid ${
          viewMode === "month" ? "grid-cols-7" : "grid-cols-7"
        } gap-px bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden`}
      >
        {days.map((day) => (
          <div
            key={day.dateString}
            onClick={() => handleDateClick(day)}
            class={`
              bg-white dark:bg-gray-800 p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
              ${compact ? "min-h-[80px]" : "min-h-[120px]"}
              ${!day.isCurrentMonth && viewMode === "month" ? "opacity-40" : ""}
              ${day.isToday ? "ring-2 ring-blue-500 ring-inset" : ""}
              ${
                selectedDate === day.dateString
                  ? "bg-blue-50 dark:bg-blue-950/20"
                  : ""
              }
            `}
          >
            {/* Número del día */}
            <div class="flex items-center justify-between mb-1">
              <span
                class={`text-sm font-medium ${
                  day.isToday
                    ? "text-blue-600 dark:text-blue-400"
                    : day.isCurrentMonth || viewMode === "week"
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
                <div
                  key={appointment.id}
                  onClick={(e) => handleAppointmentClick(appointment, e)}
                  class={`
                    text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity
                    ${getStatusColor(appointment.status)}
                  `}
                  title={`${appointment.patientName} - ${formatTime(
                    appointment.appointmentTime
                  )} - ${getStatusText(appointment.status)}`}
                >
                  <div class="truncate font-medium">
                    {appointment.patientName}
                  </div>
                  <div class="truncate">
                    {formatTime(appointment.appointmentTime)}
                  </div>
                </div>
              ))}

              {day.appointments.length > (compact ? 2 : 3) && (
                <div class="text-xs text-gray-500 dark:text-gray-400 text-center">
                  +{day.appointments.length - (compact ? 2 : 3)} más
                </div>
              )}
            </div>

            {/* Botón para crear cita en el día */}
            {showCreateButton &&
              day.appointments.length === 0 &&
              (day.isCurrentMonth || viewMode === "week") && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateAppointment(day.dateString);
                  }}
                  title={`Crear cita para el ${day.dateString}`}
                  class="w-full mt-2 p-1 text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 border border-dashed border-gray-300 dark:border-gray-600 rounded hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                >
                  <Icon name="plus" size={12} className="mx-auto" />
                </button>
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
