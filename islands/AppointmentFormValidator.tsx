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
  const handleSubmit = (e: Event) => {
    // Validación adicional en el frontend para psicólogos
    if (currentUserRole === "psychologist") {
      const formData = new FormData(e.target as HTMLFormElement);
      const selectedPsychologist = formData
        .get("psychologistEmail")
        ?.toString();

      if (selectedPsychologist !== currentUserEmail) {
        e.preventDefault();
        alert("No tienes permisos para asignar citas a otros psicólogos");
        return false;
      }
    }
  };

  return (
    <form action={action} method={method} onSubmit={handleSubmit}>
      {children}
    </form>
  );
}
