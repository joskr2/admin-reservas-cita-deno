import { useState } from "preact/hooks";
import { Icon } from "../components/ui/Icon.tsx";
import type { Appointment as BaseAppointment } from "../types/index.ts";

// Interfaz extendida para incluir roomName
interface Appointment extends BaseAppointment {
  roomName?: string | undefined;
}

interface InteractiveCalendarProps {
  appointments: Appointment[];
  currentUser: {
    role: string;
    email: string;
    id?: string;
    name?: string;
  };
  initialView: "day" | "week" | "month" | "year";
  initialDate: string;
}

interface CalendarDay {
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  appointments: Appointment[];
}

export default function InteractiveCalendar({
  appointments,
  currentUser: _currentUser,
  initialView,
  initialDate,
}: InteractiveCalendarProps) {
  const [view, setView] = useState<"day" | "week" | "month" | "year">(
    initialView,
  );
  const [currentDate, setCurrentDate] = useState(new Date(initialDate));

  // Actualizar URL cuando cambie la vista o fecha
  const updateUrl = (newView: string, newDate: Date) => {
    const url = new URL(globalThis.location.href);
    url.searchParams.set("view", newView);
    const dateString = newDate.toISOString().split("T")[0];
    if (dateString) {
      url.searchParams.set("date", dateString);
    }
    globalThis.history.pushState({}, "", url.toString());
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);

    switch (view) {
      case "day":
        newDate.setDate(
          currentDate.getDate() + (direction === "next" ? 1 : -1),
        );
        break;
      case "week":
        newDate.setDate(
          currentDate.getDate() + (direction === "next" ? 7 : -7),
        );
        break;
      case "month":
        newDate.setMonth(
          currentDate.getMonth() + (direction === "next" ? 1 : -1),
        );
        break;
      case "year":
        newDate.setFullYear(
          currentDate.getFullYear() + (direction === "next" ? 1 : -1),
        );
        break;
    }

    setCurrentDate(newDate);
    updateUrl(view, newDate);
  };

  const changeView = (newView: "day" | "week" | "month" | "year") => {
    setView(newView);
    updateUrl(newView, currentDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    updateUrl(view, today);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700";
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700";
      case "in_progress":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600";
    }
  };

  const formatTime = (time: string) => {
    try {
      return new Date(`2000-01-01T${time}`).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return time;
    }
  };

  const getAppointmentsForDate = (date: Date): Appointment[] => {
    const dateString = date.toISOString().split("T")[0];
    return appointments.filter((apt) => apt.appointmentDate === dateString);
  };

  const _getAppointmentsForWeek = (startDate: Date): Appointment[] => {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const startString = startDate.toISOString().split("T")[0];
    const endString = endDate.toISOString().split("T")[0];

    return appointments.filter((apt) =>
      startString && endString &&
      apt.appointmentDate >= startString && apt.appointmentDate <= endString
    );
  };

  const _getAppointmentsForMonth = (date: Date): Appointment[] => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const startString = startOfMonth.toISOString().split("T")[0];
    const endString = endOfMonth.toISOString().split("T")[0];

    return appointments.filter((apt) =>
      startString && endString &&
      apt.appointmentDate >= startString && apt.appointmentDate <= endString
    );
  };

  const _getAppointmentsForYear = (date: Date): Appointment[] => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const endOfYear = new Date(date.getFullYear(), 11, 31);

    const startString = startOfYear.toISOString().split("T")[0];
    const endString = endOfYear.toISOString().split("T")[0];

    return appointments.filter((apt) =>
      startString && endString &&
      apt.appointmentDate >= startString && apt.appointmentDate <= endString
    );
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - daysToSubtract);

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const dateString = date.toISOString().split("T")[0];
      const dayAppointments = appointments.filter(
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

  const getDateRangeText = (): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    switch (view) {
      case "day":
        return currentDate.toLocaleDateString("es-ES", options);
      case "week": {
        const weekStart = new Date(currentDate);
        const dayOfWeek = weekStart.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weekStart.setDate(currentDate.getDate() - daysToSubtract);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        return `${
          weekStart.toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
          })
        } - ${weekEnd.toLocaleDateString("es-ES", options)}`;
      }
      case "month":
        return currentDate.toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
        });
      case "year":
        return currentDate.getFullYear().toString();
      default:
        return "";
    }
  };

  const renderDayView = () => {
    const dayAppointments = getAppointmentsForDate(currentDate);

    return (
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {currentDate.toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h3>

          {dayAppointments.length === 0
            ? (
              <div class="text-center py-12">
                <Icon
                  name="calendar"
                  size={48}
                  className="mx-auto text-gray-400 mb-4"
                />
                <p class="text-gray-500 dark:text-gray-400">
                  No hay citas programadas para este día
                </p>
                <a
                  href={`/appointments/new?date=${
                    currentDate.toISOString().split("T")[0]
                  }`}
                  class="inline-flex items-center mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Icon name="plus" size={16} className="mr-2" />
                  Crear Nueva Cita
                </a>
              </div>
            )
            : (
              <div class="space-y-3">
                {dayAppointments
                  .sort((a, b) =>
                    (a.startTime || a.appointmentTime).localeCompare(
                      b.startTime || b.appointmentTime,
                    )
                  )
                  .map((appointment) => (
                    <a
                      key={appointment.id}
                      href={`/appointments/${appointment.id}`}
                      class={`block p-3 sm:p-4 rounded-lg border-2 hover:shadow-md transition-shadow ${
                        getStatusColor(appointment.status)
                      }`}
                    >
                      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <div class="flex-1">
                          <h4 class="font-medium text-sm sm:text-base">
                            {appointment.patientName}
                          </h4>
                          <div class="space-y-1">
                            <p class="text-xs sm:text-sm opacity-75 flex items-center">
                              <Icon name="clock" size={14} className="mr-1" />
                              {appointment.startTime && appointment.endTime
                                ? `${formatTime(appointment.startTime)} - ${
                                  formatTime(appointment.endTime)
                                }`
                                : formatTime(appointment.appointmentTime)}
                            </p>
                            {appointment.psychologistName && (
                              <p class="text-xs sm:text-sm opacity-75 flex items-center">
                                <Icon name="user" size={14} className="mr-1" />
                                Dr. {appointment.psychologistName}
                              </p>
                            )}
                            {(appointment.roomName || appointment.roomId) && (
                              <p class="text-xs sm:text-sm opacity-75 flex items-center">
                                <Icon
                                  name="briefcase"
                                  size={14}
                                  className="mr-1"
                                />
                                {appointment.roomName ||
                                  `Sala #${appointment.roomId}`}
                              </p>
                            )}
                          </div>
                        </div>
                        <div class="flex items-center justify-between sm:justify-end sm:flex-col sm:items-end space-x-2 sm:space-x-0 sm:space-y-1">
                          <span class="px-2 py-1 text-xs font-medium rounded-full bg-white bg-opacity-50">
                            {appointment.status === "pending" && "Pendiente"}
                            {appointment.status === "scheduled" && "Programada"}
                            {appointment.status === "in_progress" &&
                              "En Progreso"}
                            {appointment.status === "completed" && "Completada"}
                            {appointment.status === "cancelled" && "Cancelada"}
                          </span>
                          <Icon
                            name="chevron-right"
                            size={16}
                            className="sm:hidden"
                          />
                        </div>
                      </div>
                    </a>
                  ))}
              </div>
            )}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    const dayOfWeek = weekStart.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(currentDate.getDate() - daysToSubtract);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      weekDays.push(day);
    }

    const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

    return (
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-600 rounded-t-lg overflow-hidden">
          {weekDays.map((day, index) => {
            const dayAppointments = getAppointmentsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div
                key={day.toISOString()}
                class="bg-white dark:bg-gray-800 p-2 sm:p-3 min-h-[180px] sm:min-h-[200px]"
              >
                <div class="text-center mb-2">
                  <div class="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {dayNames[index]}
                  </div>
                  <div
                    class={`text-lg font-semibold ${
                      isToday
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {day.getDate()}
                  </div>
                </div>

                <div class="space-y-1">
                  {dayAppointments.slice(0, 2).map((appointment) => (
                    <a
                      key={appointment.id}
                      href={`/appointments/${appointment.id}`}
                      class={`block text-xs p-2 rounded border hover:opacity-80 transition-opacity ${
                        getStatusColor(appointment.status)
                      }`}
                    >
                      <div class="font-medium truncate">
                        {appointment.patientName}
                      </div>
                      <div class="truncate text-gray-600 dark:text-gray-400">
                        {appointment.startTime && appointment.endTime
                          ? `${formatTime(appointment.startTime)}-${
                            formatTime(appointment.endTime)
                          }`
                          : formatTime(appointment.appointmentTime)}
                      </div>
                      {appointment.psychologistName && (
                        <div class="truncate text-gray-500 dark:text-gray-500 text-xs">
                          Dr. {appointment.psychologistName}
                        </div>
                      )}
                      {(appointment.roomName || appointment.roomId) && (
                        <div class="truncate text-gray-500 dark:text-gray-500 text-xs">
                          📍 {appointment.roomName ||
                            `Sala #${appointment.roomId}`}
                        </div>
                      )}
                    </a>
                  ))}

                  {dayAppointments.length > 2 && (
                    <div class="text-xs text-gray-500 dark:text-gray-400 text-center p-1">
                      +{dayAppointments.length - 2} más citas
                    </div>
                  )}

                  {dayAppointments.length === 0 && (
                    <a
                      href={`/appointments/new?date=${
                        day.toISOString().split("T")[0]
                      }`}
                      class="block w-full mt-2 p-1 text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 border border-dashed border-gray-300 dark:border-gray-600 rounded hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-center"
                      title="Crear nueva cita para este día"
                      aria-label="Crear nueva cita para este día"
                    >
                      <Icon name="plus" size={12} className="mx-auto" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const days = generateCalendarDays();
    const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

    return (
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Encabezados de días */}
        <div class="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-600 rounded-t-lg overflow-hidden">
          {dayNames.map((dayName) => (
            <div
              key={dayName}
              class="bg-gray-50 dark:bg-gray-700 px-1 sm:px-3 py-2 text-center text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Grid del calendario */}
        <div class="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-600 overflow-hidden">
          {days.map((day) => (
            <div
              key={day.dateString}
              class={`
                bg-white dark:bg-gray-800 p-1 sm:p-2 min-h-[100px] sm:min-h-[120px] transition-colors
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
                {day.appointments.slice(0, 2).map((appointment) => (
                  <a
                    key={appointment.id}
                    href={`/appointments/${appointment.id}`}
                    class={`
                      block text-xs p-1 rounded border hover:opacity-80 transition-opacity
                      ${getStatusColor(appointment.status)}
                    `}
                    title={`${appointment.patientName} - ${
                      appointment.startTime && appointment.endTime
                        ? `${formatTime(appointment.startTime)} - ${
                          formatTime(appointment.endTime)
                        }`
                        : formatTime(appointment.appointmentTime)
                    }${
                      appointment.psychologistName
                        ? ` - Dr. ${appointment.psychologistName}`
                        : ""
                    }${
                      (appointment.roomName || appointment.roomId)
                        ? ` - ${
                          appointment.roomName || `Sala #${appointment.roomId}`
                        }`
                        : ""
                    }`}
                  >
                    <div class="truncate font-medium text-xs">
                      {appointment.patientName}
                    </div>
                    <div class="truncate text-gray-600 dark:text-gray-400 text-xs">
                      {appointment.startTime && appointment.endTime
                        ? `${formatTime(appointment.startTime)}-${
                          formatTime(appointment.endTime)
                        }`
                        : formatTime(appointment.appointmentTime)}
                    </div>
                    <div class="hidden sm:block truncate text-gray-500 dark:text-gray-500 text-xs">
                      {(appointment.roomName || appointment.roomId) &&
                        `📍${
                          appointment.roomName
                            ? appointment.roomName.substring(0, 8)
                            : `S${appointment.roomId}`
                        }`}
                      {appointment.psychologistName &&
                        (appointment.roomName || appointment.roomId) &&
                        " • "}
                      {appointment.psychologistName &&
                        `Dr.${appointment.psychologistName.split(" ")[0]}`}
                    </div>
                  </a>
                ))}

                {day.appointments.length > 2 && (
                  <div class="text-xs text-gray-500 dark:text-gray-400 text-center">
                    +{day.appointments.length - 2} más
                  </div>
                )}

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
                  >
                    <Icon name="plus" size={12} className="mx-auto" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    const months = [];
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

    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(currentDate.getFullYear(), i, 1);
      const monthAppointments = appointments.filter((apt) => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate.getFullYear() === currentDate.getFullYear() &&
          aptDate.getMonth() === i;
      });

      months.push({
        date: monthDate,
        name: monthNames[i],
        appointments: monthAppointments,
      });
    }

    return (
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {months.map((month) => (
          <div
            key={month.name}
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              setCurrentDate(month.date);
              setView("month");
              updateUrl("month", month.date);
            }}
          >
            <div class="text-center mb-3">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {month.name}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {month.appointments.length} citas
              </p>
            </div>

            {month.appointments.length > 0 && (
              <div class="space-y-1">
                {month.appointments.slice(0, 3).map((appointment) => (
                  <div
                    key={appointment.id}
                    class={`text-xs p-2 rounded border ${
                      getStatusColor(appointment.status)
                    }`}
                  >
                    <div class="font-medium truncate">
                      {appointment.patientName}
                    </div>
                    <div class="truncate">
                      {new Date(appointment.appointmentDate).toLocaleDateString(
                        "es-ES",
                        { day: "numeric", month: "short" },
                      )}
                    </div>
                  </div>
                ))}

                {month.appointments.length > 3 && (
                  <div class="text-xs text-gray-500 dark:text-gray-400 text-center">
                    +{month.appointments.length - 3} más
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div class="space-y-6">
      {/* Header con controles - Mejorado para móviles */}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        {/* Controles de navegación de fecha */}
        <div class="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => navigateDate("prev")}
            class="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Navegar al período anterior"
            aria-label="Navegar al período anterior"
          >
            <Icon name="chevron-left" size={20} />
          </button>

          <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white text-center flex-1 mx-4">
            {getDateRangeText()}
          </h2>

          <button
            type="button"
            onClick={() => navigateDate("next")}
            class="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Navegar al período siguiente"
            aria-label="Navegar al período siguiente"
          >
            <Icon name="chevron-right" size={20} />
          </button>
        </div>

        {/* Controles de vista y botón Hoy */}
        <div class="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={goToToday}
            class="w-full sm:w-auto px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            📅 Ir a Hoy
          </button>

          <div class="grid grid-cols-4 sm:flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            {["day", "week", "month", "year"].map((viewOption) => (
              <button
                type="button"
                key={viewOption}
                onClick={() =>
                  changeView(viewOption as "day" | "week" | "month" | "year")}
                class={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  view === viewOption
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {viewOption === "day" && "Día"}
                {viewOption === "week" && "Semana"}
                {viewOption === "month" && "Mes"}
                {viewOption === "year" && "Año"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido del calendario */}
      <div class="calendar-content">
        {view === "day" && renderDayView()}
        {view === "week" && renderWeekView()}
        {view === "month" && renderMonthView()}
        {view === "year" && renderYearView()}
      </div>

      {/* Leyenda */}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex flex-wrap items-center gap-4 text-xs">
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-yellow-200 rounded border border-yellow-300">
            </div>
            <span class="text-gray-600 dark:text-gray-400">Pendiente</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-blue-200 rounded border border-blue-300">
            </div>
            <span class="text-gray-600 dark:text-gray-400">Programada</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-purple-200 rounded border border-purple-300">
            </div>
            <span class="text-gray-600 dark:text-gray-400">En Progreso</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-green-200 rounded border border-green-300">
            </div>
            <span class="text-gray-600 dark:text-gray-400">Completada</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-red-200 rounded border border-red-300"></div>
            <span class="text-gray-600 dark:text-gray-400">Cancelada</span>
          </div>
        </div>
      </div>
    </div>
  );
}
