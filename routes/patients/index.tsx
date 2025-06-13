import { type FreshContext, type PageProps } from "$fresh/server.ts";
import { type AppState, type PatientProfile } from "../../types/index.ts";
import { getPatientRepository } from "../../lib/database/index.ts";
import { Icon } from "../../components/ui/Icon.tsx";

export async function handler(_req: Request, ctx: FreshContext<AppState>) {
  try {
    const patientRepository = getPatientRepository();
    const patients = await patientRepository.getAllPatientsAsProfiles();

    return ctx.render({ patients });
  } catch (error) {
    console.error("Error loading patients:", error);
    return ctx.render({ patients: [] });
  }
}

export default function PatientsPage({
  data,
}: PageProps<{ patients: PatientProfile[] }, AppState>) {
  const { patients } = data;

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                Gestión de Pacientes
              </h1>
              <p class="mt-2 text-gray-600 dark:text-gray-400">
                Administra la información de los pacientes
              </p>
            </div>
            <div class="mt-4 sm:mt-0">
              <a
                href="/patients/new"
                class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <Icon name="user-plus" size={16} className="mr-2" />
                Nuevo Paciente
              </a>
            </div>
          </div>

          {/* Estadísticas */}
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div class="flex items-center">
                <Icon
                  name="users"
                  size={24}
                  className="text-blue-500 mr-3"
                />
                <div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Pacientes
                  </p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    {patients.length}
                  </p>
                </div>
              </div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div class="flex items-center">
                <Icon
                  name="check"
                  size={24}
                  className="text-green-500 mr-3"
                />
                <div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Pacientes Activos
                  </p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    {patients.filter(p => p.isActive).length}
                  </p>
                </div>
              </div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div class="flex items-center">
                <Icon
                  name="x"
                  size={24}
                  className="text-red-500 mr-3"
                />
                <div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Pacientes Inactivos
                  </p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    {patients.filter(p => !p.isActive).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de pacientes */}
          <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <div class="mb-4">
                <input
                  type="text"
                  placeholder="Buscar pacientes..."
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  id="patient-search"
                />
              </div>

              {patients.length === 0 ? (
                <div class="text-center py-12">
                  <Icon
                    name="users"
                    size={48}
                    className="mx-auto text-gray-400 mb-4"
                  />
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No hay pacientes registrados
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400 mb-6">
                    Comienza agregando el primer paciente al sistema.
                  </p>
                  <a
                    href="/patients/new"
                    class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <Icon name="user-plus" size={16} className="mr-2" />
                    Crear Primer Paciente
                  </a>
                </div>
              ) : (
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Paciente
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Contacto
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Estado
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Fecha de Registro
                        </th>
                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {patients.map((patient) => (
                        <tr key={patient.id} class="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                              <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {patient.name.charAt(0).toUpperCase()}
                              </div>
                              <div class="ml-4">
                                <div class="text-sm font-medium text-gray-900 dark:text-white">
                                  {patient.name}
                                </div>
                                <div class="text-sm text-gray-500 dark:text-gray-400">
                                  ID: {patient.id.slice(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900 dark:text-white">
                              {patient.email || "Sin email"}
                            </div>
                            <div class="text-sm text-gray-500 dark:text-gray-400">
                              {patient.phone || "Sin teléfono"}
                            </div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              patient.isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}>
                              {patient.isActive ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(patient.createdAt).toLocaleDateString()}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div class="flex items-center justify-end gap-2">
                              <a
                                href={`/patients/${patient.id}`}
                                class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Ver detalles"
                              >
                                <Icon name="eye" size={16} />
                              </a>
                              <a
                                href={`/patients/edit/${patient.id}`}
                                class="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                                title="Editar"
                              >
                                <Icon name="edit" size={16} />
                              </a>
                              <a
                                href={`/patients/delete/${patient.id}`}
                                class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                title="Eliminar"
                              >
                                <Icon name="trash-2" size={16} />
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
