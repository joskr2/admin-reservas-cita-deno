import { Icon } from "../ui/Icon.tsx";
import { Badge } from "../ui/Badge.tsx";
import type { Appointment, AppointmentStatus } from "../../types/index.ts";

interface AppointmentsOverviewProps {
  appointments: Appointment[];
  showHeader?: boolean;
  maxItems?: number;
}

interface AppointmentSummary {
  total: number;
  pending: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  today: number;
  thisWeek: number;
  upcoming: Appointment[];
}

export default function AppointmentsOverview({
  appointments,
  showHeader = true,
  maxItems = 3,
}: AppointmentsOverviewProps) {
  // Calcular estadísticas de citas
  const getAppointmentSummary = (): AppointmentSummary => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Calcular inicio de la semana (lunes)
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const summary: AppointmentSummary = {
      total: appointments.length,
      pending: 0,
      scheduled: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      today: 0,
      thisWeek: 0,
      upcoming: [],
    };

    appointments.forEach((apt) => {
      // Contar por estado
      switch (apt.status) {
        case "pending":
          summary.pending++;
          break;
        case "scheduled":
          summary.scheduled++;
          break;
        case "in_progress":
          summary.inProgress++;
          break;
        case "completed":
          summary.completed++;
          break;
        case "cancelled":
          summary.cancelled++;
          break;
      }

      // Contar por fecha
      if (apt.appointmentDate === todayStr) {
        summary.today++;
      }

      const aptDate = new Date(apt.appointmentDate);
      if (aptDate >= startOfWeek && aptDate <= endOfWeek) {
        summary.thisWeek++;
      }

      // Citas próximas (no canceladas y futuras)
      if (apt.status !== "cancelled" && apt.status !== "completed") {
        const aptDateTime = new Date(
          `${apt.appointmentDate}T${apt.appointmentTime}`
        );
        if (aptDateTime >= today) {
          summary.upcoming.push(apt);
        }
      }
    });

    // Ordenar citas próximas por fecha
    summary.upcoming.sort((a, b) => {
      const dateA = new Date(`${a.appointmentDate}T${a.appointmentTime}`);
      const dateB = new Date(`${b.appointmentDate}T${b.appointmentTime}`);
      return dateA.getTime() - dateB.getTime();
    });

    summary.upcoming = summary.upcoming.slice(0, maxItems);

    return summary;
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

  const formatDateTime = (date: string, time: string): string => {
    const dateObj = new Date(`${date}T${time}`);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const isToday = date === today.toISOString().split("T")[0];
    const isTomorrow = date === tomorrow.toISOString().split("T")[0];

    let dateStr = "";
    if (isToday) {
      dateStr = "Hoy";
    } else if (isTomorrow) {
      dateStr = "Mañana";
    } else {
      dateStr = dateObj.toLocaleDateString("es-ES", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }

    const timeStr = dateObj.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${dateStr} a las ${timeStr}`;
  };

  const summary = getAppointmentSummary();

  return (
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {showHeader && (
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Icon
              name="calendar"
              size={20}
              className="mr-2 text-gray-600 dark:text-gray-400"
            />
            Resumen de Citas
          </h3>
          <a
            href="/appointments"
            class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Ver todas →
          </a>
        </div>
      )}

      {/* Estadísticas rápidas */}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {summary.today}
          </div>
          <div class="text-xs text-blue-600 dark:text-blue-400 font-medium">
            Hoy
          </div>
        </div>

        <div class="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">
            {summary.thisWeek}
          </div>
          <div class="text-xs text-green-600 dark:text-green-400 font-medium">
            Esta semana
          </div>
        </div>

        <div class="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
          <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {summary.scheduled}
          </div>
          <div class="text-xs text-purple-600 dark:text-purple-400 font-medium">
            Programadas
          </div>
        </div>

        <div class="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div class="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {summary.total}
          </div>
          <div class="text-xs text-gray-600 dark:text-gray-400 font-medium">
            Total
          </div>
        </div>
      </div>

      {/* Distribución por estado */}
      <div class="mb-6">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Estado de las citas
        </h4>
        <div class="flex flex-wrap gap-2">
          {summary.pending > 0 && (
            <Badge variant="pending" size="sm">
              {summary.pending} Pendientes
            </Badge>
          )}
          {summary.scheduled > 0 && (
            <Badge variant="scheduled" size="sm">
              {summary.scheduled} Programadas
            </Badge>
          )}
          {summary.inProgress > 0 && (
            <Badge variant="in_progress" size="sm">
              {summary.inProgress} En progreso
            </Badge>
          )}
          {summary.completed > 0 && (
            <Badge variant="completed" size="sm">
              {summary.completed} Completadas
            </Badge>
          )}
          {summary.cancelled > 0 && (
            <Badge variant="cancelled" size="sm">
              {summary.cancelled} Canceladas
            </Badge>
          )}
        </div>
      </div>

      {/* Próximas citas */}
      <div>
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Próximas citas
        </h4>

        {summary.upcoming.length === 0 ? (
          <div class="text-center py-4">
            <Icon
              name="calendar"
              size={32}
              className="mx-auto text-gray-300 dark:text-gray-600 mb-2"
            />
            <p class="text-sm text-gray-500 dark:text-gray-400">
              No hay citas próximas programadas
            </p>
          </div>
        ) : (
          <div class="space-y-3">
            {summary.upcoming.map((apt) => (
              <div
                key={apt.id}
                class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div class="flex items-center space-x-3">
                  <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {apt.patientName}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(apt.appointmentDate, apt.appointmentTime)}
                    </p>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <Badge variant={apt.status} size="sm">
                    {getStatusText(apt.status)}
                  </Badge>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    Sala {apt.roomId}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {summary.upcoming.length > 0 && (
          <div class="mt-4">
            <a
              href="/appointments"
              class="block text-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Ver todas las citas próximas
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
