import { useState } from "preact/hooks";
import { Icon } from "../components/ui/Icon.tsx";
import QuickBookingModal from "./QuickBookingModal.tsx";
import CollapsibleSection from "./CollapsibleSection.tsx";
import type { Appointment, PatientProfile, Room } from "../types/index.ts";

interface AvailabilityDashboardProps {
  appointments: Appointment[];
  rooms: Room[];
  patients: PatientProfile[];
  psychologistEmail?: string;
  userRole: string;
}

interface TimeSlot {
  hour: string;
  isAvailable: boolean;
  appointment?: Appointment | undefined;
  room?: string | undefined;
}

interface DaySchedule {
  date: string;
  dayName: string;
  timeSlots: TimeSlot[];
  availableRooms: Room[];
}

export default function AvailabilityDashboard({
  appointments,
  rooms,
  patients,
  psychologistEmail,
  userRole,
}: AvailabilityDashboardProps) {
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState<
    {
      date: string;
      time: string;
      roomId?: string;
    } | null
  >(null);

  // Horario laboral: 8:00 AM - 8:00 PM (Lunes a Viernes)
  const workingHours = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
  ];

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
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

  // Filtrar citas según el rol
  const filteredAppointments = userRole === "superadmin"
    ? appointments
    : appointments.filter((apt) => apt.psychologistEmail === psychologistEmail);

  // Salas disponibles (activas)
  const availableRooms = rooms.filter((room) => room.isAvailable);

  const formatTime = (time: string) => {
    return time; // Formato 24 horas directo
  };

  const generateDaySchedule = (date: Date): DaySchedule => {
    const dateString = date.toISOString().split("T")[0];

    // Citas del día
    const dayAppointments = filteredAppointments.filter(
      (apt) => apt.appointmentDate === dateString,
    );

    // Generar slots de tiempo para el día
    const timeSlots: TimeSlot[] = workingHours.map((hour) => {
      const appointment = dayAppointments.find((apt) => {
        const aptStart = apt.startTime || apt.appointmentTime;
        return aptStart === hour;
      });

      return {
        hour,
        isAvailable: !appointment,
        appointment,
        room: appointment?.roomId,
      };
    });

    return {
      date: dateString || "",
      dayName: dayNames[date.getDay()] || "",
      timeSlots,
      availableRooms,
    };
  };

  const generateWeekSchedule = (startDate: Date): DaySchedule[] => {
    const weekSchedule: DaySchedule[] = [];

    // Encontrar el lunes de la semana actual
    const monday = new Date(startDate);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1); // Ajustar al lunes
    monday.setDate(diff);

    // Generar lunes a sábado (6 días)
    for (let i = 0; i < 6; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekSchedule.push(generateDaySchedule(date));
    }

    return weekSchedule;
  };

  const generateMonthSchedule = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const _firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const monthSchedule: DaySchedule[] = [];

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const currentDate = new Date(year, month, day);
      const dayOfWeek = currentDate.getDay();
      
      // Solo incluir días laborales (lunes=1 a sábado=6)
      if (dayOfWeek >= 1 && dayOfWeek <= 6) {
        monthSchedule.push(generateDaySchedule(currentDate));
      }
    }

    return monthSchedule;
  };

  const getAvailabilityStats = () => {
    let schedule: DaySchedule[] = [];

    if (viewMode === "day") {
      schedule = [generateDaySchedule(selectedDate)];
    } else if (viewMode === "week") {
      schedule = generateWeekSchedule(selectedDate);
    } else {
      schedule = generateMonthSchedule(selectedDate);
    }

    const totalSlots = schedule.length * workingHours.length;
    const occupiedSlots = schedule.reduce(
      (acc, day) =>
        acc + day.timeSlots.filter((slot) => !slot.isAvailable).length,
      0,
    );
    const availableSlots = totalSlots - occupiedSlots;

    return {
      totalSlots,
      availableSlots,
      occupiedSlots,
      availabilityPercentage: totalSlots > 0
        ? Math.round((availableSlots / totalSlots) * 100)
        : 0,
    };
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);

    if (viewMode === "day") {
      newDate.setDate(selectedDate.getDate() + (direction === "next" ? 1 : -1));
    } else if (viewMode === "week") {
      newDate.setDate(selectedDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setMonth(
        selectedDate.getMonth() + (direction === "next" ? 1 : -1),
      );
    }

    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const handleQuickBook = (date: string, time: string, roomId?: string) => {
    setBookingData({ date, time, roomId: roomId || "" });
    setShowBookingModal(true);
  };

  const getAppointmentsInRoom = (roomId: string, date?: string) => {
    return filteredAppointments.filter((apt) =>
      apt.roomId === roomId &&
      (!date || apt.appointmentDate === date)
    );
  };

  const getDateRangeText = (): string => {
    if (viewMode === "day") {
      return selectedDate.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else if (viewMode === "week") {
      const weekStart = new Date(selectedDate);
      const dayOfWeek = weekStart.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekStart.setDate(selectedDate.getDate() - daysToSubtract);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      return `${
        weekStart.toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
        })
      } - ${
        weekEnd.toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      }`;
    } else {
      return `${
        monthNames[selectedDate.getMonth()]
      } ${selectedDate.getFullYear()}`;
    }
  };

  const stats = getAvailabilityStats();

  const renderDayView = () => {
    const daySchedule = generateDaySchedule(selectedDate);
    const availableCount =
      daySchedule.timeSlots.filter((slot) => slot.isAvailable).length;

    return (
      <div class="space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div class="text-center">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Horas Disponibles
              </p>
              <p class="text-3xl font-bold text-green-600 dark:text-green-400">
                {availableCount}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                de {workingHours.length} horas
              </p>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div class="text-center">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Salas Libres
              </p>
              <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {availableRooms.length}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                de {rooms.length} salas
              </p>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div class="text-center">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Disponibilidad
              </p>
              <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {Math.round((availableCount / workingHours.length) * 100)}%
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                del día
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Horarios del Día
          </h3>

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {daySchedule.timeSlots.map((slot) => (
              <div
                key={slot.hour}
                class={`p-3 rounded-lg border text-center transition-colors ${
                  slot.isAvailable
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                    : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700"
                }`}
              >
                <div class="font-medium text-gray-900 dark:text-white">
                  {formatTime(slot.hour)}
                </div>

                {slot.isAvailable
                  ? (
                    <div class="mt-1">
                      <span class="text-xs text-green-600 dark:text-green-400 font-medium">
                        Disponible
                      </span>
                      <div class="mt-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickBook(daySchedule.date, slot.hour)}
                          class="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors"
                        >
                          Agendar
                        </button>
                      </div>
                    </div>
                  )
                  : (
                    <div class="mt-1">
                      <span class="text-xs text-red-600 dark:text-red-400 font-medium">
                        Ocupado
                      </span>
                      {slot.appointment && (
                        <div class="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                          {slot.appointment.patientName}
                        </div>
                      )}
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekSchedule = generateWeekSchedule(selectedDate);

    return (
      <div class="space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div class="text-center">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Disponibilidad Semanal
              </p>
              <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {stats.availabilityPercentage}%
              </p>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div class="text-center">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Horas Libres
              </p>
              <p class="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.availableSlots}
              </p>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div class="text-center">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Horas Ocupadas
              </p>
              <p class="text-3xl font-bold text-red-600 dark:text-red-400">
                {stats.occupiedSlots}
              </p>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div class="text-center">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Salas Disponibles
              </p>
              <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {availableRooms.length}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Horarios de la Semana
          </h3>

          <div class="overflow-x-auto max-h-80 overflow-y-auto">
            <div class="grid grid-cols-7 gap-2 min-w-full">
              {/* Header */}
              <div class="text-sm font-medium text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                Hora
              </div>
              {weekSchedule.map((day) => (
                <div key={day.date} class="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {day.dayName}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(day.date)
                      .getDate()}/{new Date(day.date).getMonth() + 1}
                  </div>
                </div>
              ))}

              {/* Rows */}
              {workingHours.map((hour) => (
                <>
                  <div
                    key={`hour-${hour}`}
                    class="text-sm text-gray-600 dark:text-gray-400 p-2 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded"
                  >
                    {formatTime(hour)}
                  </div>
                  {weekSchedule.map((day) => {
                    const slot = day.timeSlots.find((s) => s.hour === hour);
                    return (
                      <div key={`${day.date}-${hour}`} class="p-0.5">
                        {slot?.isAvailable
                          ? (
                            <button
                              type="button"
                              onClick={() => handleQuickBook(day.date, hour)}
                              class="block w-full h-10 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 rounded border border-green-300 dark:border-green-700 transition-colors cursor-pointer text-xs font-medium text-green-700 dark:text-green-300"
                              title={`Crear cita para ${day.dayName} ${
                                formatTime(hour)
                              }`}
                            >
                              <Icon
                                name="plus"
                                className="h-4 w-4"
                              />
                            </button>
                          )
                          : (
                            <div
                              class="w-full h-10 bg-red-100 dark:bg-red-900/30 rounded border border-red-300 dark:border-red-700 flex items-center justify-center"
                              title={slot?.appointment
                                ? `Sala tomada por ${slot.appointment.psychologistName || slot.appointment.psychologistEmail} - Paciente: ${slot.appointment.patientName} - ${formatTime(slot.appointment.startTime || slot.appointment.appointmentTime)}-${formatTime(slot.appointment.endTime || slot.appointment.appointmentTime)}`
                                : "Sala ocupada"}
                            >
                              <Icon
                                name="x"
                                className="h-3 w-3 text-red-600 dark:text-red-400"
                              />
                            </div>
                          )}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthSchedule = generateMonthSchedule(selectedDate);

    return (
      <div class="space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div class="text-center">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Disponibilidad Mensual
              </p>
              <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {stats.availabilityPercentage}%
              </p>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div class="text-center">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Días con Disponibilidad
              </p>
              <p class="text-3xl font-bold text-green-600 dark:text-green-400">
                {monthSchedule.filter((day) =>
                  day.timeSlots.some((slot) => slot.isAvailable)
                ).length}
              </p>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div class="text-center">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Horas Libres
              </p>
              <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {stats.availableSlots}
              </p>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div class="text-center">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Salas Activas
              </p>
              <p class="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {availableRooms.length}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Resumen Diario del Mes
          </h3>

          <div class="grid grid-cols-7 gap-2">
            {/* Headers */}
            {dayNames.slice(1).concat(dayNames.slice(0, 1)).map((dayName) => (
              <div
                key={dayName}
                class="text-center text-sm font-medium text-gray-600 dark:text-gray-400 p-2"
              >
                {dayName}
              </div>
            ))}

            {/* Days */}
            {monthSchedule.map((day) => {
              const availableCount = day.timeSlots.filter((slot) =>
                slot.isAvailable
              ).length;
              const availabilityPercent = Math.round(
                (availableCount / workingHours.length) * 100,
              );

              return (
                <div
                  key={day.date}
                  class={`p-3 rounded-lg border text-center transition-colors ${
                    availableCount > 0
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
                      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700"
                  }`}
                >
                  <div class="font-medium text-gray-900 dark:text-white">
                    {new Date(day.date).getDate()}
                  </div>
                  <div class="text-xs mt-1">
                    <span
                      class={`font-medium ${
                        availableCount > 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {availabilityPercent}%
                    </span>
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {availableCount}h libres
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div class="space-y-6">
      {/* Controls */}
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center space-x-4">
          <button
            title="Navegar al período anterior"
            type="button"
            onClick={() => navigateDate("prev")}
            class="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Icon name="chevron-left" size={20} />
          </button>

          <h2 class="text-xl font-semibold text-gray-900 dark:text-white min-w-[250px] text-center">
            {getDateRangeText()}
          </h2>

          <button
            title="Navegar al período siguiente"
            type="button"
            onClick={() => navigateDate("next")}
            class="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Icon name="chevron-right" size={20} />
          </button>
        </div>

        <div class="flex items-center space-x-2">
          <button
            type="button"
            onClick={goToToday}
            class="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Hoy
          </button>

          <div class="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            {["day", "week", "month"].map((mode) => (
              <button
                type="button"
                key={mode}
                onClick={() => setViewMode(mode as "day" | "week" | "month")}
                class={`px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {mode === "day" && "Día"}
                {mode === "week" && "Semana"}
                {mode === "month" && "Mes"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div class="availability-content">
        {viewMode === "day" && renderDayView()}
        {viewMode === "week" && renderWeekView()}
        {viewMode === "month" && renderMonthView()}
      </div>

      {/* Estado de Salas */}
      <CollapsibleSection
        title="Estado de Salas"
        icon="home"
        iconColor="text-blue-500"
        defaultCollapsed
      >
        <div class="flex items-center justify-between mb-6">
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {availableRooms.length} disponibles de {rooms.length} salas
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 max-h-96 overflow-y-auto">
          {rooms.map((room) => {
            const todayDate = new Date().toISOString().split("T")[0] || "";
            const roomAppointments = getAppointmentsInRoom(
              room.id || "",
              todayDate,
            );
            const isAvailable = room.isAvailable &&
              roomAppointments.length === 0;

            return (
              <div
                key={room.id}
                class={`rounded-lg p-4 border transition-colors ${
                  isAvailable
                    ? "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700"
                    : "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700"
                }`}
              >
                <div class="flex items-center justify-between mb-2">
                  <h4 class="font-medium text-gray-900 dark:text-white">
                    {room.name}
                  </h4>
                  <div
                    class={`w-3 h-3 rounded-full ${
                      isAvailable ? "bg-green-400" : "bg-red-400"
                    }`}
                    title={isAvailable ? "Disponible" : "Ocupada"}
                  >
                  </div>
                </div>

                {room.description && (
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {room.description}
                  </p>
                )}

                {/* Mostrar sesiones ocupadas */}
                {roomAppointments.length > 0 && (
                  <div class="mb-3">
                    <h5 class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sesiones Hoy:
                    </h5>
                    <div class="space-y-1">
                      {roomAppointments.slice(0, 3).map((apt) => (
                        <div
                          key={apt.id}
                          class="text-xs p-2 bg-white dark:bg-gray-700 rounded border"
                        >
                          <div class="font-medium text-gray-900 dark:text-white truncate">
                            {apt.patientName}
                          </div>
                          <div class="text-gray-500 dark:text-gray-400">
                            {apt.startTime && apt.endTime
                              ? `${formatTime(apt.startTime)} - ${
                                formatTime(apt.endTime)
                              }`
                              : formatTime(apt.appointmentTime)}
                          </div>
                          <a
                            href={`/appointments/${apt.id}`}
                            class="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Ver detalle →
                          </a>
                        </div>
                      ))}

                      {roomAppointments.length > 3 && (
                        <div class="text-xs text-gray-500 dark:text-gray-400 text-center">
                          +{roomAppointments.length - 3} más...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div class="flex items-center justify-between">
                  <span
                    class={`text-xs font-medium ${
                      isAvailable
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    Sala #{room.id}
                  </span>

                  {isAvailable
                    ? (
                      <button
                        type="button"
                        onClick={() => {
                          handleQuickBook(todayDate, "09:00", room.id || "1");
                        }}
                        class="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors"
                        title={`Agendar cita en ${room.name}`}
                      >
                        Agendar
                      </button>
                    )
                    : (
                      <span class="text-xs text-red-600 dark:text-red-400 font-medium">
                        {!room.isAvailable ? "Inactiva" : "Ocupada"}
                      </span>
                    )}
                </div>
              </div>
            );
          })}
        </div>

        {rooms.length === 0 && (
          <div class="text-center py-8">
            <Icon
              name="briefcase"
              className="h-12 w-12 text-gray-400 mx-auto mb-4"
            />
            <p class="text-gray-500 dark:text-gray-400">
              No hay salas configuradas
            </p>
          </div>
        )}
      </CollapsibleSection>

      {/* Modal de Agendado Rápido */}
      {showBookingModal && bookingData && (
        <QuickBookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          date={bookingData.date}
          time={bookingData.time}
          roomId={bookingData.roomId}
          patients={patients}
          rooms={rooms}
          psychologistEmail={psychologistEmail || ""}
        />
      )}
    </div>
  );
}
