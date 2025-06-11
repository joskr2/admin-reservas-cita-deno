import { useState } from "preact/hooks";
import { type UserRole } from "../types/index.ts";
import { Button } from "../components/ui/Button.tsx";
import { Input } from "../components/ui/Input.tsx";
import { Select } from "../components/ui/Select.tsx";
import { Icon } from "../components/ui/Icon.tsx";

interface ProfileFiltersProps {
  currentUser: {
    email: string;
    role: UserRole;
    name?: string;
  };
  filters: {
    search?: string;
    role?: UserRole;
    status?: string;
  };
}

function ProfileFilters({ currentUser, filters }: ProfileFiltersProps) {
  const [search, setSearch] = useState(filters.search || "");

  const buildFilterUrl = (newFilters: Partial<typeof filters>) => {
    const params = new URLSearchParams();

    const finalFilters = { ...filters, ...newFilters };

    if (finalFilters.search) {
      params.set("search", finalFilters.search);
    }
    if (finalFilters.role) {
      params.set("role", finalFilters.role);
    }
    if (finalFilters.status) {
      params.set("status", finalFilters.status);
    }

    return `/profiles?${params.toString()}`;
  };

  const handleRoleChange = (e: Event) => {
    const value = (e.target as HTMLSelectElement).value;
    globalThis.location.href = buildFilterUrl({
      role: (value as UserRole) || undefined,
    });
  };

  const handleStatusChange = (e: Event) => {
    const value = (e.target as HTMLSelectElement).value;
    globalThis.location.href = buildFilterUrl({
      status: value || undefined,
    });
  };

  const handleSearchSubmit = (e: Event) => {
    e.preventDefault();
    globalThis.location.href = buildFilterUrl({
      search: search || undefined,
    });
  };

  const clearSearch = () => {
    setSearch("");
    globalThis.location.href = buildFilterUrl({
      search: undefined,
    });
  };

  return (
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-2">
          <Icon
            name="users"
            size={20}
            className="text-blue-600 dark:text-blue-400"
          />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Filtros de Búsqueda
          </h3>
        </div>
        {(filters.search || filters.role || filters.status) && (
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Filtros activos
          </span>
        )}
      </div>

      <div
        class={`grid grid-cols-1 ${
          currentUser.role === "superadmin"
            ? "md:grid-cols-3"
            : "md:grid-cols-2"
        } gap-6`}
      >
        {/* Búsqueda general */}
        <div class="space-y-2">
          <label class="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Icon name="user" size={16} className="text-gray-500" />
            <span>
              Buscar{" "}
              {currentUser.role === "psychologist" ? "Psicólogo" : "Usuario"}
            </span>
          </label>
          <form class="relative" onSubmit={handleSearchSubmit}>
            <div class="relative">
              <Input
                type="text"
                placeholder="Nombre o email..."
                value={search}
                onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
                hasLeftIcon
                hasRightIcon
                class="w-full pl-10 pr-20 py-3 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200 bg-gray-50 dark:bg-gray-700 hover:bg-white dark:hover:bg-gray-600"
              />
              <Icon
                name="user"
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <div class="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                {search && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    class="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Limpiar búsqueda"
                  >
                    <Icon name="x" size={14} />
                  </button>
                )}
                <button
                  type="submit"
                  class="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-sm hover:shadow-md"
                  title="Buscar"
                >
                  <Icon name="eye" size={14} />
                </button>
              </div>
            </div>
          </form>
          <p class="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
            <Icon name="user" size={12} />
            <span>Busca por nombre completo o email</span>
          </p>
        </div>

        {/* Filtro por rol - solo para superadmin */}
        {currentUser.role === "superadmin" && (
          <div class="space-y-2">
            <label class="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Icon name="shield" size={16} className="text-gray-500" />
              <span>Rol de Usuario</span>
            </label>
            <Select
              value={filters.role || ""}
              onChange={handleRoleChange}
              class="w-full"
            >
              <option value="">Todos los roles</option>
              <option value="psychologist">👨‍⚕️ Psicólogos</option>
              <option value="superadmin">👑 Administradores</option>
            </Select>
          </div>
        )}

        {/* Filtro por estado */}
        <div class="space-y-2">
          <label class="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Icon name="activity" size={16} className="text-gray-500" />
            <span>Estado del Usuario</span>
          </label>
          <Select
            value={filters.status || ""}
            onChange={handleStatusChange}
            class="w-full"
          >
            <option value="">Todos los estados</option>
            <option value="active">✅ Usuarios Activos</option>
            <option value="inactive">❌ Usuarios Inactivos</option>
          </Select>
        </div>
      </div>

      {/* Limpiar filtros */}
      {(filters.search || filters.role || filters.status) && (
        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Icon name="check" size={16} className="text-green-500" />
              <span>
                {[
                  filters.search && "Búsqueda",
                  filters.role && "Rol",
                  filters.status && "Estado",
                ]
                  .filter(Boolean)
                  .join(", ")}{" "}
                filtrado
                {[filters.search, filters.role, filters.status].filter(Boolean)
                  .length > 1
                  ? "s"
                  : ""}
              </span>
            </div>
            <Button
              href="/profiles"
              variant="outline"
              size="sm"
              class="flex items-center space-x-2"
            >
              <Icon name="x" size={14} />
              <span>Limpiar todos los filtros</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileFilters;
