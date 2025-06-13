import { useState } from "preact/hooks";
import { Icon } from "../components/ui/Icon.tsx";
import type { RoomId } from "../types/index.ts";

interface RoomToggleButtonProps {
  roomId: RoomId;
  isAvailable: boolean;
  onToggle?: (roomId: RoomId, newAvailability: boolean) => void;
}

export default function RoomToggleButton({
  roomId,
  isAvailable,
  onToggle,
}: RoomToggleButtonProps) {
  const [loading, setLoading] = useState(false);
  const [currentAvailability, setCurrentAvailability] = useState(isAvailable);

  const handleToggle = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/rooms/${roomId}/toggle-availability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const newAvailability = data.newAvailability;
        setCurrentAvailability(newAvailability);

        // Llamar callback si existe
        if (onToggle) {
          onToggle(roomId, newAvailability);
        }

        // Mostrar mensaje de éxito temporal
        showNotification(data.message);

        // Opcional: recargar la página después de un breve delay para actualizar estadísticas
        setTimeout(() => {
          globalThis.location.reload();
        }, 1500);
      } else {
        const errorData = await response.json();
        console.error("Error al cambiar disponibilidad:", errorData.error);
        showNotification(
          errorData.error || "Error al cambiar la disponibilidad",
          "error",
        );
      }
    } catch (error) {
      console.error("Error:", error);
      showNotification("Error de conexión", "error");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    // Crear notificación temporal
    const notification = document.createElement("div");
    notification.className =
      `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
        type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
      }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remover después de 3 segundos
    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      class={`px-3 py-1 text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        currentAvailability
          ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
          : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40"
      }`}
    >
      {loading
        ? (
          <div class="flex items-center">
            <Icon name="loader" size={12} className="mr-1 animate-spin" />
            Cambiando...
          </div>
        )
        : (
          <>
            {currentAvailability
              ? "Marcar como Ocupada"
              : "Marcar como Disponible"}
          </>
        )}
    </button>
  );
}
