import { type FreshContext, type PageProps } from "$fresh/server.ts";
import { type AppState, type PatientProfile } from "../../types/index.ts";
import { getPatientRepository } from "../../lib/database/index.ts";
import { Icon } from "../../components/ui/Icon.tsx";
import GenericFilters from "../../islands/GenericFilters.tsx";

interface PatientsPageData {
  patients: PatientProfile[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filters: {
    search?: string;
    status?: string;
  };
}

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "10");
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "";

  try {
    const patientRepository = getPatientRepository();
    let allPatients = await patientRepository.getAllPatientsAsProfiles();

    // Aplicar filtros
    if (search) {
      const searchLower = search.toLowerCase();
      allPatients = allPatients.filter(
        (patient) =>
          patient.name.toLowerCase().includes(searchLower) ||
          patient.id.toLowerCase().includes(searchLower) ||
          (patient.email &&
            patient.email.toLowerCase().includes(searchLower)) ||
          (patient.phone && patient.phone.includes(search)),
      );
    }

    if (status) {
      const isActive = status === "active";
      allPatients = allPatients.filter(
        (patient) => patient.isActive === isActive,
      );
    }

    const totalCount = allPatients.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const patients = allPatients.slice(startIndex, startIndex + limit);

    return ctx.render({
      patients,
      totalCount,
      currentPage: page,
      totalPages,
      filters: { search, status },
    });
  } catch (error) {
    console.error("Error loading patients:", error);
    return ctx.render({
      patients: [],
      totalCount: 0,
      currentPage: 1,
      totalPages: 1,
      filters: {},
    });
  }
}

export default function PatientsPage({
  data,
}: PageProps<PatientsPageData, AppState>) {
  const { patients, totalCount, currentPage, totalPages, filters } = data;

  const buildUrl = (params: Record<string, string | number | undefined>) => {
    const url = new URL(
      "/patients",
      globalThis.location?.origin || "http://localhost:8000",
    );
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, value.toString());
      }
    });
    return url.pathname + url.search;
  };

  const getPaginationPages = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Configuración de filtros para el componente genérico
  const filterFields = [
    {
      key: "search",
      label: "Buscar Paciente",
      icon: "user",
      type: "search" as const,
      placeholder: "Nombre, email, teléfono o ID...",
    },
    {
      key: "status",
      label: "Estado",
      icon: "activity",
      type: "select" as const,
      options: [
        { value: "active", label: "Activos", emoji: "✅" },
        { value: "inactive", label: "Inactivos", emoji: "❌" },
      ],
    },
  ];

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

          {/* Filtros */}
          <GenericFilters
            title="Filtros de Búsqueda"
            basePath="/patients"
            filters={filters}
            fields={filterFields}
          />

          {/* Estadísticas */}
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div class="flex items-center">
                <Icon name="users" size={24} className="text-blue-500 mr-3" />
                <div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Pacientes
                  </p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalCount}
                  </p>
                </div>
              </div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div class="flex items-center">
                <Icon name="eye" size={24} className="text-green-500 mr-3" />
                <div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Mostrando
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
                  name="file-digit"
                  size={24}
                  className="text-purple-500 mr-3"
                />
                <div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Página Actual
                  </p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentPage}
                  </p>
                </div>
              </div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div class="flex items-center">
                <Icon
                  name="file-digit"
                  size={24}
                  className="text-orange-500 mr-3"
                />
                <div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Páginas
                  </p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalPages}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de pacientes */}
          <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              {patients.length === 0
                ? (
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
                )
                : (
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
                          <tr
                            key={patient.id}
                            class="hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
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
                              <span
                                class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  patient.isActive
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                }`}
                              >
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

          {/* Paginación */}
          {totalPages > 1 && (
            <div class="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              {/* Información de resultados - Móvil */}
              <div class="sm:hidden text-center mb-4">
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  Página {currentPage} de {totalPages}
                </span>
                <div class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {totalCount} pacientes en total
                </div>
              </div>

              {/* Paginación móvil */}
              <div class="sm:hidden flex items-center justify-between">
                <a
                  href={currentPage > 1
                    ? buildUrl({ ...filters, page: currentPage - 1 })
                    : "#"}
                  class={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage > 1
                      ? "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                      : "text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <Icon name="arrow-left" size={16} className="mr-1" />
                  Anterior
                </a>

                <div class="flex items-center space-x-1">
                  {currentPage > 1 && (
                    <a
                      href={buildUrl({
                        ...filters,
                        page: currentPage - 1,
                      })}
                      class="px-2 py-1 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {currentPage - 1}
                    </a>
                  )}

                  <span class="px-3 py-1 rounded bg-blue-600 text-white text-sm font-medium">
                    {currentPage}
                  </span>

                  {currentPage < totalPages && (
                    <a
                      href={buildUrl({
                        ...filters,
                        page: currentPage + 1,
                      })}
                      class="px-2 py-1 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {currentPage + 1}
                    </a>
                  )}
                </div>

                <a
                  href={currentPage < totalPages
                    ? buildUrl({ ...filters, page: currentPage + 1 })
                    : "#"}
                  class={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage < totalPages
                      ? "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                      : "text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  Siguiente
                  <Icon
                    name="arrow-left"
                    size={16}
                    className="ml-1 rotate-180"
                  />
                </a>
              </div>

              {/* Paginación desktop */}
              <div class="hidden sm:flex items-center justify-between">
                <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    Mostrando {(currentPage - 1) * 10 + 1} -{" "}
                    {Math.min(currentPage * 10, totalCount)} de {totalCount}
                    {" "}
                    pacientes
                  </span>
                </div>

                <div class="flex items-center space-x-1">
                  {/* Botón anterior */}
                  <a
                    href={currentPage > 1
                      ? buildUrl({ ...filters, page: currentPage - 1 })
                      : "#"}
                    class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage > 1
                        ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    Anterior
                  </a>

                  {/* Números de página */}
                  {getPaginationPages().map((page, index) => (
                    <span key={index}>
                      {page === "..."
                        ? (
                          <span class="px-3 py-2 text-gray-400 dark:text-gray-600">
                            ...
                          </span>
                        )
                        : (
                          <a
                            href={buildUrl({ ...filters, page })}
                            class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === page
                                ? "bg-blue-600 text-white"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                          >
                            {page}
                          </a>
                        )}
                    </span>
                  ))}

                  {/* Botón siguiente */}
                  <a
                    href={currentPage < totalPages
                      ? buildUrl({ ...filters, page: currentPage + 1 })
                      : "#"}
                    class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage < totalPages
                        ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    Siguiente
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
