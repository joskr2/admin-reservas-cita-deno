import { useState } from "preact/hooks";
import { type AppointmentStatus } from "../types/index.ts";
import {
  getNextStatuses,
  getStatusColor,
  getStatusText,
} from "../lib/utils/appointmentUtils.ts";

interface AppointmentStatusSelectorProps {
  appointmentId: string;
  currentStatus: AppointmentStatus;
}

export default function AppointmentStatusSelector({
  appointmentId,
  currentStatus,
}: AppointmentStatusSelectorProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const availableStatuses = getNextStatuses(currentStatus);

  const handleStatusChange = async (e: Event) => {
    const target = e.target as HTMLSelectElement;
    const newStatus = target.value as AppointmentStatus;

    if (confirm(`¿Cambiar estado a "${getStatusText(newStatus)}"?`)) {
      setIsUpdating(true);
      try {
        const response = await fetch(
          `/api/appointments/${appointmentId}/update`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: newStatus,
            }),
          }
        );

        if (response.ok) {
          globalThis.location.reload();
        } else {
          alert("Error al actualizar el estado");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Error al actualizar el estado");
      } finally {
        setIsUpdating(false);
      }
    } else {
      // Revertir la selección si el usuario cancela
      target.value = currentStatus;
    }
  };

  // Obtener colores base del estado actual
  const statusColorClass = getStatusColor(currentStatus);

  return (
    <div class="relative inline-block w-full sm:w-auto">
      <select
        value={currentStatus}
        onChange={handleStatusChange}
        disabled={isUpdating}
        title="Cambiar estado de la cita"
        class={`
          appearance-none cursor-pointer
          px-3 py-2 pr-8
          text-sm font-medium
          border border-transparent rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-all duration-200
          w-full sm:min-w-[120px] sm:w-auto
          ${statusColorClass}
          ${isUpdating ? "opacity-50 cursor-not-allowed" : "hover:shadow-md"}
        `}
      >
        <option value={currentStatus} class="bg-white text-gray-900 py-2">
          {getStatusText(currentStatus)}
        </option>
        {availableStatuses
          .filter((status) => status !== currentStatus)
          .map((status) => (
            <option
              key={status}
              value={status}
              class="bg-white text-gray-900 py-2 hover:bg-gray-50"
            >
              {getStatusText(status)}
            </option>
          ))}
      </select>

      {/* Icono de dropdown personalizado */}
      <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg
          class="h-4 w-4 text-current opacity-70"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
        </svg>
      </div>

      {/* Indicador de carga */}
      {isUpdating && (
        <div class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-md">
          <div class="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      )}
    </div>
  );
}
