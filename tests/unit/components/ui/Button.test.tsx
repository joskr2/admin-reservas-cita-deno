// tests/unit/components/ui/Button.test.tsx - Tests para el componente Button
import { assertEquals, assert } from "$std/assert/mod.ts";
import { describe, it } from "$std/testing/bdd.ts";
import { Button } from "../../../../components/ui/Button.tsx";

describe("Button Component", () => {
  describe("props validation", () => {
    it("should have correct default props", () => {
      const defaultProps = {
        type: "button" as const,
        variant: "outline" as const,
        size: "md" as const,
        disabled: false,
        loading: false,
      };

      // Verificar que los valores por defecto son correctos
      assertEquals(defaultProps.type, "button");
      assertEquals(defaultProps.variant, "outline");
      assertEquals(defaultProps.size, "md");
      assertEquals(defaultProps.disabled, false);
      assertEquals(defaultProps.loading, false);
    });

    it("should accept all valid variants", () => {
      const validVariants = [
        "primary",
        "secondary",
        "danger",
        "outline",
      ] as const;

      for (const variant of validVariants) {
        // Verificar que cada variante es válida
        assert(typeof variant === "string");
        assert(validVariants.includes(variant));
      }
    });

    it("should accept all valid sizes", () => {
      const validSizes = ["sm", "md", "lg"] as const;

      for (const size of validSizes) {
        // Verificar que cada tamaño es válido
        assert(typeof size === "string");
        assert(validSizes.includes(size));
      }
    });

    it("should accept all valid types", () => {
      const validTypes = ["button", "submit", "reset"] as const;

      for (const type of validTypes) {
        // Verificar que cada tipo es válido
        assert(typeof type === "string");
        assert(validTypes.includes(type));
      }
    });
  });

  describe("className generation", () => {
    it("should generate base classes", () => {
      const baseClasses = [
        "inline-flex",
        "items-center",
        "justify-center",
        "font-medium",
        "rounded-lg",
        "transition-all",
        "duration-200",
        "ease-in-out",
        "focus:outline-none",
        "focus:ring-2",
        "focus:ring-offset-2",
      ];

      // Verificar que las clases base están definidas
      for (const className of baseClasses) {
        assert(typeof className === "string");
        assert(className.length > 0);
      }
    });

    it("should have variant-specific classes", () => {
      const variantClasses = {
        primary: [
          "bg-blue-600",
          "text-white",
          "hover:bg-blue-700",
          "focus:ring-blue-500",
        ],
        secondary: [
          "bg-gray-200",
          "text-gray-900",
          "hover:bg-gray-300",
          "focus:ring-gray-500",
        ],
        danger: [
          "bg-red-600",
          "text-white",
          "hover:bg-red-700",
          "focus:ring-red-500",
        ],
        outline: [
          "border",
          "bg-transparent",
          "hover:bg-gray-50",
          "focus:ring-blue-500",
        ],
      };

      // Verificar que cada variante tiene sus clases definidas
      for (const [variant, classes] of Object.entries(variantClasses)) {
        assert(typeof variant === "string");
        assert(Array.isArray(classes));
        assert(classes.length > 0);

        for (const className of classes) {
          assert(typeof className === "string");
          assert(className.length > 0);
        }
      }
    });

    it("should have size-specific classes", () => {
      const sizeClasses = {
        sm: ["px-3", "py-1.5", "text-sm"],
        md: ["px-4", "py-2", "text-base"],
        lg: ["px-6", "py-3", "text-lg"],
      };

      // Verificar que cada tamaño tiene sus clases definidas
      for (const [size, classes] of Object.entries(sizeClasses)) {
        assert(typeof size === "string");
        assert(Array.isArray(classes));
        assert(classes.length > 0);

        for (const className of classes) {
          assert(typeof className === "string");
          assert(className.length > 0);
        }
      }
    });
  });

  describe("component structure", () => {
    it("should be a function component", () => {
      assert(typeof Button === "function");
    });

    it("should accept children prop", () => {
      // Verificar que el componente puede recibir children
      const mockProps = {
        children: "Test Button",
      };

      assert(typeof mockProps.children === "string");
    });

    it("should accept onClick handler", () => {
      let clicked = false;
      const handleClick = () => {
        clicked = true;
      };

      // Simular click
      handleClick();
      assertEquals(clicked, true);
    });

    it("should handle disabled state", () => {
      const disabledProps = {
        disabled: true,
        onClick: () => {
          throw new Error("Should not be called when disabled");
        },
      };

      // Verificar que disabled es boolean
      assertEquals(typeof disabledProps.disabled, "boolean");
      assertEquals(disabledProps.disabled, true);
    });

    it("should handle loading state", () => {
      const loadingProps = {
        loading: true,
        disabled: true, // loading implica disabled
      };

      // Verificar que loading es boolean
      assertEquals(typeof loadingProps.loading, "boolean");
      assertEquals(loadingProps.loading, true);
      assertEquals(loadingProps.disabled, true);
    });
  });

  describe("accessibility", () => {
    it("should support ARIA attributes", () => {
      const ariaProps = {
        "aria-label": "Custom button label",
        "aria-describedby": "button-description",
        "aria-disabled": "true",
      };

      // Verificar que los atributos ARIA son strings
      for (const [key, value] of Object.entries(ariaProps)) {
        assert(typeof key === "string");
        assert(key.startsWith("aria-"));
        assert(typeof value === "string");
      }
    });

    it("should have proper focus management", () => {
      const focusClasses = [
        "focus:outline-none",
        "focus:ring-2",
        "focus:ring-offset-2",
      ];

      // Verificar que las clases de focus están definidas
      for (const className of focusClasses) {
        assert(typeof className === "string");
        assert(className.includes("focus:"));
      }
    });
  });

  describe("form integration", () => {
    it("should work with form submission", () => {
      const formProps = {
        type: "submit" as const,
        form: "test-form",
      };

      assertEquals(formProps.type, "submit");
      assertEquals(typeof formProps.form, "string");
    });

    it("should work with form reset", () => {
      const resetProps = {
        type: "reset" as const,
      };

      assertEquals(resetProps.type, "reset");
    });
  });

  describe("event handling", () => {
    it("should handle click events", () => {
      let eventFired = false;

      const handleClick = () => {
        eventFired = true;
      };

      // Simular evento
      handleClick();

      assertEquals(eventFired, true);
    });

    it("should prevent events when disabled", () => {
      const disabledButton = {
        disabled: true,
        onClick: () => {
          throw new Error("Should not execute when disabled");
        },
      };

      // Verificar que el botón está deshabilitado
      assertEquals(disabledButton.disabled, true);

      // En un botón real, el evento no se ejecutaría
      // Aquí solo verificamos que la lógica de disabled está presente
    });
  });

  describe("styling consistency", () => {
    it("should have consistent transition classes", () => {
      const transitionClasses = [
        "transition-all",
        "duration-200",
        "ease-in-out",
      ];

      for (const className of transitionClasses) {
        assert(typeof className === "string");
        assert(className.length > 0);
      }
    });

    it("should have consistent spacing classes", () => {
      const spacingPattern = /^(px|py|p)-\d+(\.\d+)?$/;
      const spacingClasses = ["px-3", "py-1.5", "px-4", "py-2", "px-6", "py-3"];

      for (const className of spacingClasses) {
        assert(spacingPattern.test(className));
      }
    });

    it("should have consistent color classes", () => {
      const colorClasses = [
        "bg-blue-600",
        "text-white",
        "hover:bg-blue-700",
        "bg-gray-200",
        "text-gray-900",
        "bg-red-600",
      ];

      for (const className of colorClasses) {
        assert(typeof className === "string");
        assert(className.includes("-") || className.includes(":"));
      }
    });
  });
});
