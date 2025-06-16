import { useEffect, useState } from "preact/hooks";
import { Icon } from "../components/ui/Icon.tsx";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
  onClose?: () => void;
}

export default function Toast({
  message,
  type = "info",
  duration = 10000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const typeStyles = {
    success: "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
    error: "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
    warning: "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800",
    info: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
  };

  const iconNames = {
    success: "check-circle",
    error: "x-circle",
    warning: "exclamation-triangle",
    info: "information-circle",
  };

  return (
    <div
      class={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 p-4 rounded-lg border shadow-lg transition-all duration-300 ${typeStyles[type]}`}
      role="alert"
    >
      <div class="flex items-start">
        <Icon 
          name={iconNames[type]} 
          size={20} 
          className="mt-0.5 mr-3 flex-shrink-0" 
        />
        <div class="flex-1 text-sm">
          {message}
        </div>
        <button
          title="Cerrar notificación"
          aria-label="Cerrar notificación"
          type="button"
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
          class="ml-3 flex-shrink-0 text-current opacity-70 hover:opacity-100 transition-opacity"
        >
          <Icon name="x" size={16} />
        </button>
      </div>
    </div>
  );
}
