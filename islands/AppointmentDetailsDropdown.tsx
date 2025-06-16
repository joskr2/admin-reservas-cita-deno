import { useState } from "preact/hooks";
import {
  type Appointment,
  type AppointmentStatus,
  type AppointmentStatusHistory,
} from "../types/index.ts";
import { Icon } from "../components/ui/Icon.tsx";
import {
  getStatusColor,
  getStatusText,
} from "../lib/utils/appointmentUtils.ts";

interface AppointmentDetailsDropdownProps {
  appointment: Appointment;
  isCompact?: boolean; // Para vista mobile
}

export default function AppointmentDetailsDropdown({
  appointment,
  isCompact = false,
}: AppointmentDetailsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Crear historial completo incluyendo el estado actual si no existe
  const fullHistory: AppointmentStatusHistory[] = [
    // Estado inicial (creación)
    {
      status: "pending" as AppointmentStatus,
      changedAt: appointment.createdAt,
      notes: "Cita creada",
    },
    // Historial existente
    ...(appointment.statusHistory || []),
    // Estado actual si no está en el historial
    ...(appointment.statusHistory?.some((h) => h.status === appointment.status)
      ? []
      : [
        {
          status: appointment.status,
          changedAt: appointment.updatedAt || appointment.createdAt,
          notes: "Estado actual",
        },
      ]),
  ].sort(
    (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime(),
  );

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div class="relative">
      {/* Botón para abrir/cerrar dropdown */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Ver detalles de la cita"
      >
        <Icon
          name={isOpen ? "x" : "plus"}
          size={isCompact ? 12 : 14}
          className="ml-1"
        />
      </button>

      {/* Dropdown content */}
      {isOpen && (
        <div
          class={`absolute ${
            isCompact ? "right-0 top-8" : "left-0 top-10"
          } z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 max-h-96 overflow-y-auto`}
        >
          {/* ID de la cita */}
          <div class="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-1">
              Información de la Cita
            </h4>
            <p class="text-xs text-gray-500 dark:text-gray-400 font-mono">
              ID: {appointment.id}
            </p>
            <div class="mt-2 text-xs text-gray-600 dark:text-gray-300">
              <p>
                <strong>Paciente:</strong> {appointment.patientName}
              </p>
              <p>
                <strong>Psicólogo:</strong>{" "}
                {appointment.psychologistName || appointment.psychologistEmail}
              </p>
              <p>
                <strong>Sala:</strong> {appointment.roomId}
              </p>
              <p>
                <strong>Fecha:</strong> {new Date(
                  `${appointment.appointmentDate}T${appointment.appointmentTime}`,
                ).toLocaleString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {appointment.notes && (
                <p>
                  <strong>Observaciones:</strong> {appointment.notes}
                </p>
              )}
            </div>
          </div>

          {/* Historial de estados */}
          <div>
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Historial de Estados
            </h4>
            <div class="space-y-3">
              {fullHistory.map((historyItem, index) => (
                <div
                  key={`${historyItem.status}-${historyItem.changedAt}-${index}`}
                  class="flex items-start space-x-3"
                >
                  {/* Número del estado */}
                  <div class="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>

                  {/* Contenido del estado */}
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2 mb-1">
                      <span
                        class={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          getStatusColor(
                            historyItem.status,
                          )
                        }`}
                      >
                        {getStatusText(historyItem.status)}
                      </span>
                      <span class="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(historyItem.changedAt)}
                      </span>
                    </div>

                    <p class="text-xs text-gray-600 dark:text-gray-300 mb-1">
                      <strong>{getStatusText(historyItem.status)}</strong> de
                      {" "}
                      {appointment.psychologistName ||
                        appointment.psychologistEmail} con el paciente{" "}
                      {appointment.patientName}, en la sala{" "}
                      {appointment.roomId}, a las{" "}
                      {formatTime(historyItem.changedAt)}
                    </p>

                    {historyItem.notes && (
                      <p class="text-xs text-gray-500 dark:text-gray-400 italic">
                        Observaciones: {historyItem.notes}
                      </p>
                    )}

                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatDateTime(historyItem.changedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botón para cerrar */}
          <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              class="w-full text-center text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 py-1"
            >
              Cerrar detalles
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
