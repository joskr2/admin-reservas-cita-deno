// tests/unit/repositories/patient.test.ts - Tests para PatientRepository
import { assertEquals, assertExists, assert } from "$std/testing/asserts.ts";
import { describe, it, beforeEach } from "$std/testing/bdd.ts";
import { PatientRepository } from "../../../lib/database/repositories/patient.ts";
import { DatabaseConnection } from "../../../lib/database/connection.ts";
import { testUtils } from "../../setup.ts";
import type { Patient } from "../../../types/index.ts";

describe("PatientRepository", () => {
  let patientRepository: PatientRepository;
  let connection: DatabaseConnection;

  beforeEach(() => {
    connection = DatabaseConnection.getInstance();
    patientRepository = new PatientRepository(connection);
  });

  describe("create", () => {
    it("should create a new patient successfully", async () => {
      const patient = testUtils.createPatient({
        name: "Juan Pérez",
        email: "juan@example.com",
        phone: "123456789",
      });

      const result = await patientRepository.create(patient);
      assertEquals(result, true);

      // Verificar que el paciente fue creado
      const createdPatient = await patientRepository.getById(patient.id);
      assertExists(createdPatient);
      assertEquals(createdPatient.name, patient.name);
      assertEquals(createdPatient.email, patient.email);
      assertEquals(createdPatient.phone, patient.phone);
      assertEquals(createdPatient.isActive, true);
    });

    it("should generate ID if not provided", async () => {
      const patient = testUtils.createPatient();
      // Crear un paciente sin ID
      const patientData = {
        name: patient.name,
        isActive: patient.isActive,
        email: patient.email,
        phone: patient.phone,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
      };

      const result = await patientRepository.create(patientData as Patient);
      assertEquals(result, true);

      // Verificar que se generó un ID
      const patients = await patientRepository.getAll();
      assertEquals(patients.length, 1);
      const firstPatient = patients[0];
      assertExists(firstPatient);
      assertExists(firstPatient.id);
    });

    it("should add timestamps on creation", async () => {
      const patient = testUtils.createPatient();
      const patientData = {
        id: patient.id,
        name: patient.name,
        isActive: patient.isActive,
        email: patient.email,
        phone: patient.phone,
      };

      const result = await patientRepository.create(patientData as Patient);
      assertEquals(result, true);

      const createdPatient = await patientRepository.getById(patient.id);
      assertExists(createdPatient);
      assertExists(createdPatient.createdAt);
      assertExists(createdPatient.updatedAt);
    });

    it("should validate required fields", async () => {
      const invalidPatient = {
        id: "test-id",
        name: "", // Nombre vacío
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await patientRepository.create(invalidPatient as Patient);
      assertEquals(result, false);
    });

    it("should validate name is string", async () => {
      const invalidPatient = testUtils.createPatient({
        name: null as unknown as string,
      });
      const result = await patientRepository.create(invalidPatient);
      assertEquals(result, false);
    });

    it("should validate isActive is boolean", async () => {
      const invalidPatient = testUtils.createPatient({
        isActive: "true" as unknown as boolean,
      });
      const result = await patientRepository.create(invalidPatient);
      assertEquals(result, false);
    });
  });

  describe("getById", () => {
    it("should return patient when ID exists", async () => {
      const patient = testUtils.createPatient();
      await patientRepository.create(patient);

      const foundPatient = await patientRepository.getById(patient.id);
      assertExists(foundPatient);
      assertEquals(foundPatient.id, patient.id);
      assertEquals(foundPatient.name, patient.name);
    });

    it("should return null when ID does not exist", async () => {
      const foundPatient = await patientRepository.getById("nonexistent-id");
      assertEquals(foundPatient, null);
    });
  });

  describe("getPatientByName", () => {
    it("should return patients with matching name", async () => {
      const patient1 = testUtils.createPatient({ name: "Juan Pérez" });
      const patient2 = testUtils.createPatient({ name: "Juan Carlos" });
      const patient3 = testUtils.createPatient({ name: "María García" });

      await patientRepository.create(patient1);
      await patientRepository.create(patient2);
      await patientRepository.create(patient3);

      const results = await patientRepository.getPatientByName("Juan");
      assertEquals(results.length, 2);
      assert(results.some((p) => p.name === "Juan Pérez"));
      assert(results.some((p) => p.name === "Juan Carlos"));
    });

    it("should return exact match", async () => {
      const patient = testUtils.createPatient({ name: "María García" });
      await patientRepository.create(patient);

      const results = await patientRepository.getPatientByName("María García");
      assertEquals(results.length, 1);
      const firstResult = results[0];
      assertExists(firstResult);
      assertEquals(firstResult.name, "María García");
    });

    it("should be case insensitive", async () => {
      const patient = testUtils.createPatient({ name: "Juan Pérez" });
      await patientRepository.create(patient);

      const results = await patientRepository.getPatientByName("JUAN");
      assertEquals(results.length, 1);
      const firstResult = results[0];
      assertExists(firstResult);
      assertEquals(firstResult.name, "Juan Pérez");
    });

    it("should return empty array when no matches", async () => {
      const results = await patientRepository.getPatientByName("Nonexistent");
      assertEquals(results.length, 0);
    });

    it("should handle invalid name parameter", async () => {
      const results1 = await patientRepository.getPatientByName("");
      assertEquals(results1.length, 0);

      const results2 = await patientRepository.getPatientByName(
        null as unknown as string
      );
      assertEquals(results2.length, 0);
    });
  });

  describe("getAllPatientsAsProfiles", () => {
    it("should return all patients as profiles", async () => {
      const patient1 = testUtils.createPatient({ name: "Ana García" });
      const patient2 = testUtils.createPatient({ name: "Carlos López" });

      await patientRepository.create(patient1);
      await patientRepository.create(patient2);

      const profiles = await patientRepository.getAllPatientsAsProfiles();
      assertEquals(profiles.length, 2);

      // Verificar que los perfiles tienen las propiedades correctas
      profiles.forEach((profile) => {
        assertExists(profile.id);
        assertExists(profile.name);
        assertExists(profile.isActive);
      });
    });

    it("should return sorted profiles", async () => {
      const patient1 = testUtils.createPatient({ name: "Zulema" });
      const patient2 = testUtils.createPatient({ name: "Ana" });
      const patient3 = testUtils.createPatient({ name: "Carlos" });

      await patientRepository.create(patient1);
      await patientRepository.create(patient2);
      await patientRepository.create(patient3);

      const profiles = await patientRepository.getAllPatientsAsProfiles();
      assertEquals(profiles.length, 3);
      const firstProfile = profiles[0];
      const secondProfile = profiles[1];
      const thirdProfile = profiles[2];
      assertExists(firstProfile);
      assertExists(secondProfile);
      assertExists(thirdProfile);
      assertEquals(firstProfile.name, "Ana");
      assertEquals(secondProfile.name, "Carlos");
      assertEquals(thirdProfile.name, "Zulema");
    });

    it("should return empty array when no patients exist", async () => {
      const profiles = await patientRepository.getAllPatientsAsProfiles();
      assertEquals(profiles.length, 0);
    });
  });

  describe("searchPatients", () => {
    beforeEach(async () => {
      const patients = [
        testUtils.createPatient({
          name: "Juan Pérez",
          email: "juan@example.com",
          phone: "123456789",
        }),
        testUtils.createPatient({
          name: "María García",
          email: "maria@test.com",
          phone: "987654321",
        }),
        testUtils.createPatient({
          name: "Carlos López",
          email: "carlos@example.com",
          phone: "555123456",
        }),
      ];

      for (const patient of patients) {
        await patientRepository.create(patient);
      }
    });

    it("should search by name", async () => {
      const results = await patientRepository.searchPatients("Juan");
      assertEquals(results.length, 1);
      const firstResult = results[0];
      assertExists(firstResult);
      assertEquals(firstResult.name, "Juan Pérez");
    });

    it("should search by email", async () => {
      const results = await patientRepository.searchPatients("maria@test.com");
      assertEquals(results.length, 1);
      const firstResult = results[0];
      assertExists(firstResult);
      assertEquals(firstResult.name, "María García");
    });

    it("should search by phone", async () => {
      const results = await patientRepository.searchPatients("555123456");
      assertEquals(results.length, 1);
      const firstResult = results[0];
      assertExists(firstResult);
      assertEquals(firstResult.name, "Carlos López");
    });

    it("should search partial matches", async () => {
      const results = await patientRepository.searchPatients("example.com");
      assertEquals(results.length, 2);
      assert(results.some((p) => p.name === "Juan Pérez"));
      assert(results.some((p) => p.name === "Carlos López"));
    });

    it("should be case insensitive", async () => {
      const results = await patientRepository.searchPatients("MARÍA");
      assertEquals(results.length, 1);
      const firstResult = results[0];
      assertExists(firstResult);
      assertEquals(firstResult.name, "María García");
    });

    it("should return all patients when query is empty", async () => {
      const results = await patientRepository.searchPatients("");
      assertEquals(results.length, 3);
    });

    it("should return empty array when no matches", async () => {
      const results = await patientRepository.searchPatients("nonexistent");
      assertEquals(results.length, 0);
    });
  });

  describe("getActivePatients", () => {
    it("should return only active patients", async () => {
      const activePatient = testUtils.createPatient({
        name: "Active Patient",
        isActive: true,
      });
      const inactivePatient = testUtils.createPatient({
        name: "Inactive Patient",
        isActive: false,
      });

      await patientRepository.create(activePatient);
      await patientRepository.create(inactivePatient);

      const activePatients = await patientRepository.getActivePatients();
      assertEquals(activePatients.length, 1);
      const firstActive = activePatients[0];
      assertExists(firstActive);
      assertEquals(firstActive.name, "Active Patient");
      assertEquals(firstActive.isActive, true);
    });

    it("should return empty array when no active patients", async () => {
      const inactivePatient = testUtils.createPatient({ isActive: false });
      await patientRepository.create(inactivePatient);

      const activePatients = await patientRepository.getActivePatients();
      assertEquals(activePatients.length, 0);
    });
  });

  describe("update", () => {
    it("should update patient successfully", async () => {
      const patient = testUtils.createPatient({ name: "Original Name" });
      await patientRepository.create(patient);

      const updates = {
        name: "Updated Name",
        email: "updated@example.com",
      };
      const result = await patientRepository.update(patient.id, updates);
      assertEquals(result, true);

      const updatedPatient = await patientRepository.getById(patient.id);
      assertExists(updatedPatient);
      assertEquals(updatedPatient.name, "Updated Name");
      assertEquals(updatedPatient.email, "updated@example.com");
      assertExists(updatedPatient.updatedAt);
    });

    it("should update name index when name changes", async () => {
      const patient = testUtils.createPatient({ name: "Original Name" });
      await patientRepository.create(patient);

      await patientRepository.update(patient.id, { name: "New Name" });

      // Verificar que se puede encontrar por el nuevo nombre
      const foundByNewName = await patientRepository.getPatientByName(
        "New Name"
      );
      assertEquals(foundByNewName.length, 1);
      const foundPatient = foundByNewName[0];
      assertExists(foundPatient);
      assertEquals(foundPatient.id, patient.id);

      // Verificar que no se encuentra por el nombre anterior
      const foundByOldName = await patientRepository.getPatientByName(
        "Original Name"
      );
      assertEquals(foundByOldName.length, 0);
    });

    it("should return false when updating non-existent patient", async () => {
      const result = await patientRepository.update("nonexistent-id", {
        name: "New Name",
      });
      assertEquals(result, false);
    });

    it("should preserve other fields when updating", async () => {
      const patient = testUtils.createPatient({
        name: "Original Name",
        email: "original@example.com",
        phone: "123456789",
      });
      await patientRepository.create(patient);

      await patientRepository.update(patient.id, { name: "Updated Name" });

      const updatedPatient = await patientRepository.getById(patient.id);
      assertExists(updatedPatient);
      assertEquals(updatedPatient.name, "Updated Name");
      assertEquals(updatedPatient.email, "original@example.com");
      assertEquals(updatedPatient.phone, "123456789");
    });
  });

  describe("delete", () => {
    it("should delete patient successfully", async () => {
      const patient = testUtils.createPatient();
      await patientRepository.create(patient);

      const result = await patientRepository.delete(patient.id);
      assertEquals(result, true);

      const deletedPatient = await patientRepository.getById(patient.id);
      assertEquals(deletedPatient, null);
    });

    it("should remove from name index when deleted", async () => {
      const patient = testUtils.createPatient({ name: "Test Patient" });
      await patientRepository.create(patient);

      await patientRepository.delete(patient.id);

      const foundByName = await patientRepository.getPatientByName(
        "Test Patient"
      );
      assertEquals(foundByName.length, 0);
    });

    it("should return false when deleting non-existent patient", async () => {
      const result = await patientRepository.delete("nonexistent-id");
      assertEquals(result, false);
    });
  });

  describe("getAll", () => {
    it("should return all patients", async () => {
      const patient1 = testUtils.createPatient({ name: "Patient 1" });
      const patient2 = testUtils.createPatient({ name: "Patient 2" });

      await patientRepository.create(patient1);
      await patientRepository.create(patient2);

      const allPatients = await patientRepository.getAll();
      assertEquals(allPatients.length, 2);
    });

    it("should return empty array when no patients exist", async () => {
      const allPatients = await patientRepository.getAll();
      assertEquals(allPatients.length, 0);
    });
  });

  describe("validation", () => {
    it("should validate name is required", async () => {
      const invalidPatient = testUtils.createPatient({ name: "" });
      const result = await patientRepository.create(invalidPatient);
      assertEquals(result, false);
    });

    it("should validate name is string", async () => {
      const invalidPatient = testUtils.createPatient({
        name: 123 as unknown as string,
      });
      const result = await patientRepository.create(invalidPatient);
      assertEquals(result, false);
    });

    it("should validate isActive is boolean", async () => {
      const invalidPatient = testUtils.createPatient({
        isActive: "true" as unknown as boolean,
      });
      const result = await patientRepository.create(invalidPatient);
      assertEquals(result, false);
    });
  });

  describe("error handling", () => {
    it("should handle malformed data gracefully", async () => {
      const malformedPatient = {
        id: "test-id",
        name: null,
        isActive: "not-boolean",
        createdAt: "invalid-date",
        updatedAt: new Date().toISOString(),
      };

      const result = await patientRepository.create(
        malformedPatient as unknown as Patient
      );
      assertEquals(result, false);
    });
  });
});
