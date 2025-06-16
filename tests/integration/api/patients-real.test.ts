// tests/integration/api/patients-real.test.ts - Tests de integración reales para APIs de pacientes
import { assert, assertEquals, assertExists } from "$std/testing/asserts.ts";
import { afterEach, beforeEach, describe, it } from "$std/testing/bdd.ts";
import {
  assertApiError,
  assertApiResponse,
  authenticateUser,
  cleanupTestData,
  createApiRequest,
  createTestServer,
  generateTestData,
  type TestServer,
} from "../../helpers/integration.ts";
import type { User } from "../../../types/index.ts";

describe("Patients API Integration (Real)", () => {
  let server: TestServer;
  let authCookies: Record<string, string>;
  let authenticatedUser: User | null;

  beforeEach(async () => {
    // Limpiar datos de prueba
    await cleanupTestData();

    // Crear servidor de pruebas
    server = await createTestServer();

    // Autenticar usuario para las pruebas
    try {
      const auth = await authenticateUser(server);
      authCookies = auth.cookies;
      authenticatedUser = auth.user;
    } catch (error) {
      console.warn("Could not authenticate user for tests:", error);
      authCookies = {};
      authenticatedUser = null;
    }
  });

  afterEach(async () => {
    await server.close();
    await cleanupTestData();
  });

  describe("GET /api/patients", () => {
    it("should return empty list when no patients exist", async () => {
      const response = await server.request(
        "/api/patients",
        createApiRequest("GET", undefined, authCookies),
      );

      assertEquals(response.status, 200);
      const data = await response.json();
      assertApiResponse(data, ["success", "patients"]);
      assertEquals(data.success, true);
      assertEquals(Array.isArray(data.patients), true);
      assertEquals(data.patients.length, 0);
    });

    it("should return list of patients when they exist", async () => {
      // Crear algunos pacientes de prueba primero
      const testData1 = generateTestData("patient1");
      const testData2 = generateTestData("patient2");

      const patient1 = {
        name: testData1.name,
        email: testData1.email,
        phone: "123-456-7890",
        dateOfBirth: "1990-01-01",
        psychologistEmail: authenticatedUser?.email || "test@example.com",
      };

      const patient2 = {
        name: testData2.name,
        email: testData2.email,
        phone: "098-765-4321",
        dateOfBirth: "1985-05-15",
        psychologistEmail: authenticatedUser?.email || "test@example.com",
      };

      // Crear pacientes
      await server.request(
        "/api/patients",
        createApiRequest("POST", patient1, authCookies),
      );
      await server.request(
        "/api/patients",
        createApiRequest("POST", patient2, authCookies),
      );

      // Obtener lista de pacientes
      const response = await server.request(
        "/api/patients",
        createApiRequest("GET", undefined, authCookies),
      );

      assertEquals(response.status, 200);
      const data = await response.json();
      assertApiResponse(data, ["success", "patients"]);
      assertEquals(data.success, true);
      assertEquals(Array.isArray(data.patients), true);
      assertEquals(data.patients.length, 2);

      // Verificar que los pacientes tienen las propiedades correctas
      data.patients.forEach((patient: Record<string, unknown>) => {
        assertExists(patient.id);
        assertExists(patient.name);
        assertExists(patient.email);
        assertExists(patient.createdAt);
      });
    });

    it("should handle unauthorized access", async () => {
      const response = await server.request(
        "/api/patients",
        createApiRequest("GET"),
      );

      // Dependiendo de la implementación, podría ser 401 o redirección
      assert(response.status === 401 || response.status === 302);
    });
  });

  describe("POST /api/patients", () => {
    it("should create a new patient successfully", async () => {
      const testData = generateTestData("newpatient");
      const patientData = {
        name: testData.name,
        email: testData.email,
        phone: "123-456-7890",
        dateOfBirth: "1990-01-01",
        psychologistEmail: authenticatedUser?.email || "test@example.com",
      };

      const response = await server.request(
        "/api/patients",
        createApiRequest("POST", patientData, authCookies),
      );

      assertEquals(response.status, 201);
      const data = await response.json();
      assertApiResponse(data, ["success", "patient"]);
      assertEquals(data.success, true);
      assertExists(data.patient);
      assertEquals(data.patient.name, patientData.name);
      assertEquals(data.patient.email, patientData.email);
      assertExists(data.patient.id);
    });

    it("should reject patient with missing required fields", async () => {
      const invalidPatientData = {
        name: "Test Patient",
        // Falta email, phone, dateOfBirth
      };

      const response = await server.request(
        "/api/patients",
        createApiRequest("POST", invalidPatientData, authCookies),
      );

      assertEquals(response.status, 400);
      const data = await response.json();
      assertApiError(data);
    });

    it("should reject patient with invalid email format", async () => {
      const testData = generateTestData("invalid");
      const invalidPatientData = {
        name: testData.name,
        email: "invalid-email-format",
        phone: "123-456-7890",
        dateOfBirth: "1990-01-01",
        psychologistEmail: authenticatedUser?.email || "test@example.com",
      };

      const response = await server.request(
        "/api/patients",
        createApiRequest("POST", invalidPatientData, authCookies),
      );

      assertEquals(response.status, 400);
      const data = await response.json();
      assertApiError(data);
    });

    it("should reject patient with duplicate email", async () => {
      const testData = generateTestData("duplicate");
      const patientData = {
        name: testData.name,
        email: testData.email,
        phone: "123-456-7890",
        dateOfBirth: "1990-01-01",
        psychologistEmail: authenticatedUser?.email || "test@example.com",
      };

      // Crear primer paciente
      const firstResponse = await server.request(
        "/api/patients",
        createApiRequest("POST", patientData, authCookies),
      );
      assertEquals(firstResponse.status, 201);

      // Intentar crear segundo paciente con mismo email
      const secondResponse = await server.request(
        "/api/patients",
        createApiRequest("POST", patientData, authCookies),
      );

      assertEquals(secondResponse.status, 409);
      const data = await secondResponse.json();
      assertApiError(data);
    });

    it("should handle malformed JSON", async () => {
      const response = await server.request("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authCookies,
        },
        body: "invalid json",
      });

      assertEquals(response.status, 400);
      const data = await response.json();
      assertApiError(data);
    });
  });

  describe("GET /api/patients/[id]", () => {
    it("should return specific patient by ID", async () => {
      // Crear paciente primero
      const testData = generateTestData("specific");
      const patientData = {
        name: testData.name,
        email: testData.email,
        phone: "123-456-7890",
        dateOfBirth: "1990-01-01",
        psychologistEmail: authenticatedUser?.email || "test@example.com",
      };

      const createResponse = await server.request(
        "/api/patients",
        createApiRequest("POST", patientData, authCookies),
      );
      assertEquals(createResponse.status, 201);
      const createdPatient = await createResponse.json();

      // Obtener paciente por ID
      const response = await server.request(
        `/api/patients/${createdPatient.patient.id}`,
        createApiRequest("GET", undefined, authCookies),
      );

      assertEquals(response.status, 200);
      const data = await response.json();
      assertApiResponse(data, ["success", "patient"]);
      assertEquals(data.success, true);
      assertEquals(data.patient.id, createdPatient.patient.id);
      assertEquals(data.patient.name, patientData.name);
    });

    it("should return 404 for non-existent patient", async () => {
      const response = await server.request(
        "/api/patients/non-existent-id",
        createApiRequest("GET", undefined, authCookies),
      );

      assertEquals(response.status, 404);
      const data = await response.json();
      assertApiError(data);
    });
  });

  describe("PUT /api/patients/[id]", () => {
    it("should update patient successfully", async () => {
      // Crear paciente primero
      const testData = generateTestData("update");
      const patientData = {
        name: testData.name,
        email: testData.email,
        phone: "123-456-7890",
        dateOfBirth: "1990-01-01",
        psychologistEmail: authenticatedUser?.email || "test@example.com",
      };

      const createResponse = await server.request(
        "/api/patients",
        createApiRequest("POST", patientData, authCookies),
      );
      const createdPatient = await createResponse.json();

      // Actualizar paciente
      const updateData = {
        name: "Updated Name",
        phone: "999-888-7777",
      };

      const response = await server.request(
        `/api/patients/${createdPatient.patient.id}`,
        createApiRequest("PUT", updateData, authCookies),
      );

      assertEquals(response.status, 200);
      const data = await response.json();
      assertApiResponse(data, ["success", "patient"]);
      assertEquals(data.success, true);
      assertEquals(data.patient.name, updateData.name);
      assertEquals(data.patient.phone, updateData.phone);
      assertEquals(data.patient.email, patientData.email); // No debería cambiar
    });

    it("should return 404 when updating non-existent patient", async () => {
      const updateData = { name: "New Name" };

      const response = await server.request(
        "/api/patients/non-existent-id",
        createApiRequest("PUT", updateData, authCookies),
      );

      assertEquals(response.status, 404);
      const data = await response.json();
      assertApiError(data);
    });
  });

  describe("DELETE /api/patients/[id]", () => {
    it("should delete patient successfully", async () => {
      // Crear paciente primero
      const testData = generateTestData("delete");
      const patientData = {
        name: testData.name,
        email: testData.email,
        phone: "123-456-7890",
        dateOfBirth: "1990-01-01",
        psychologistEmail: authenticatedUser?.email || "test@example.com",
      };

      const createResponse = await server.request(
        "/api/patients",
        createApiRequest("POST", patientData, authCookies),
      );
      const createdPatient = await createResponse.json();

      // Eliminar paciente
      const response = await server.request(
        `/api/patients/${createdPatient.patient.id}`,
        createApiRequest("DELETE", undefined, authCookies),
      );

      assertEquals(response.status, 200);
      const data = await response.json();
      assertApiResponse(data, ["success"]);
      assertEquals(data.success, true);

      // Verificar que el paciente fue eliminado
      const getResponse = await server.request(
        `/api/patients/${createdPatient.patient.id}`,
        createApiRequest("GET", undefined, authCookies),
      );
      assertEquals(getResponse.status, 404);
    });

    it("should return 404 when deleting non-existent patient", async () => {
      const response = await server.request(
        "/api/patients/non-existent-id",
        createApiRequest("DELETE", undefined, authCookies),
      );

      assertEquals(response.status, 404);
      const data = await response.json();
      assertApiError(data);
    });
  });

  describe("GET /api/patients/by-psychologist/[email]", () => {
    it("should return patients for specific psychologist", async () => {
      const psychologistEmail = authenticatedUser?.email || "test@example.com";

      // Crear pacientes para el psicólogo
      const testData1 = generateTestData("psych1");
      const testData2 = generateTestData("psych2");

      const patient1 = {
        name: testData1.name,
        email: testData1.email,
        phone: "123-456-7890",
        dateOfBirth: "1990-01-01",
        psychologistEmail,
      };

      const patient2 = {
        name: testData2.name,
        email: testData2.email,
        phone: "098-765-4321",
        dateOfBirth: "1985-05-15",
        psychologistEmail,
      };

      await server.request(
        "/api/patients",
        createApiRequest("POST", patient1, authCookies),
      );
      await server.request(
        "/api/patients",
        createApiRequest("POST", patient2, authCookies),
      );

      // Obtener pacientes del psicólogo
      const response = await server.request(
        `/api/patients/by-psychologist/${
          encodeURIComponent(
            psychologistEmail,
          )
        }`,
        createApiRequest("GET", undefined, authCookies),
      );

      assertEquals(response.status, 200);
      const data = await response.json();
      assertApiResponse(data, ["success", "patients"]);
      assertEquals(data.success, true);
      assertEquals(Array.isArray(data.patients), true);
      assertEquals(data.patients.length, 2);

      // Verificar que todos los pacientes pertenecen al psicólogo
      data.patients.forEach((patient: Record<string, unknown>) => {
        assertEquals(patient.psychologistEmail, psychologistEmail);
      });
    });

    it("should return empty list for psychologist with no patients", async () => {
      const response = await server.request(
        "/api/patients/by-psychologist/nopatientspsych@example.com",
        createApiRequest("GET", undefined, authCookies),
      );

      assertEquals(response.status, 200);
      const data = await response.json();
      assertApiResponse(data, ["success", "patients"]);
      assertEquals(data.success, true);
      assertEquals(data.patients.length, 0);
    });
  });
});
