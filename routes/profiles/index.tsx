import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { getAllUsers, getUsersByRole } from "../../lib/kv.ts";

import { Icon } from "../../components/ui/Icon.tsx";
import { Badge } from "../../components/ui/Badge.tsx";
import type { UserProfile, UserRole, AppState } from "../../types/index.ts";
import ProfilesFilters from "../../islands/ProfilesFilters.tsx";

interface ProfilesPageData {
  profiles: UserProfile[];
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
    name?: string;
  };
}

export const handler: Handlers<ProfilesPageData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const search = url.searchParams.get("search") || "";
    const role = (url.searchParams.get("role") as UserRole) || "";
    const status = url.searchParams.get("status") || "";

    // Obtener usuario actual del estado
    const state = ctx.state as unknown as AppState;
    const currentUser = state.user;

    if (!currentUser) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      let allProfiles: UserProfile[] = [];

      // Los psicólogos solo pueden ver otros psicólogos
      if (currentUser.role === "psychologist") {
        allProfiles = await getUsersByRole("psychologist");
        // Filtrar para no mostrar al usuario actual
        allProfiles = allProfiles.filter(
          (profile) => profile.email !== currentUser.email
        );
      } else {
        // Superadmin puede ver todos
        if (role) {
          allProfiles = await getUsersByRole(role);
        } else {
          allProfiles = await getAllUsers();
        }
      }

      // Aplicar filtros
      if (search) {
        const searchLower = search.toLowerCase();
        allProfiles = allProfiles.filter(
          (profile) =>
            profile.name?.toLowerCase().includes(searchLower) ||
            profile.email.toLowerCase().includes(searchLower)
        );
      }

      if (status) {
        allProfiles = allProfiles.filter((profile) => {
          if (status === "active") return profile.isActive !== false;
          if (status === "inactive") return profile.isActive === false;
          return true;
        });
      }

      const totalCount = allProfiles.length;
      const totalPages = Math.ceil(totalCount / limit);
      const startIndex = (page - 1) * limit;
      const profiles = allProfiles.slice(startIndex, startIndex + limit);

      return ctx.render({
        profiles,
        totalCount,
        currentPage: page,
        totalPages,
        filters: { search, role, status },
        currentUser,
      });
    } catch (error) {
      console.error("Error loading profiles:", error);
      return ctx.render({
        profiles: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 1,
        filters: {},
        currentUser,
      });
    }
  },
};

export default function ProfilesPage({ data }: PageProps<ProfilesPageData>) {
  const {
    profiles,
    totalCount,
    currentPage,
    totalPages,
    filters,
    currentUser,
  } = data;

  const buildUrl = (params: Record<string, string | number | undefined>) => {
    const url = new URL(
      "/profiles",
      globalThis.location?.origin || "http://localhost:8000"
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

  const getRoleText = (role: UserRole) => {
    return role === "superadmin" ? "Administrador" : "Psicólogo";
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    return role === "superadmin" ? "warning" : "default";
  };

  const getPageTitle = () => {
    if (currentUser.role === "psychologist") {
      return "Directorio de Psicólogos";
    }
    return "Gestión de Usuarios";
  };

  const getPageDescription = () => {
    if (currentUser.role === "psychologist") {
      return "Consulta el directorio de psicólogos de la clínica";
    }
    return "Administra y supervisa todos los usuarios del sistema";
  };

  return (
    <>
      <Head>
        <title>{getPageTitle()} - Horizonte Clínica</title>
        <meta name="description" content={getPageDescription()} />
      </Head>

      {/* Usar el mismo container que header/footer */}
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header de la página */}
          <div class="mb-8">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <Icon name="users" className="h-8 w-8 text-blue-600" />
                  {getPageTitle()}
                </h1>
                <p class="mt-2 text-gray-600 dark:text-gray-400">
                  {getPageDescription()}
                </p>
              </div>
              {currentUser.role === "superadmin" && (
                <a
                  href="/profiles/new"
                  class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Icon
                    name="user-plus"
                    className="h-5 w-5 text-white filter brightness-0 invert"
                  />
                  Nuevo Usuario
                </a>
              )}
            </div>
          </div>

          {/* Filtros */}
          <ProfilesFilters currentUser={currentUser} filters={filters} />

          {/* Estadísticas rápidas */}
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total de{" "}
                    {currentUser.role === "psychologist"
                      ? "Psicólogos"
                      : "Usuarios"}
                  </p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalCount}
                  </p>
                </div>
                <div class="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Icon
                    name="users"
                    className="h-6 w-6 text-blue-600 dark:text-blue-400"
                  />
                </div>
              </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Mostrando
                  </p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    {profiles.length}
                  </p>
                </div>
                <div class="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Icon
                    name="eye"
                    className="h-6 w-6 text-green-600 dark:text-green-400"
                  />
                </div>
              </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Activos
                  </p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    {profiles.filter((p) => p.isActive !== false).length}
                  </p>
                </div>
                <div class="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Icon
                    name="check"
                    className="h-6 w-6 text-green-600 dark:text-green-400"
                  />
                </div>
              </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Página Actual
                  </p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentPage}
                  </p>
                </div>
                <div class="h-12 w-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Icon
                    name="file-digit"
                    className="h-6 w-6 text-purple-600 dark:text-purple-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          {profiles.length === 0 ? (
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Icon
                name="users"
                className="h-16 w-16 text-gray-400 mx-auto mb-4"
              />
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No se encontraron{" "}
                {currentUser.role === "psychologist"
                  ? "psicólogos"
                  : "usuarios"}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-6">
                {totalCount === 0
                  ? `Aún no hay ${
                      currentUser.role === "psychologist"
                        ? "otros psicólogos"
                        : "usuarios"
                    } registrados en el sistema.`
                  : `No hay ${
                      currentUser.role === "psychologist"
                        ? "psicólogos"
                        : "usuarios"
                    } que coincidan con los filtros aplicados.`}
              </p>
              {currentUser.role === "superadmin" && (
                <a
                  href="/profiles/new"
                  class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Icon
                    name="user-plus"
                    className="h-5 w-5 text-white filter brightness-0 invert"
                  />
                  Crear Primer Usuario
                </a>
              )}
            </div>
          ) : (
            <>
              {/* Tabla para desktop */}
              <div class="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                      <tr>
                        <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {currentUser.role === "psychologist"
                            ? "Psicólogo"
                            : "Usuario"}
                        </th>
                        {currentUser.role === "superadmin" && (
                          <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Rol
                          </th>
                        )}
                        <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Estado
                        </th>
                        <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Fecha de Creación
                        </th>
                        {currentUser.role === "superadmin" && (
                          <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Acciones
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {profiles.map((profile, index) => (
                        <tr
                          key={profile.email}
                          class={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            index % 2 === 0
                              ? "bg-white dark:bg-gray-800"
                              : "bg-gray-50/50 dark:bg-gray-700/50"
                          }`}
                        >
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center space-x-3">
                              <div class="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                {(profile.name || profile.email)
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <div class="text-sm font-medium text-gray-900 dark:text-white">
                                  {profile.name || profile.email}
                                </div>
                                {profile.name && (
                                  <div class="text-xs text-gray-500 dark:text-gray-400">
                                    {profile.email}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          {currentUser.role === "superadmin" && (
                            <td class="px-6 py-4 whitespace-nowrap">
                              <Badge
                                variant={getRoleBadgeVariant(profile.role)}
                                size="sm"
                              >
                                {getRoleText(profile.role)}
                              </Badge>
                            </td>
                          )}
                          <td class="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={
                                profile.isActive !== false ? "success" : "error"
                              }
                              size="sm"
                            >
                              {profile.isActive !== false
                                ? "Activo"
                                : "Inactivo"}
                            </Badge>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(profile.createdAt).toLocaleDateString(
                              "es-ES"
                            )}
                          </td>
                          {currentUser.role === "superadmin" && (
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <a
                                href={`/profiles/edit/${encodeURIComponent(
                                  profile.email
                                )}`}
                                class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <Icon name="edit" className="h-3 w-3" />
                                Editar
                              </a>
                              <a
                                href={`/profiles/delete/${encodeURIComponent(
                                  profile.email
                                )}`}
                                class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                <Icon name="trash-2" className="h-3 w-3" />
                                Eliminar
                              </a>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cards para mobile/tablet */}
              <div class="lg:hidden space-y-4">
                {profiles.map((profile) => (
                  <div
                    key={profile.email}
                    class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <div class="flex items-start justify-between mb-4">
                      <div class="flex items-center space-x-3">
                        <div class="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                          {(profile.name || profile.email)
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                            {profile.name || profile.email}
                          </h3>
                          {profile.name && (
                            <p class="text-sm text-gray-500 dark:text-gray-400">
                              {profile.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div class="flex flex-col gap-2">
                        {currentUser.role === "superadmin" && (
                          <Badge
                            variant={getRoleBadgeVariant(profile.role)}
                            size="sm"
                          >
                            {getRoleText(profile.role)}
                          </Badge>
                        )}
                        <Badge
                          variant={
                            profile.isActive !== false ? "success" : "error"
                          }
                          size="sm"
                        >
                          {profile.isActive !== false ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </div>

                    <div class="mb-4">
                      <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Fecha de Creación
                      </p>
                      <p class="text-sm text-gray-900 dark:text-white mt-1">
                        {new Date(profile.createdAt).toLocaleDateString(
                          "es-ES"
                        )}
                      </p>
                    </div>

                    {currentUser.role === "superadmin" && (
                      <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <a
                          href={`/profiles/edit/${encodeURIComponent(
                            profile.email
                          )}`}
                          class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Icon name="edit" className="h-3 w-3" />
                          Editar
                        </a>
                        <a
                          href={`/profiles/delete/${encodeURIComponent(
                            profile.email
                          )}`}
                          class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <Icon name="trash-2" className="h-3 w-3" />
                          Eliminar
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div class="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-4">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        Mostrando {(currentPage - 1) * 10 + 1} -{" "}
                        {Math.min(currentPage * 10, totalCount)} de {totalCount}{" "}
                        {currentUser.role === "psychologist"
                          ? "psicólogos"
                          : "usuarios"}
                      </span>
                    </div>

                    <div class="flex items-center space-x-1">
                      {/* Botón anterior */}
                      <a
                        href={
                          currentPage > 1
                            ? buildUrl({ ...filters, page: currentPage - 1 })
                            : "#"
                        }
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
                          {page === "..." ? (
                            <span class="px-3 py-2 text-gray-400 dark:text-gray-600">
                              ...
                            </span>
                          ) : (
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
                        href={
                          currentPage < totalPages
                            ? buildUrl({ ...filters, page: currentPage + 1 })
                            : "#"
                        }
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
            </>
          )}
        </div>
      </div>
    </>
  );
}
