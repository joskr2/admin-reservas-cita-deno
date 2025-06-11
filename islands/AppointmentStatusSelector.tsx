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
          },
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

  return (
    <select
      value={currentStatus}
      onChange={handleStatusChange}
      disabled={isUpdating}
      title="Cambiar estado de la cita"
      class={`px-2 py-1 rounded text-xs font-medium border-0 ${
        getStatusColor(
          currentStatus,
        )
      } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <option value={currentStatus}>{getStatusText(currentStatus)}</option>
      {availableStatuses
        .filter((status) => status !== currentStatus)
        .map((status) => (
          <option key={status} value={status}>
            {getStatusText(status)}
          </option>
        ))}
    </select>
  );
}
