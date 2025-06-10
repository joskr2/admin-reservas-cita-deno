import type { ComponentChildren } from "preact";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ComponentChildren;
  // Example: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
  colorClass?: string;
}

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
        {/* The icon is passed as a child component */}
        {icon}
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
