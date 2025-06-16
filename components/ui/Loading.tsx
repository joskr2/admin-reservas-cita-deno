interface LoadingProps {
  size?: "sm" | "md" | "lg" | "xl" | undefined;
  variant?: "spinner" | "dots" | "pulse" | "skeleton" | undefined;
  text?: string | undefined;
  className?: string | undefined;
  fullScreen?: boolean | undefined;
}

export function Loading({
  size = "md",
  variant = "spinner",
  text,
  className = "",
  fullScreen = false,
}: LoadingProps) {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "w-4 h-4";
      case "lg":
        return "w-8 h-8";
      case "xl":
        return "w-12 h-12";
      default:
        return "w-6 h-6";
    }
  };

  const getTextSizeClasses = () => {
    switch (size) {
      case "sm":
        return "text-sm";
      case "lg":
        return "text-lg";
      case "xl":
        return "text-xl";
      default:
        return "text-base";
    }
  };

  const renderSpinner = () => (
    <svg
      class={`animate-spin ${getSizeClasses()} text-blue-600 dark:text-blue-400`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const renderDots = () => (
    <div class="flex space-x-1">
      <div
        class={`${getSizeClasses()} bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce`}
      />
      <div
        class={`${getSizeClasses()} bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce [animation-delay:0.1s]`}
      />
      <div
        class={`${getSizeClasses()} bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]`}
      />
    </div>
  );

  const renderPulse = () => (
    <div
      class={`${getSizeClasses()} bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse`}
    />
  );

  const renderSkeleton = () => (
    <div class="animate-pulse space-y-2">
      <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
      <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
      <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6" />
    </div>
  );

  const renderLoadingContent = () => {
    switch (variant) {
      case "dots":
        return renderDots();
      case "pulse":
        return renderPulse();
      case "skeleton":
        return renderSkeleton();
      default:
        return renderSpinner();
    }
  };

  const content = (
    <div
      class={`flex flex-col items-center justify-center space-y-2 ${className}`}
    >
      {renderLoadingContent()}
      {text && (
        <p class={`text-gray-600 dark:text-gray-400 ${getTextSizeClasses()}`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div class="fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
}

// Componente específico para loading de página completa
export function PageLoading({ text = "Cargando..." }: { text?: string }) {
  return <Loading variant="spinner" size="lg" text={text} fullScreen />;
}

// Componente específico para loading inline
export function InlineLoading({ text }: { text?: string }) {
  return <Loading variant="spinner" size="sm" text={text} />;
}

// Componente específico para skeleton loading
export function SkeletonLoading({ className }: { className?: string }) {
  return <Loading variant="skeleton" className={className} />;
}
