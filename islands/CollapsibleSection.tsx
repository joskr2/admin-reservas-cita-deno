import { useState } from "preact/hooks";
import { Icon } from "../components/ui/Icon.tsx";

interface CollapsibleSectionProps {
  title: string;
  icon?: string;
  iconColor?: string;
  defaultCollapsed?: boolean;
  children: preact.ComponentChildren;
}

export default function CollapsibleSection({
  title,
  icon = "chevron-down",
  iconColor = "text-gray-500",
  defaultCollapsed = false,
  children,
}: CollapsibleSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <button
        title={`${isCollapsed ? "Expandir" : "Contraer"} sección`}
        aria-label="Contraer sección"
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        class="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-t-lg"
        aria-expanded="true"
        aria-controls="collapsible-content"
      >
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          {icon && <Icon name={icon} className={`h-5 w-5 ${iconColor} mr-2`} />}
          {title}
        </h2>
        <Icon
          name="chevron-down"
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
            isCollapsed ? "-rotate-90" : "rotate-0"
          }`}
        />
      </button>

      <div
        id="collapsible-content"
        class={`overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? "max-h-0" : "max-h-[4000px]"
        }`}
      >
        <div class="px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}
