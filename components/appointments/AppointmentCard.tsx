import { type Appointment } from "../../types/index.ts";
import { Badge } from "../ui/Badge.tsx";
import { Icon } from "../ui/Icon.tsx";
import { getStatusText } from "../../lib/utils/appointmentUtils.ts";
import AppointmentDetailsDropdown from "../../islands/AppointmentDetailsDropdown.tsx";

interface AppointmentCardProps {
  appointment: Appointment;
  showActions?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function AppointmentCard({
  appointment,
  showActions = true,
  onEdit,
  onDelete,
}: AppointmentCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-ES", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      {/* Header con badge de estado y dropdown */}
      <div class="flex items-start justify-between mb-3">
        <div class="flex items-center space-x-2">
          <Badge variant={appointment.status} size="sm">
            {getStatusText(appointment.status)}
          </Badge>
          <AppointmentDetailsDropdown appointment={appointment} isCompact />
        </div>

        {showActions && (
          <div class="flex items-center space-x-1">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(appointment.id)}
                class="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Editar cita"
              >
                <Icon name="edit" size={16} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(appointment.id)}
                class="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Eliminar cita"
              >
                <Icon name="trash-2" size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Información principal */}
      <div class="space-y-2">
        <div class="flex items-center space-x-2">
          <Icon name="user" size={16} className="text-gray-400" />
          <span class="text-sm font-medium text-gray-900 dark:text-white">
            {appointment.patientName}
          </span>
        </div>

        <div class="flex items-center space-x-2">
          <Icon name="user-cog" size={16} className="text-gray-400" />
          <span class="text-sm text-gray-600 dark:text-gray-300">
            {appointment.psychologistName || appointment.psychologistEmail}
          </span>
        </div>

        <div class="flex items-center space-x-2">
          <Icon name="calendar" size={16} className="text-gray-400" />
          <span class="text-sm text-gray-600 dark:text-gray-300">
            {formatDate(appointment.appointmentDate)}
          </span>
        </div>

        <div class="flex items-center space-x-2">
          <Icon name="clock" size={16} className="text-gray-400" />
          <span class="text-sm text-gray-600 dark:text-gray-300">
            {formatTime(appointment.appointmentTime)}
          </span>
        </div>

        <div class="flex items-center space-x-2">
          <Icon name="briefcase" size={16} className="text-gray-400" />
          <span class="text-sm text-gray-600 dark:text-gray-300">
            Sala {appointment.roomId}
          </span>
        </div>

        {appointment.notes && (
          <div class="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
            <p class="text-xs text-gray-600 dark:text-gray-300">
              <strong>Observaciones:</strong> {appointment.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
