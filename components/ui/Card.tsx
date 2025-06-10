import type { ComponentChildren, JSX } from "preact";

interface CardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children: ComponentChildren;
  padding?: boolean;
}

export function Card({
  children,
  padding = true,
  class: className,
  ...props
}: CardProps) {
  const baseClasses = "bg-white dark:bg-gray-800 rounded-lg shadow-md";
  const paddingClasses = padding ? "p-6" : "";

  const finalClasses = [baseClasses, paddingClasses, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div {...props} class={finalClasses}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ComponentChildren;
  class?: string;
}

export function CardHeader({ children, class: className }: CardHeaderProps) {
  return (
    <div
      class={`border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 ${
        className || ""
      }`}
    >
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: ComponentChildren;
  class?: string;
}

export function CardTitle({ children, class: className }: CardTitleProps) {
  return (
    <h3
      class={`text-lg font-semibold text-gray-900 dark:text-white ${
        className || ""
      }`}
    >
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: ComponentChildren;
  class?: string;
}

export function CardContent({ children, class: className }: CardContentProps) {
  return <div class={className}>{children}</div>;
}
