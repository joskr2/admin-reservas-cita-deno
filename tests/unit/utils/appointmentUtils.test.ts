// tests/unit/utils/appointmentUtils.test.ts - Tests para utilidades de citas
import { assertEquals } from "$std/testing/asserts.ts";
import { describe, it } from "$std/testing/bdd.ts";
import {
  getStatusColor,
  getStatusText,
  getNextStatuses,
} from "../../../lib/utils/appointmentUtils.ts";
import type { AppointmentStatus } from "../../../types/index.ts";

describe("AppointmentUtils", () => {
  describe("getStatusColor", () => {
    it("should return correct color for pending status", () => {
      const color = getStatusColor("pending");
      assertEquals(
        color,
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      );
    });

    it("should return correct color for scheduled status", () => {
      const color = getStatusColor("scheduled");
      assertEquals(
        color,
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      );
    });

    it("should return correct color for in_progress status", () => {
      const color = getStatusColor("in_progress");
      assertEquals(
        color,
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      );
    });

    it("should return correct color for completed status", () => {
      const color = getStatusColor("completed");
      assertEquals(
        color,
        "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      );
    });

    it("should return correct color for cancelled status", () => {
      const color = getStatusColor("cancelled");
      assertEquals(
        color,
        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      );
    });

    it("should return default color for unknown status", () => {
      const color = getStatusColor("unknown" as AppointmentStatus);
      assertEquals(
        color,
        "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      );
    });
  });

  describe("getStatusText", () => {
    it("should return correct text for pending status", () => {
      const text = getStatusText("pending");
      assertEquals(text, "Pendiente");
    });

    it("should return correct text for scheduled status", () => {
      const text = getStatusText("scheduled");
      assertEquals(text, "Programada");
    });

    it("should return correct text for in_progress status", () => {
      const text = getStatusText("in_progress");
      assertEquals(text, "En Progreso");
    });

    it("should return correct text for completed status", () => {
      const text = getStatusText("completed");
      assertEquals(text, "Completada");
    });

    it("should return correct text for cancelled status", () => {
      const text = getStatusText("cancelled");
      assertEquals(text, "Cancelada");
    });

    it("should return default text for unknown status", () => {
      const text = getStatusText("unknown" as AppointmentStatus);
      assertEquals(text, "Desconocido");
    });
  });

  describe("getNextStatuses", () => {
    it("should return correct next statuses for pending", () => {
      const nextStatuses = getNextStatuses("pending");
      assertEquals(nextStatuses, ["scheduled", "cancelled"]);
    });

    it("should return correct next statuses for scheduled", () => {
      const nextStatuses = getNextStatuses("scheduled");
      assertEquals(nextStatuses, ["in_progress", "cancelled"]);
    });

    it("should return correct next statuses for in_progress", () => {
      const nextStatuses = getNextStatuses("in_progress");
      assertEquals(nextStatuses, ["completed", "cancelled"]);
    });

    it("should return empty array for completed status", () => {
      const nextStatuses = getNextStatuses("completed");
      assertEquals(nextStatuses, []);
    });

    it("should return empty array for cancelled status", () => {
      const nextStatuses = getNextStatuses("cancelled");
      assertEquals(nextStatuses, []);
    });

    it("should return empty array for unknown status", () => {
      const nextStatuses = getNextStatuses("unknown" as AppointmentStatus);
      assertEquals(nextStatuses, []);
    });
  });

  describe("status workflow validation", () => {
    it("should validate complete workflow from pending to completed", () => {
      // Pending -> Scheduled
      let nextStatuses = getNextStatuses("pending");
      assertEquals(nextStatuses.includes("scheduled"), true);

      // Scheduled -> In Progress
      nextStatuses = getNextStatuses("scheduled");
      assertEquals(nextStatuses.includes("in_progress"), true);

      // In Progress -> Completed
      nextStatuses = getNextStatuses("in_progress");
      assertEquals(nextStatuses.includes("completed"), true);

      // Completed -> No more transitions
      nextStatuses = getNextStatuses("completed");
      assertEquals(nextStatuses.length, 0);
    });

    it("should allow cancellation from any active status", () => {
      const activeStatuses: AppointmentStatus[] = [
        "pending",
        "scheduled",
        "in_progress",
      ];

      for (const status of activeStatuses) {
        const nextStatuses = getNextStatuses(status);
        assertEquals(
          nextStatuses.includes("cancelled"),
          true,
          `Status ${status} should allow cancellation`
        );
      }
    });

    it("should not allow transitions from terminal statuses", () => {
      const terminalStatuses: AppointmentStatus[] = ["completed", "cancelled"];

      for (const status of terminalStatuses) {
        const nextStatuses = getNextStatuses(status);
        assertEquals(
          nextStatuses.length,
          0,
          `Terminal status ${status} should not allow transitions`
        );
      }
    });
  });

  describe("status color consistency", () => {
    it("should return consistent colors for all valid statuses", () => {
      const validStatuses: AppointmentStatus[] = [
        "pending",
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ];

      for (const status of validStatuses) {
        const color = getStatusColor(status);
        assertEquals(typeof color, "string");
        assertEquals(color.length > 0, true);
        // Verificar que contiene clases de Tailwind válidas
        assertEquals(color.includes("bg-"), true);
        assertEquals(color.includes("text-"), true);
      }
    });
  });

  describe("status text consistency", () => {
    it("should return consistent text for all valid statuses", () => {
      const validStatuses: AppointmentStatus[] = [
        "pending",
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ];
      const expectedTexts = [
        "Pendiente",
        "Programada",
        "En Progreso",
        "Completada",
        "Cancelada",
      ];

      for (let i = 0; i < validStatuses.length; i++) {
        const text = getStatusText(validStatuses[i]!);
        assertEquals(text, expectedTexts[i]);
        assertEquals(typeof text, "string");
        assertEquals(text.length > 0, true);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle undefined status gracefully", () => {
      const color = getStatusColor(undefined as unknown as AppointmentStatus);
      assertEquals(
        color,
        "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      );

      const text = getStatusText(undefined as unknown as AppointmentStatus);
      assertEquals(text, "Desconocido");

      const nextStatuses = getNextStatuses(
        undefined as unknown as AppointmentStatus
      );
      assertEquals(nextStatuses, []);
    });

    it("should handle null status gracefully", () => {
      const color = getStatusColor(null as unknown as AppointmentStatus);
      assertEquals(
        color,
        "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      );

      const text = getStatusText(null as unknown as AppointmentStatus);
      assertEquals(text, "Desconocido");

      const nextStatuses = getNextStatuses(
        null as unknown as AppointmentStatus
      );
      assertEquals(nextStatuses, []);
    });

    it("should handle empty string status gracefully", () => {
      const color = getStatusColor("" as AppointmentStatus);
      assertEquals(
        color,
        "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      );

      const text = getStatusText("" as AppointmentStatus);
      assertEquals(text, "Desconocido");

      const nextStatuses = getNextStatuses("" as AppointmentStatus);
      assertEquals(nextStatuses, []);
    });
  });

  describe("type safety", () => {
    it("should only accept valid AppointmentStatus values", () => {
      const validStatuses: AppointmentStatus[] = [
        "pending",
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ];

      // Verificar que todas las funciones aceptan todos los estados válidos
      for (const status of validStatuses) {
        // No debería lanzar errores
        getStatusColor(status);
        getStatusText(status);
        getNextStatuses(status);
      }
    });
  });

  describe("business logic validation", () => {
    it("should enforce logical status progression", () => {
      // No se puede ir directamente de pending a completed
      const pendingNext = getNextStatuses("pending");
      assertEquals(pendingNext.includes("completed"), false);
      assertEquals(pendingNext.includes("in_progress"), false);

      // No se puede ir directamente de scheduled a completed
      const scheduledNext = getNextStatuses("scheduled");
      assertEquals(scheduledNext.includes("completed"), false);

      // Solo in_progress puede ir a completed
      const inProgressNext = getNextStatuses("in_progress");
      assertEquals(inProgressNext.includes("completed"), true);
    });

    it("should allow cancellation at appropriate stages", () => {
      // Se puede cancelar antes de completar
      assertEquals(getNextStatuses("pending").includes("cancelled"), true);
      assertEquals(getNextStatuses("scheduled").includes("cancelled"), true);
      assertEquals(getNextStatuses("in_progress").includes("cancelled"), true);

      // No se puede cancelar después de completar
      assertEquals(getNextStatuses("completed").includes("cancelled"), false);
    });
  });
});
