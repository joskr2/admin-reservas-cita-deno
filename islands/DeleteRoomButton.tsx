import { useState } from "preact/hooks";
import { Icon } from "../components/ui/Icon.tsx";

interface DeleteRoomButtonProps {
  roomId: string;
  roomName: string;
  className?: string;
}

export default function DeleteRoomButton({
  roomId,
  roomName,
  className = "",
}: DeleteRoomButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        `¿Estás seguro de eliminar la sala ${roomId} (${roomName})?\n\nEsta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/rooms/${roomId}/delete`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Redirigir a la página de salas con mensaje de éxito
        globalThis.location.href = "/rooms?success=sala_eliminada";
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(
          errorData.error || "Error al eliminar la sala. Inténtalo de nuevo.",
        );
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      class={`w-full inline-flex items-center justify-center px-4 py-2 border border-red-300 dark:border-red-600 rounded-lg text-red-700 dark:text-red-300 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={`Eliminar sala ${roomId}`}
    >
      <Icon name="trash-2" size={16} className="mr-2" />
      {isDeleting ? "Eliminando..." : "Eliminar Sala"}
    </button>
  );
}
