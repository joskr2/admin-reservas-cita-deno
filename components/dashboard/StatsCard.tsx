import { Icon } from "../ui/Icon.tsx";
import type { StatsCardProps } from "../../types/index.ts";

export default function StatsCard({
  title,
  value,
  icon,
  colorClass = "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200",
}: StatsCardProps) {
  return (
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center space-x-6 hover:shadow-lg transition-shadow duration-200">
      <div
        class={`flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-full ${colorClass}`}
      >
        <Icon name={icon} size={24} className="text-current" />
      </div>
      <div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
          {title}
        </p>
        <p class="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}
