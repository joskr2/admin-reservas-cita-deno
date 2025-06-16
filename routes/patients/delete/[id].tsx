import type { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

import type { AppState, Patient } from "../../../types/index.ts";
import { Button } from "../../../components/ui/Button.tsx";
import { Icon } from "../../../components/ui/Icon.tsx";
import { getPatientRepository } from "../../../lib/database/index.ts";

// Data passed from handler to component
interface Data {
  patient?: Patient;
  error?: string;
}

export const handler: Handlers<Data, AppState> = {
  // --- SHOW CONFIRMATION PAGE (SERVER-SIDE) ---
  async GET(_req, ctx) {
    // Only authenticated users can access this page
    if (!ctx.state.user) {
      return new Response(null, {
        status: 307,
        headers: { Location: "/auth/login" },
      });
    }

    const { id } = ctx.params;

    if (!id) {
      return new Response(null, {
        status: 303,
        headers: { Location: "/patients" },
      });
    }

    try {
      const patientRepository = getPatientRepository();
      const patient = await patientRepository.getById(id);

      if (!patient) {
        // If patient doesn't exist, redirect back to patients list
        return new Response(null, {
          status: 303,
          headers: { Location: "/patients?error=not_found" },
        });
      }

      return ctx.render({ patient });
    } catch (error) {
      console.error("Error loading patient:", error);
      return ctx.render({
        error: "Error al cargar la información del paciente.",
      });
    }
  },

  // --- HANDLE DELETION (SERVER-SIDE) ---
  async POST(_req, ctx) {
    if (!ctx.state.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id } = ctx.params;

    if (!id) {
      return ctx.render({
        error: "ID de paciente no válido.",
      });
    }

    try {
      const patientRepository = getPatientRepository();
      const patient = await patientRepository.getById(id);

      if (!patient) {
        return ctx.render({
          error: "El paciente que intentas eliminar ya no existe.",
        });
      }

      // Delete the patient
      await patientRepository.delete(id);

      // Redirect back to the patients list with success message
      return new Response(null, {
        status: 303,
        headers: { Location: "/patients?success=deleted" },
      });
    } catch (error) {
      console.error("Error deleting patient:", error);
      return ctx.render({
        error: "Error al eliminar el paciente de la base de datos.",
      });
    }
  },
};

export default function DeletePatientPage({ data }: PageProps<Data>) {
  const { patient, error } = data;

  return (
    <>
      <Head>
        <title>
          Eliminar Paciente - {patient?.name || "Paciente"} - Horizonte Clínica
        </title>
        <meta name="description" content="Confirmar eliminación de paciente" />
      </Head>

      <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header con navegación */}
          <div class="mb-8">
            <div class="flex items-center space-x-4 mb-4">
              <a
                href="/patients"
                class="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <Icon name="arrow-left" className="h-4 w-4 mr-1" />
                Volver a Pacientes
              </a>
            </div>
          </div>

          {/* Contenido principal */}
          <div class="max-w-2xl mx-auto">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header de advertencia */}
              <div class="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-8 py-6">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="h-12 w-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                      <Icon
                        name="file-warning"
                        size={24}
                        className="text-red-600 dark:text-red-400"
                      />
                    </div>
                  </div>
                  <div class="ml-4">
                    <h1 class="text-2xl font-bold text-red-900 dark:text-red-200">
                      Eliminar Paciente
                    </h1>
                    <p class="text-red-700 dark:text-red-300 mt-1">
                      Esta acción no se puede deshacer
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenido */}
              <div class="px-8 py-6">
                {error && (
                  <div class="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div class="flex items-center">
                      <Icon
                        name="file-warning"
                        className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2"
                      />
                      <div>
                        <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Error
                        </h3>
                        <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          {error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {patient && (
                  <>
                    <div class="text-center mb-6">
                      <p class="text-gray-600 dark:text-gray-400 text-lg">
                        ¿Estás seguro de que deseas eliminar permanentemente el
                        siguiente paciente?
                      </p>
                    </div>

                    {/* Información del paciente */}
                    <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 mb-6">
                      <div class="flex items-center space-x-4 mb-4">
                        <div class="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {patient.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                            {patient.name}
                          </h3>
                          <p class="text-gray-600 dark:text-gray-400">
                            {patient.email || "Sin email"}
                          </p>
                        </div>
                      </div>

                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="flex items-center space-x-2">
                          <Icon
                            name="phone"
                            className="h-4 w-4 text-gray-500"
                          />
                          <span class="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Teléfono:</strong>{" "}
                            {patient.phone || "No especificado"}
                          </span>
                        </div>
                        <div class="flex items-center space-x-2">
                          <Icon
                            name="calendar"
                            className="h-4 w-4 text-gray-500"
                          />
                          <span class="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Registrado:</strong>{" "}
                            {new Date(patient.createdAt).toLocaleDateString(
                              "es-ES",
                            )}
                          </span>
                        </div>
                        <div class="flex items-center space-x-2">
                          <Icon
                            name="users"
                            className="h-4 w-4 text-gray-500"
                          />
                          <span class="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Género:</strong> {patient.gender === "male"
                              ? "Masculino"
                              : patient.gender === "female"
                              ? "Femenino"
                              : patient.gender === "other"
                              ? "Otro"
                              : patient.gender === "prefer_not_say"
                              ? "Prefiero no decir"
                              : "No especificado"}
                          </span>
                        </div>
                        <div class="flex items-center space-x-2">
                          <Icon
                            name="activity"
                            className="h-4 w-4 text-gray-500"
                          />
                          <span class="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Estado:</strong>{" "}
                            {patient.isActive ? "✅ Activo" : "❌ Inactivo"}
                          </span>
                        </div>
                        {patient.dateOfBirth && (
                          <div class="flex items-center space-x-2">
                            <Icon
                              name="cake"
                              className="h-4 w-4 text-gray-500"
                            />
                            <span class="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Nacimiento:</strong>{" "}
                              {new Date(patient.dateOfBirth).toLocaleDateString(
                                "es-ES",
                              )}
                            </span>
                          </div>
                        )}
                        {patient.emergencyContact && (
                          <div class="flex items-center space-x-2">
                            <Icon
                              name="heart"
                              className="h-4 w-4 text-gray-500"
                            />
                            <span class="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Contacto emergencia:</strong>{" "}
                              {patient.emergencyContact.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Advertencia adicional */}
                    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                      <div class="flex items-start space-x-3">
                        <Icon
                          name="file-warning"
                          className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5"
                        />
                        <div class="text-sm">
                          <h4 class="font-medium text-red-800 dark:text-red-200 mb-1">
                            Consecuencias de la eliminación:
                          </h4>
                          <ul class="text-red-700 dark:text-red-300 space-y-1">
                            <li>
                              • Se perderá toda la información del paciente
                            </li>
                            <li>• Se perderá el historial médico y notas</li>
                            <li>
                              • Se perderá la información de contacto de
                              emergencia
                            </li>
                            <li>
                              • Las citas asociadas pueden verse afectadas
                            </li>
                            <li>• Esta acción es irreversible</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div class="flex items-center justify-center space-x-4">
                      <a
                        href="/patients"
                        class="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <Icon name="x" className="h-4 w-4 mr-2" />
                        Cancelar
                      </a>
                      <form method="POST" class="inline">
                        <Button
                          type="submit"
                          variant="danger"
                          class="inline-flex items-center px-6 py-3"
                        >
                          <Icon name="trash-2" className="h-4 w-4 mr-2" />
                          Sí, eliminar paciente
                        </Button>
                      </form>
                    </div>
                  </>
                )}

                {/* Si no hay paciente y no hay error, mostrar mensaje genérico */}
                {!patient && !error && (
                  <div class="text-center py-8">
                    <Icon
                      name="user-x"
                      size={48}
                      className="mx-auto text-gray-400 mb-4"
                    />
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Paciente no encontrado
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">
                      El paciente que intentas eliminar no existe o ya ha sido
                      eliminado.
                    </p>
                    <a
                      href="/patients"
                      class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <Icon name="arrow-left" className="h-4 w-4 mr-2" />
                      Volver a Pacientes
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
