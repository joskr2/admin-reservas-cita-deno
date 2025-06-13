// tests/unit/repositories/appointment.test.ts - Tests para AppointmentRepository
import { assertEquals, assertExists } from "$std/testing/asserts.ts";
import { describe, it, beforeEach, afterEach } from "$std/testing/bdd.ts";
import { AppointmentRepository } from "../../../lib/database/repositories/appointment.ts";
import { testUtils } from "../../setup.ts";
import type { Appointment } from "../../../types/index.ts";

describe("AppointmentRepository", () => {
  let repository: AppointmentRepository;

  beforeEach(() => {
    repository = new AppointmentRepository();
  });

  afterEach(async () => {
    await testUtils.cleanupTestData();
  });

  describe("create", () => {
    it("should create a new appointment", async () => {
      const appointmentData: Appointment = {
        id: crypto.randomUUID(),
        psychologistEmail: "psychologist@test.com",
        patientName: "Test Patient",
        appointmentDate: "2024-01-15",
        appointmentTime: "10:00",
        roomId: "room-1",
        status: "scheduled",
        notes: "Test appointment",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await repository.create(appointmentData);
      assertEquals(result, true);

      const retrieved = await repository.getById(appointmentData.id);
      assertExists(retrieved);
      assertEquals(
        retrieved.psychologistEmail,
        appointmentData.psychologistEmail
      );
      assertEquals(retrieved.patientName, appointmentData.patientName);
    });

    it("should fail to create appointment with invalid data", async () => {
      const invalidAppointment = {
        id: "",
        psychologistEmail: "",
        appointmentDate: "",
        appointmentTime: "",
      } as Appointment;

      const result = await repository.create(invalidAppointment);
      assertEquals(result, false);
    });

    it("should set default status to scheduled", async () => {
      const appointment = testUtils.createAppointment();
      delete (appointment as Partial<Appointment>).status;

      await repository.create(appointment);
      const retrieved = await repository.getById(appointment.id);
      assertExists(retrieved);
      assertEquals(retrieved.status, "scheduled");
    });
  });

  describe("update", () => {
    it("should update an existing appointment", async () => {
      const appointmentData: Appointment = {
        id: crypto.randomUUID(),
        psychologistEmail: "psychologist@test.com",
        patientName: "Test Patient",
        appointmentDate: "2024-01-15",
        appointmentTime: "10:00",
        roomId: "room-1",
        status: "scheduled",
        notes: "Test appointment",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await repository.create(appointmentData);

      const updates = {
        status: "completed" as const,
        notes: "Updated notes",
      };

      const result = await repository.update(appointmentData.id, updates);
      assertEquals(result, true);

      const updated = await repository.getById(appointmentData.id);
      assertExists(updated);
      assertEquals(updated.status, "completed");
      assertEquals(updated.notes, "Updated notes");
    });

    it("should update appointment time", async () => {
      const appointment = testUtils.createAppointment();
      await repository.create(appointment);

      const updates = {
        appointmentTime: "14:30",
      };

      const result = await repository.update(appointment.id, updates);
      assertEquals(result, true);

      const updated = await repository.getById(appointment.id);
      assertExists(updated);
      assertEquals(updated.appointmentTime, "14:30");
    });

    it("should return false for non-existent appointment", async () => {
      const result = await repository.update("non-existent-id", {
        notes: "Updated notes",
      });
      assertEquals(result, false);
    });
  });

  describe("delete", () => {
    it("should delete an appointment", async () => {
      const appointmentData: Appointment = {
        id: crypto.randomUUID(),
        psychologistEmail: "psychologist@test.com",
        patientName: "Test Patient",
        appointmentDate: "2024-01-15",
        appointmentTime: "10:00",
        roomId: "room-1",
        status: "scheduled",
        notes: "Test appointment",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await repository.create(appointmentData);

      const deleteResult = await repository.delete(appointmentData.id);
      assertEquals(deleteResult, true);

      const retrieved = await repository.getById(appointmentData.id);
      assertEquals(retrieved, null);
    });

    it("should return false for non-existent appointment", async () => {
      const result = await repository.delete("non-existent-id");
      assertEquals(result, false);
    });
  });

  describe("validation", () => {
    it("should reject appointment with malformed data", async () => {
      const malformedAppointment = {
        id: 123,
        psychologistEmail: {},
        appointmentDate: [],
      } as unknown as Appointment;

      const result = await repository.create(malformedAppointment);
      assertEquals(result, false);
    });
  });

  describe("getAppointmentsByDate", () => {
    it("should return appointments for a specific date", async () => {
      const appointmentDate = "2024-01-15";
      const appointment1: Appointment = {
        id: crypto.randomUUID(),
        psychologistEmail: "psychologist1@test.com",
        patientName: "Patient 1",
        appointmentDate,
        appointmentTime: "10:00",
        roomId: "room-1",
        status: "scheduled",
        notes: "Test appointment 1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const appointment2: Appointment = {
        id: crypto.randomUUID(),
        psychologistEmail: "psychologist2@test.com",
        patientName: "Patient 2",
        appointmentDate: "2024-01-16", // Different date
        appointmentTime: "11:00",
        roomId: "room-2",
        status: "scheduled",
        notes: "Test appointment 2",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await repository.create(appointment1);
      await repository.create(appointment2);

      const appointments = await repository.getAppointmentsByDate(
        appointmentDate
      );
      assertEquals(appointments.length, 1);
      assertEquals(appointments[0]!.id, appointment1.id);
    });
  });

  describe("getAppointmentsByPsychologist", () => {
    it("should return appointments for a specific psychologist", async () => {
      const psychologistEmail = "psychologist@test.com";
      const appointment1: Appointment = {
        id: crypto.randomUUID(),
        psychologistEmail,
        patientName: "Patient 1",
        appointmentDate: "2024-01-15",
        appointmentTime: "10:00",
        roomId: "room-1",
        status: "scheduled",
        notes: "Test appointment 1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const appointment2: Appointment = {
        id: crypto.randomUUID(),
        psychologistEmail: "other@test.com", // Different psychologist
        patientName: "Patient 2",
        appointmentDate: "2024-01-15",
        appointmentTime: "11:00",
        roomId: "room-2",
        status: "scheduled",
        notes: "Test appointment 2",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await repository.create(appointment1);
      await repository.create(appointment2);

      const appointments = await repository.getAppointmentsByPsychologist(
        psychologistEmail
      );
      assertEquals(appointments.length, 1);
      assertEquals(appointments[0]!.id, appointment1.id);
    });
  });

  describe("getAppointmentsByStatus", () => {
    it("should return appointments with a specific status", async () => {
      const appointment1: Appointment = {
        id: crypto.randomUUID(),
        psychologistEmail: "psychologist1@test.com",
        patientName: "Patient 1",
        appointmentDate: "2024-01-15",
        appointmentTime: "10:00",
        roomId: "room-1",
        status: "scheduled",
        notes: "Test appointment 1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const appointment2: Appointment = {
        id: crypto.randomUUID(),
        psychologistEmail: "psychologist2@test.com",
        patientName: "Patient 2",
        appointmentDate: "2024-01-15",
        appointmentTime: "11:00",
        roomId: "room-2",
        status: "completed",
        notes: "Test appointment 2",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await repository.create(appointment1);
      await repository.create(appointment2);

      const scheduledAppointments = await repository.getAppointmentsByStatus(
        "scheduled"
      );
      assertEquals(scheduledAppointments.length, 1);
      assertEquals(scheduledAppointments[0]!.id, appointment1.id);

      const completedAppointments = await repository.getAppointmentsByStatus(
        "completed"
      );
      assertEquals(completedAppointments.length, 1);
      assertEquals(completedAppointments[0]!.id, appointment2.id);
    });
  });

  describe("getAll", () => {
    it("should return all appointments", async () => {
      const appointment1: Appointment = {
        id: crypto.randomUUID(),
        psychologistEmail: "psychologist1@test.com",
        patientName: "Patient 1",
        appointmentDate: "2024-01-15",
        appointmentTime: "10:00",
        roomId: "room-1",
        status: "scheduled",
        notes: "Test appointment 1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const appointment2: Appointment = {
        id: crypto.randomUUID(),
        psychologistEmail: "psychologist2@test.com",
        patientName: "Patient 2",
        appointmentDate: "2024-01-16",
        appointmentTime: "11:00",
        roomId: "room-2",
        status: "completed",
        notes: "Test appointment 2",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await repository.create(appointment1);
      await repository.create(appointment2);

      const allAppointments = await repository.getAll();
      assertEquals(allAppointments.length, 2);
    });
  });
});
