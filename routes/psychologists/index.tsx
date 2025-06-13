import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { getUsersByRole } from "../../lib/kv.ts";
import { Icon } from "../../components/ui/Icon.tsx";
import { Badge } from "../../components/ui/Badge.tsx";
import type { AppState, UserProfile, UserRole } from "../../types/index.ts";
import PsychologistFilters from "../../islands/PsychologistFilters.tsx";

interface PsychologistsPageData {
  psychologists: UserProfile[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filters: {
    search?: string;
    role?: UserRole;
    status?: string;
  };
  currentUser: {
    email: string;
    role: UserRole;
    name?: string | undefined;
  };
}

export const handler: Handlers<PsychologistsPageData, AppState> = {
  async GET(req, ctx) {
    const user = ctx.state.user;
    if (!user) {
      return new Response("", {
        status: 302,
        headers: { Location: "/login" },
      });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const roleFilter = (url.searchParams.get("role") as UserRole) || "";
    const statusFilter = url.searchParams.get("status") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = 10;

    let psychologists: UserProfile[] = [];

    if (user.role === "psychologist") {
      // Los psicólogos solo pueden ver otros psicólogos (excluyendo su propio perfil)
      const allPsychologists = await getUsersByRole("psychologist");
      psychologists = allPsychologists.filter((p) => p.email !== user.email);
    } else if (user.role === "superadmin") {
      // Los superadmins pueden ver todos los psicólogos (no superadmins)
      psychologists = await getUsersByRole("psychologist");
    }

    // Aplicar filtros
    if (search) {
      psychologists = psychologists.filter(
        (p) =>
          p.name?.toLowerCase().includes(search.toLowerCase()) ||
          p.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (roleFilter) {
      psychologists = psychologists.filter((p) => p.role === roleFilter);
    }

    if (statusFilter) {
      const isActive = statusFilter === "active";
      psychologists = psychologists.filter((p) => p.isActive === isActive);
    }

    // Paginación
    const totalCount = psychologists.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const paginatedPsychologists = psychologists.slice(
      startIndex,
      startIndex + limit
    );

    return ctx.render({
      psychologists: paginatedPsychologists,
      totalCount,
      currentPage: page,
      totalPages,
      filters: { search, role: roleFilter, status: statusFilter },
      currentUser: {
        email: user.email,
        role: user.role,
        name: user.name || undefined,
      },
    });
  },
};

export default function PsychologistsPage({
  data,
}: PageProps<PsychologistsPageData>) {
  const { psychologists, currentPage, totalPages, filters, currentUser } = data;

  // Título dinámico basado en el rol del usuario
  const pageTitle = "Psicólogos";

  const pageDescription =
    currentUser.role === "psychologist"
      ? "Encuentra y conecta con otros psicólogos de la clínica"
      : "Administra los psicólogos del sistema";

  return (
    <>
      <Head>
        <title>{pageTitle} - Horizonte Clínica</title>
        <meta name="description" content={pageDescription} />
      </Head>

      <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div class="mb-8">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <Icon name="users" className="w-8 h-8 text-blue-600" />
                  {pageTitle}
                </h1>
                <p class="mt-2 text-gray-600 dark:text-gray-400">
                  {pageDescription}
                </p>
              </div>

              {/* Solo superadmins pueden crear nuevos psicólogos */}
              {currentUser.role === "superadmin" && (
                <a
                  href="/psychologists/new"
                  class="inline-flex items-center justify-center font-medium rounded-lg px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 ease-in-out"
                >
                  Nuevo Psicólogo
                </a>
              )}
            </div>
          </div>

          {/* Filtros */}
          <div class="mb-6">
            <PsychologistFilters currentUser={currentUser} filters={filters} />
          </div>

          {/* Lista de psicólogos */}
          {psychologists.length === 0 ? (
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <Icon
                name="users"
                className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4"
              />
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No se encontraron psicólogos
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-6">
                {filters.search || filters.role || filters.status
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "Aún no hay psicólogos registrados en el sistema"}
              </p>
              {currentUser.role === "superadmin" &&
                !filters.search &&
                !filters.role &&
                !filters.status && (
                  <a
                    href="/psychologists/new"
                    class="inline-flex items-center justify-center font-medium rounded-lg px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 ease-in-out"
                  >
                    Agregar Primer Psicólogo
                  </a>
                )}
            </div>
          ) : (
            <div class="space-y-4">
              {/* Vista de escritorio */}
              <div class="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Psicólogo
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Rol
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Estado
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Registro
                      </th>
                      {currentUser.role === "superadmin" && (
                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Acciones
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {psychologists.map((psychologist) => (
                      <tr
                        key={psychologist.email}
                        class="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="flex items-center">
                            <div class="flex-shrink-0 h-10 w-10">
                              <div class="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <span class="text-sm font-medium text-blue-600 dark:text-blue-300">
                                  {psychologist.name?.charAt(0).toUpperCase() ||
                                    psychologist.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div class="ml-4">
                              <div class="text-sm font-medium text-gray-900 dark:text-white">
                                {psychologist.name || "Sin nombre"}
                              </div>
                              <div class="text-sm text-gray-500 dark:text-gray-400">
                                {psychologist.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={
                              psychologist.role === "superadmin"
                                ? "warning"
                                : "default"
                            }
                          >
                            {psychologist.role === "superadmin"
                              ? "Super Admin"
                              : "Psicólogo"}
                          </Badge>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={
                              psychologist.isActive ? "success" : "error"
                            }
                          >
                            {psychologist.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(psychologist.createdAt).toLocaleDateString(
                            "es-ES"
                          )}
                        </td>
                        {currentUser.role === "superadmin" && (
                          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div class="flex items-center justify-end gap-2">
                              <a
                                href={`/psychologists/edit/${psychologist.id}`}
                                class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded"
                                title="Editar psicólogo"
                              >
                                <Icon name="edit" className="w-4 h-4" />
                              </a>
                              <a
                                href={`/psychologists/delete/${psychologist.id}`}
                                class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"
                                title="Eliminar psicólogo"
                              >
                                <Icon name="trash-2" className="w-4 h-4" />
                              </a>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista móvil */}
              <div class="md:hidden space-y-4">
                {psychologists.map((psychologist) => (
                  <div
                    key={psychologist.email}
                    class="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
                  >
                    <div class="flex items-start justify-between">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-12 w-12">
                          <div class="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <span class="text-lg font-medium text-blue-600 dark:text-blue-300">
                              {psychologist.name?.charAt(0).toUpperCase() ||
                                psychologist.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div class="ml-3">
                          <div class="text-sm font-medium text-gray-900 dark:text-white">
                            {psychologist.name || "Sin nombre"}
                          </div>
                          <div class="text-sm text-gray-500 dark:text-gray-400">
                            {psychologist.email}
                          </div>
                          <div class="flex items-center gap-2 mt-1">
                            <Badge
                              variant={
                                psychologist.role === "superadmin"
                                  ? "warning"
                                  : "default"
                              }
                              size="sm"
                            >
                              {psychologist.role === "superadmin"
                                ? "Super Admin"
                                : "Psicólogo"}
                            </Badge>
                            <Badge
                              variant={
                                psychologist.isActive ? "success" : "error"
                              }
                              size="sm"
                            >
                              {psychologist.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {currentUser.role === "superadmin" && (
                        <div class="flex items-center gap-2">
                          <a
                            href={`/psychologists/edit/${psychologist.id}`}
                            class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded"
                            title="Editar psicólogo"
                          >
                            <Icon name="edit" className="w-4 h-4" />
                          </a>
                          <a
                            href={`/psychologists/delete/${psychologist.id}`}
                            class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2 rounded"
                            title="Eliminar psicólogo"
                          >
                            <Icon name="trash-2" className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                    </div>

                    <div class="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      Registrado el{" "}
                      {new Date(psychologist.createdAt).toLocaleDateString(
                        "es-ES"
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div class="mt-8 flex items-center justify-between">
              <div class="flex items-center gap-2">
                {currentPage > 1 && (
                  <a
                    href={`/psychologists?${new URLSearchParams({
                      ...filters,
                      page: (currentPage - 1).toString(),
                    }).toString()}`}
                    class="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    Anterior
                  </a>
                )}

                <span class="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                  Página {currentPage} de {totalPages}
                </span>

                {currentPage < totalPages && (
                  <a
                    href={`/psychologists?${new URLSearchParams({
                      ...filters,
                      page: (currentPage + 1).toString(),
                    }).toString()}`}
                    class="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    Siguiente
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
