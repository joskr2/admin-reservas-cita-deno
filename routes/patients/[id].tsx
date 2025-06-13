import { type FreshContext, type PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { type AppState, type Patient } from "../../types/index.ts";
import { getPatientRepository } from "../../lib/database/index.ts";
import { Icon } from "../../components/ui/Icon.tsx";

export async function handler(_req: Request, ctx: FreshContext<AppState>) {
  const patientId = ctx.params.id;

  if (!patientId) {
    return new Response("ID de paciente requerido", { status: 400 });
  }

  try {
    const patientRepository = getPatientRepository();
    const patient = await patientRepository.getById(patientId);

    if (!patient) {
      return new Response("Paciente no encontrado", { status: 404 });
    }

    return ctx.render({ patient });
  } catch (error) {
    console.error("Error loading patient:", error);
    return ctx.render({ error: "Error al cargar el paciente", patient: null });
  }
}

export default function PatientDetailsPage({
  data,
}: PageProps<{ patient: Patient | null; error?: string }, AppState>) {
  const { patient, error } = data;

  if (error || !patient) {
    return (
      <>
        <Head>
          <title>Paciente no encontrado - Horizonte Clínica</title>
        </Head>
        <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div class="text-center">
            <Icon name="user" size={48} className="text-red-500 mx-auto mb-4" />
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {error || "Paciente no encontrado"}
            </h1>
            <a
              href="/patients"
              class="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Icon name="arrow-left" size={16} className="mr-2" />
              Volver a la lista de pacientes
            </a>
          </div>
        </div>
      </>
    );
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "No especificado";
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Fecha inválida";
    }
  };

  const formatSystemDate = (dateString: string | undefined) => {
    if (!dateString) return "No disponible";
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getGenderLabel = (gender?: string) => {
    switch (gender) {
      case "male":
        return "Masculino";
      case "female":
        return "Femenino";
      case "other":
        return "Otro";
      case "prefer_not_say":
        return "Prefiero no decir";
      default:
        return "No especificado";
    }
  };

  return (
    <>
      <Head>
        <title>
          {patient.name} - Detalles del Paciente - Horizonte Clínica
        </title>
        <meta
          name="description"
          content={`Información detallada del paciente ${patient.name}`}
        />
      </Head>

      <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main class="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
          <div class="px-4 py-6 sm:px-0">
            {/* Header */}
            <div class="mb-8">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {patient.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                      {patient.name}
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400">
                      Información del paciente
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <a
                    href="/patients"
                    class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Icon name="arrow-left" size={16} className="mr-2" />
                    Volver
                  </a>
                  <a
                    href={`/patients/edit/${patient.id}`}
                    class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
                  >
                    <Icon name="edit" size={16} className="mr-2" />
                    Editar
                  </a>
                </div>
              </div>
            </div>

            {/* Contenido principal */}
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Información principal */}
              <div class="lg:col-span-2 space-y-6">
                {/* Información personal */}
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Icon name="user" size={20} />
                    Información Personal
                  </h2>

                  <dl class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Nombre Completo
                      </dt>
                      <dd class="mt-1 text-lg text-gray-900 dark:text-white">
                        {patient.name}
                      </dd>
                    </div>

                    {patient.dateOfBirth && (
                      <div>
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Fecha de Nacimiento
                        </dt>
                        <dd class="mt-1 text-lg text-gray-900 dark:text-white">
                          {formatDate(patient.dateOfBirth)}
                        </dd>
                      </div>
                    )}

                    {patient.gender && (
                      <div>
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Género
                        </dt>
                        <dd class="mt-1 text-lg text-gray-900 dark:text-white">
                          {getGenderLabel(patient.gender)}
                        </dd>
                      </div>
                    )}

                    <div>
                      <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Estado
                      </dt>
                      <dd class="mt-1">
                        <span
                          class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            patient.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          <Icon
                            name={patient.isActive ? "check" : "x"}
                            size={12}
                            className="mr-1"
                          />
                          {patient.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Información de contacto */}
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Icon name="mail" size={20} />
                    Información de Contacto
                  </h2>

                  <dl class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Email
                      </dt>
                      <dd class="mt-1 text-lg text-gray-900 dark:text-white">
                        {patient.email || "No especificado"}
                      </dd>
                    </div>

                    <div>
                      <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Teléfono
                      </dt>
                      <dd class="mt-1 text-lg text-gray-900 dark:text-white">
                        {patient.phone || "No especificado"}
                      </dd>
                    </div>

                    {patient.address && (
                      <div class="sm:col-span-2">
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Dirección
                        </dt>
                        <dd class="mt-1 text-lg text-gray-900 dark:text-white">
                          {patient.address}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Contacto de emergencia */}
                {patient.emergencyContact && (
                  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <Icon name="heart" size={20} />
                      Contacto de Emergencia
                    </h2>

                    <dl class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div>
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Nombre
                        </dt>
                        <dd class="mt-1 text-lg text-gray-900 dark:text-white">
                          {patient.emergencyContact.name}
                        </dd>
                      </div>

                      <div>
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Teléfono
                        </dt>
                        <dd class="mt-1 text-lg text-gray-900 dark:text-white">
                          {patient.emergencyContact.phone}
                        </dd>
                      </div>

                      <div>
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Relación
                        </dt>
                        <dd class="mt-1 text-lg text-gray-900 dark:text-white">
                          {patient.emergencyContact.relationship}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}

                {/* Información médica */}
                {(patient.medicalHistory || patient.notes) && (
                  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <Icon name="heart-handshake" size={20} />
                      Información Médica
                    </h2>

                    <dl class="space-y-6">
                      {patient.medicalHistory && (
                        <div>
                          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Historial Médico
                          </dt>
                          <dd class="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            {patient.medicalHistory}
                          </dd>
                        </div>
                      )}

                      {patient.notes && (
                        <div>
                          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Notas Adicionales
                          </dt>
                          <dd class="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            {patient.notes}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </div>

              {/* Panel lateral */}
              <div class="space-y-6">
                {/* Información del sistema */}
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Información del Sistema
                  </h3>

                  <div class="space-y-4">
                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                        ID del Paciente
                      </label>
                      <p class="text-sm text-gray-900 dark:text-gray-100 mt-1 font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded">
                        {patient.id}
                      </p>
                    </div>

                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Fecha de Registro
                      </label>
                      <p class="text-sm text-gray-900 dark:text-gray-100 mt-1">
                        {formatSystemDate(patient.createdAt)}
                      </p>
                    </div>

                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Última Actualización
                      </label>
                      <p class="text-sm text-gray-900 dark:text-gray-100 mt-1">
                        {formatSystemDate(patient.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Acciones rápidas */}
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Acciones
                  </h3>
                  <div class="space-y-3">
                    <a
                      href={`/patients/edit/${patient.id}`}
                      class="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Icon name="edit" size={16} className="mr-2" />
                      Editar Paciente
                    </a>

                    <a
                      href={`/appointments/new?patient=${
                        encodeURIComponent(
                          patient.name,
                        )
                      }`}
                      class="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <Icon name="calendar-plus" size={16} className="mr-2" />
                      Nueva Cita
                    </a>

                    <a
                      href={`/patients/delete/${patient.id}`}
                      class="w-full inline-flex items-center justify-center px-4 py-2 border border-red-300 dark:border-red-600 rounded-lg text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Icon name="trash-2" size={16} className="mr-2" />
                      Eliminar Paciente
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
