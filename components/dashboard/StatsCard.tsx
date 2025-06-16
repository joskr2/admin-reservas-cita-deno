import { Icon } from "../ui/Icon.tsx";
import type { StatsCardProps } from "../../types/index.ts";

export default function StatsCard({
  title,
  value,
  icon,
  colorClass = "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200",
}: StatsCardProps) {
  return (
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-200">
      <div class="flex items-center justify-between">
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400 line-clamp-2 leading-tight">
            {title}
          </p>
          <p class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
        <div class="flex-shrink-0 ml-4">
          <div
            class={`w-12 h-12 flex items-center justify-center rounded-lg ${colorClass}`}
          >
            <Icon name={icon} size={20} className="text-current" />
          </div>
        </div>
      </div>
    </div>
  );
}
