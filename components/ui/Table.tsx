import type { ComponentChildren } from "preact";
import { Icon } from "./Icon.tsx";

// Tipos para las columnas de la tabla
export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  title: string;
  sortable?: boolean;
  render?: (value: unknown, row: T, index: number) => ComponentChildren;
  className?: string;
  width?: string;
}

// Props para el componente Table principal
interface TableProps<T = Record<string, unknown>> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (key: string, order: "asc" | "desc") => void;
  className?: string;
  responsive?: boolean;
}

export function Table<T = Record<string, unknown>>({
  data,
  columns,
  loading = false,
  emptyMessage = "No hay datos disponibles",
  sortBy,
  sortOrder,
  onSort,
  className = "",
  responsive = true,
}: TableProps<T>) {
  const handleSort = (columnKey: string) => {
    if (!onSort) return;

    const newOrder = sortBy === columnKey && sortOrder === "asc"
      ? "desc"
      : "asc";
    onSort(columnKey, newOrder);
  };

  const getSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey) {
      return (
        <Icon name="arrow-left" size={16} className="rotate-90 opacity-30" />
      );
    }

    return sortOrder === "asc"
      ? <Icon name="arrow-left" size={16} className="rotate-90" />
      : <Icon name="arrow-left" size={16} className="-rotate-90" />;
  };

  if (loading) {
    return (
      <div class="animate-pulse">
        <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} class="h-8 bg-gray-100 dark:bg-gray-800 rounded mb-2" />
        ))}
      </div>
    );
  }

  return (
    <div class={`overflow-hidden ${className}`}>
      <div class={responsive ? "overflow-x-auto" : ""}>
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <TableHeader
            columns={columns}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={onSort}
            getSortIcon={getSortIcon}
            handleSort={handleSort}
          />
          <TableBody
            data={data}
            columns={columns}
            emptyMessage={emptyMessage}
          />
        </table>
      </div>
    </div>
  );
}

// Componente para el header de la tabla
interface TableHeaderProps<T = Record<string, unknown>> {
  columns: TableColumn<T>[];
  sortBy?: string | undefined;
  sortOrder?: "asc" | "desc" | undefined;
  onSort?: ((key: string, order: "asc" | "desc") => void) | undefined;
  getSortIcon: (columnKey: string) => ComponentChildren;
  handleSort: (columnKey: string) => void;
}

function TableHeader<T = Record<string, unknown>>({
  columns,
  sortBy: _sortBy,
  sortOrder: _sortOrder,
  onSort,
  getSortIcon,
  handleSort,
}: TableHeaderProps<T>) {
  return (
    <thead class="bg-gray-50 dark:bg-gray-800">
      <tr>
        {columns.map((column) => (
          <th
            key={column.key}
            scope="col"
            class={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
              column.className || ""
            }`}
            {...(column.width ? { style: { width: column.width } } : {})}
          >
            {column.sortable && onSort
              ? (
                <button
                  type="button"
                  onClick={() => handleSort(column.key)}
                  class="group inline-flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  <span>{column.title}</span>
                  {getSortIcon(column.key)}
                </button>
              )
              : (
                column.title
              )}
          </th>
        ))}
      </tr>
    </thead>
  );
}

// Componente para el body de la tabla
interface TableBodyProps<T = Record<string, unknown>> {
  data: T[];
  columns: TableColumn<T>[];
  emptyMessage: string;
}

function TableBody<T = Record<string, unknown>>({
  data,
  columns,
  emptyMessage,
}: TableBodyProps<T>) {
  if (data.length === 0) {
    return (
      <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
        <tr>
          <td
            colSpan={columns.length}
            class="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
          >
            <div class="flex flex-col items-center space-y-2">
              <Icon name="circle" size={48} className="opacity-30" />
              <p>{emptyMessage}</p>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
      {data.map((row, rowIndex) => (
        <TableRow
          key={rowIndex}
          row={row}
          columns={columns}
          rowIndex={rowIndex}
        />
      ))}
    </tbody>
  );
}

// Componente para una fila de la tabla
interface TableRowProps<T = Record<string, unknown>> {
  row: T;
  columns: TableColumn<T>[];
  rowIndex: number;
}

function TableRow<T = Record<string, unknown>>({
  row,
  columns,
  rowIndex,
}: TableRowProps<T>) {
  return (
    <tr class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      {columns.map((column) => {
        const value = (row as Record<string, unknown>)[column.key];
        const content = column.render
          ? column.render(value, row, rowIndex)
          : (value as ComponentChildren);

        return (
          <td
            key={column.key}
            class={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 ${
              column.className || ""
            }`}
          >
            {content}
          </td>
        );
      })}
    </tr>
  );
}

// Componentes auxiliares para celdas comunes
export function TableCell({
  children,
  className = "",
}: {
  children: ComponentChildren;
  className?: string;
}) {
  return <div class={`flex items-center ${className}`}>{children}</div>;
}

export function TableActions({
  children,
  className = "",
}: {
  children: ComponentChildren;
  className?: string;
}) {
  return (
    <div class={`flex items-center space-x-2 ${className}`}>{children}</div>
  );
}

// Componente para mostrar estado/badge en tabla
export function TableBadge({
  children,
  variant = "default",
}: {
  children: ComponentChildren;
  variant?: "default" | "success" | "warning" | "error" | "info";
}) {
  const variantClasses = {
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    success:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    warning:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  };

  return (
    <span
      class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        variantClasses[variant]
      }`}
    >
      {children}
    </span>
  );
}
