import { useState } from "preact/hooks";
import { Button } from "../components/ui/Button.tsx";
import { Icon } from "../components/ui/Icon.tsx";
import { useDebouncedCallback } from "../lib/hooks/useDebounce.ts";

// Tipos para las opciones de filtros
interface FilterOption {
  value: string;
  label: string;
  emoji?: string;
}

interface FilterField {
  key: string;
  label: string;
  icon: string;
  type: "search" | "select";
  placeholder?: string;
  options?: FilterOption[];
}

interface GenericFiltersProps {
  title?: string;
  basePath: string; // Ruta base para construir URLs (ej: "/patients", "/rooms")
  filters: Record<string, string | undefined>;
  fields: FilterField[];
  showActiveIndicator?: boolean;
}

export default function GenericFilters({
  title = "Filtros de Búsqueda",
  basePath,
  filters,
  fields,
  showActiveIndicator = true,
}: GenericFiltersProps) {
  // Estado local para campos de búsqueda (para actualización en tiempo real)
  const [searchValues, setSearchValues] = useState<Record<string, string>>(
    () => {
      const initial: Record<string, string> = {};
      fields.forEach((field) => {
        if (field.type === "search") {
          initial[field.key] = filters[field.key] || "";
        }
      });
      return initial;
    },
  );

  const buildUrl = (params: Record<string, string | number | undefined>) => {
    const url = new URL(
      basePath,
      globalThis.location?.origin || "http://localhost:8000",
    );
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, value.toString());
      }
    });
    return url.pathname + url.search;
  };

  // Función debounced para navegación
  const debouncedNavigate = useDebouncedCallback((url: string) => {
    globalThis.location.href = url;
  }, 500);

  const handleSearchInput = (fieldKey: string, value: string) => {
    setSearchValues((prev) => ({ ...prev, [fieldKey]: value }));

    // Solo navegar si hay valor o si se está limpiando
    const url = buildUrl({
      ...filters,
      [fieldKey]: value || undefined,
      page: 1,
    });

    // Usar debounce para navegación
    debouncedNavigate(url);
  };

  const handleSelectChange = (fieldKey: string, value: string) => {
    const url = buildUrl({
      ...filters,
      [fieldKey]: value || undefined,
      page: 1,
    });
    globalThis.location.href = url;
  };

  const clearSearch = (fieldKey: string) => {
    setSearchValues((prev) => ({ ...prev, [fieldKey]: "" }));
    const url = buildUrl({
      ...filters,
      [fieldKey]: undefined,
      page: 1,
    });
    // Navegación inmediata para limpiar filtros
    globalThis.location.href = url;
  };

  const clearAllFilters = () => {
    globalThis.location.href = basePath;
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = Object.values(filters).some((value) => value);
  const activeFilterNames = fields
    .filter((field) => filters[field.key])
    .map((field) => field.label);

  return (
    <div class="mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-2">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>
          {showActiveIndicator && hasActiveFilters && (
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Filtros activos
            </span>
          )}
        </div>

        <div
          class={`grid grid-cols-1 ${
            fields.length === 1
              ? "md:grid-cols-1"
              : fields.length === 2
              ? "md:grid-cols-2"
              : fields.length === 3
              ? "md:grid-cols-3"
              : "md:grid-cols-4"
          } gap-4`}
        >
          {fields.map((field) => (
            <div key={field.key} class="space-y-2">
              <label class="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Icon name={field.icon} className="h-4 w-4 text-gray-500" />
                <span>{field.label}</span>
              </label>

              {field.type === "search"
                ? (
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Icon
                        name={field.icon}
                        className="h-4 w-4 text-gray-400"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder={field.placeholder ||
                        `Buscar ${field.label.toLowerCase()}...`}
                      value={searchValues[field.key] || ""}
                      onInput={(e) => {
                        const value = (e.target as HTMLInputElement).value;
                        handleSearchInput(field.key, value);
                      }}
                      class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                    {searchValues[field.key] && (
                      <button
                        type="button"
                        onClick={() => clearSearch(field.key)}
                        class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-500"
                        title="Limpiar búsqueda"
                      >
                        <Icon name="x" className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )
                : (
                  <select
                    value={filters[field.key] || ""}
                    onChange={(e) => {
                      const value = (e.target as HTMLSelectElement).value;
                      handleSelectChange(field.key, value);
                    }}
                    title={`Filtrar por ${field.label.toLowerCase()}`}
                    aria-label={`Filtrar por ${field.label.toLowerCase()}`}
                    class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value="">
                      Todos los {field.label.toLowerCase()}s
                    </option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.emoji ? `${option.emoji} ` : ""}
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
            </div>
          ))}
        </div>

        {/* Limpiar filtros */}
        {hasActiveFilters && (
          <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Icon name="check" className="h-4 w-4 text-green-500" />
                <span>Filtros aplicados: {activeFilterNames.join(", ")}</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={clearAllFilters}
                class="inline-flex items-center gap-1"
              >
                <Icon name="x" className="h-3 w-3" />
                Limpiar Filtros
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
