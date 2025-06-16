import { Icon } from "../ui/Icon.tsx";
import type { Appointment, Room } from "../../types/index.ts";

interface AvailabilityScheduleProps {
  appointments: Appointment[];
  rooms: Room[];
  psychologistEmail?: string;
  userRole: string;
}

interface TimeSlot {
  hour: string;
  isAvailable: boolean;
  appointment?: Appointment;
  room?: string;
}

interface DaySchedule {
  date: string;
  dayName: string;
  timeSlots: TimeSlot[];
  availableRooms: Room[];
}

export default function AvailabilitySchedule({
  appointments,
  rooms,
  psychologistEmail,
  userRole,
}: AvailabilityScheduleProps) {
  // Horario laboral: 8:00 AM - 6:00 PM
  const workingHours = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
    "14:00", "15:00", "16:00", "17:00", "18:00"
  ];

  const today = new Date();
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  // Filtrar citas según el rol
  const filteredAppointments = userRole === "superadmin" 
    ? appointments 
    : appointments.filter(apt => apt.psychologistEmail === psychologistEmail);

  // Salas disponibles (activas)
  const availableRooms = rooms.filter(room => room.isAvailable);

  // Generar horario para los próximos 7 días
  const generateWeekSchedule = (): DaySchedule[] => {
    const weekSchedule: DaySchedule[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      // Citas del día
      const dayAppointments = filteredAppointments.filter(
        apt => apt.appointmentDate === dateString
      );

      // Generar slots de tiempo para el día
      const timeSlots: TimeSlot[] = workingHours.map(hour => {
        const appointment = dayAppointments.find(apt => {
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

      weekSchedule.push({
        date: dateString,
        dayName: dayNames[date.getDay()],
        timeSlots,
        availableRooms: availableRooms,
      });
    }

    return weekSchedule;
  };

  // Obtener estadísticas de disponibilidad
  const getAvailabilityStats = () => {
    const weekSchedule = generateWeekSchedule();
    
    const totalSlots = weekSchedule.length * workingHours.length;
    const occupiedSlots = weekSchedule.reduce((acc, day) => 
      acc + day.timeSlots.filter(slot => !slot.isAvailable).length, 0
    );
    const availableSlots = totalSlots - occupiedSlots;

    // Calcular disponibilidad por día (hoy)
    const todaySchedule = weekSchedule[0];
    const todayAvailable = todaySchedule.timeSlots.filter(slot => slot.isAvailable).length;
    
    // Calcular próximo slot disponible
    let nextAvailableSlot = null;
    for (const day of weekSchedule) {
      const availableSlot = day.timeSlots.find(slot => slot.isAvailable);
      if (availableSlot) {
        nextAvailableSlot = {
          date: day.date,
          time: availableSlot.hour,
          dayName: day.dayName,
        };
        break;
      }
    }

    return {
      totalSlots,
      availableSlots,
      occupiedSlots,
      todayAvailable,
      availabilityPercentage: Math.round((availableSlots / totalSlots) * 100),
      nextAvailableSlot,
    };
  };

  const stats = getAvailabilityStats();
  const weekSchedule = generateWeekSchedule();

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${displayHour}:${minute} ${period}`;
  };

  return (
    <div class="space-y-6">
      {/* Estadísticas de Disponibilidad */}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Horas Disponibles Hoy
              </p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.todayAvailable}
              </p>
            </div>
            <div class="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <Icon name="clock" className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Disponibilidad Semanal
              </p>
              <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.availabilityPercentage}%
              </p>
            </div>
            <div class="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Icon name="activity" className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Salas Disponibles
              </p>
              <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {availableRooms.length}
              </p>
            </div>
            <div class="h-12 w-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Icon name="briefcase" className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Próximo Disponible
              </p>
              <p class="text-lg font-bold text-orange-600 dark:text-orange-400">
                {stats.nextAvailableSlot 
                  ? `${stats.nextAvailableSlot.dayName} ${formatTime(stats.nextAvailableSlot.time)}`
                  : "No disponible"
                }
              </p>
            </div>
            <div class="h-12 w-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <Icon name="calendar-plus" className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Horario Semanal */}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Disponibilidad de Horarios - Próximos 7 Días
          </h3>
          <div class="flex items-center space-x-4 text-sm">
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-green-200 dark:bg-green-700 rounded"></div>
              <span class="text-gray-600 dark:text-gray-400">Disponible</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-red-200 dark:bg-red-700 rounded"></div>
              <span class="text-gray-600 dark:text-gray-400">Ocupado</span>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <div class="grid grid-cols-8 gap-2 min-w-full">
            {/* Header de horas */}
            <div class="text-sm font-medium text-gray-600 dark:text-gray-400 p-2">
              Hora
            </div>
            {weekSchedule.map((day) => (
              <div key={day.date} class="text-center">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {day.dayName}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(day.date).getDate()}/{new Date(day.date).getMonth() + 1}
                </div>
              </div>
            ))}

            {/* Filas de horarios */}
            {workingHours.map((hour) => (
              <>
                <div key={`hour-${hour}`} class="text-sm text-gray-600 dark:text-gray-400 p-2 flex items-center">
                  {formatTime(hour)}
                </div>
                {weekSchedule.map((day) => {
                  const slot = day.timeSlots.find(s => s.hour === hour);
                  return (
                    <div key={`${day.date}-${hour}`} class="p-1">
                      {slot?.isAvailable ? (
                        <a
                          href={`/appointments/new?date=${day.date}&time=${hour}`}
                          class="block w-full h-8 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 rounded border border-green-300 dark:border-green-700 transition-colors cursor-pointer"
                          title={`Crear cita para ${day.dayName} ${formatTime(hour)}`}
                        >
                          <span class="sr-only">Disponible</span>
                        </a>
                      ) : (
                        <div
                          class="w-full h-8 bg-red-100 dark:bg-red-900/30 rounded border border-red-300 dark:border-red-700 flex items-center justify-center"
                          title={slot?.appointment ? `Ocupado - ${slot.appointment.patientName}` : "Ocupado"}
                        >
                          <Icon name="x" className="h-3 w-3 text-red-600 dark:text-red-400" />
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

      {/* Salas Disponibles */}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Salas Disponibles
          </h3>
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {availableRooms.length} de {rooms.length} salas
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {availableRooms.map((room) => (
            <div
              key={room.id}
              class="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700"
            >
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-medium text-gray-900 dark:text-white">
                  {room.name}
                </h4>
                <div class="w-3 h-3 bg-green-400 rounded-full" title="Disponible"></div>
              </div>
              
              {room.description && (
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {room.description}
                </p>
              )}

              <div class="flex items-center justify-between">
                <span class="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Sala #{room.id}
                </span>
                <a
                  href={`/appointments/new?roomId=${room.id}`}
                  class="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
                  title={`Agendar cita en ${room.name}`}
                >
                  Agendar
                </a>
              </div>
            </div>
          ))}
        </div>

        {availableRooms.length === 0 && (
          <div class="text-center py-8">
            <Icon name="briefcase" className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-500 dark:text-gray-400">
              No hay salas disponibles en este momento
            </p>
          </div>
        )}
      </div>
    </div>
  );
}