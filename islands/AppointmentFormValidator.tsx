import { type ComponentChildren } from "preact";

interface AppointmentFormValidatorProps {
  currentUserRole: string;
  currentUserEmail: string;
  children: ComponentChildren;
  action: string;
  method?: string;
}

export default function AppointmentFormValidator({
  currentUserRole,
  currentUserEmail,
  children,
  action,
  method = "POST",
}: AppointmentFormValidatorProps) {
  const handleSubmit = (e: Event): boolean => {
    // Validación adicional en el frontend para psicólogos
    if (currentUserRole === "psychologist") {
      const formData = new FormData(e.target as HTMLFormElement);
      const selectedPsychologist = formData
        .get("psychologistEmail")
        ?.toString();

      // Si no hay psicólogo seleccionado y es un psicólogo, usar su email
      if (!selectedPsychologist && currentUserRole === "psychologist") {
        // Agregar el email del psicólogo actual al formulario
        const hiddenInput = document.createElement("input");
        hiddenInput.type = "hidden";
        hiddenInput.name = "psychologistEmail";
        hiddenInput.value = currentUserEmail;
        (e.target as HTMLFormElement).appendChild(hiddenInput);
      } else if (
        selectedPsychologist &&
        selectedPsychologist !== currentUserEmail
      ) {
        e.preventDefault();
        alert("No tienes permisos para asignar citas a otros psicólogos");
        return false;
      }
    }
    return true;
  };

  return (
    <form action={action} method={method} onSubmit={handleSubmit}>
      {children}
    </form>
  );
}
