import { useState } from "preact/hooks";

interface DeleteAppointmentButtonProps {
  appointmentId: string;
  className?: string;
  children: preact.ComponentChildren;
}

export default function DeleteAppointmentButton({
  appointmentId,
  className = "",
  children,
}: DeleteAppointmentButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm("¿Estás seguro de que quieres eliminar esta cita?")) {
      setIsDeleting(true);
      try {
        const response = await fetch(
          `/api/appointments/${appointmentId}/delete`,
          {
            method: "DELETE",
          },
        );

        if (response.ok) {
          globalThis.location.reload();
        } else {
          alert("Error al eliminar la cita");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Error al eliminar la cita");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      class={`${className} ${
        isDeleting ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {children}
    </button>
  );
}
