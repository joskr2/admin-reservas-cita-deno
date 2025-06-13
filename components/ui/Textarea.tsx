import { JSX } from "preact";

interface TextareaProps extends JSX.HTMLAttributes<HTMLTextAreaElement> {
  variant?: "default" | "error";
  fullWidth?: boolean;
}

export function Textarea({
  variant = "default",
  fullWidth = false,
  class: className,
  ...props
}: TextareaProps) {
  const baseClasses = [
    "px-3 py-2 border rounded-lg text-sm transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
    "resize-vertical min-h-[80px]",
  ];

  const variantClasses = {
    default: [
      "border-gray-300 dark:border-gray-600",
      "bg-white dark:bg-gray-700",
      "text-gray-900 dark:text-white",
      "placeholder-gray-500 dark:placeholder-gray-400",
      "focus:ring-blue-500 focus:border-blue-500",
    ],
    error: [
      "border-red-300 dark:border-red-600",
      "bg-red-50 dark:bg-red-900/20",
      "text-red-900 dark:text-red-100",
      "placeholder-red-400",
      "focus:ring-red-500 focus:border-red-500",
    ],
  };

  const widthClasses = fullWidth ? "w-full" : "";

  const classes = [
    ...baseClasses,
    ...variantClasses[variant],
    widthClasses,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <textarea class={classes} {...props} />;
}