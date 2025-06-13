// tests/performance/load.test.ts - Tests de performance y carga
import { assertEquals, assert } from "$std/testing/asserts.ts";
import { describe, it, beforeEach, afterEach } from "$std/testing/bdd.ts";
import {
  createTestServer,
  createApiRequest,
  authenticateUser,
  cleanupTestData,
  generateTestData,
  delay,
  type TestServer,
} from "../helpers/integration.ts";

describe("Performance and Load Tests", () => {
  let server: TestServer;
  let authCookies: Record<string, string>;

  beforeEach(async () => {
    await cleanupTestData();
    server = await createTestServer();

    try {
      const auth = await authenticateUser(server);
      authCookies = auth.cookies;
    } catch (error) {
      console.warn("Could not authenticate user for performance tests:", error);
      authCookies = {};
    }
  });

  afterEach(async () => {
    await server.close();
    await cleanupTestData();
  });

  describe("Response Time Tests", () => {
    it("should respond to GET /api/patients within acceptable time", async () => {
      const startTime = performance.now();

      const response = await server.request(
        "/api/patients",
        createApiRequest("GET", undefined, authCookies)
      );

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      assertEquals(response.status, 200);
      assert(
        responseTime < 1000,
        `Response time ${responseTime}ms exceeds 1000ms threshold`
      );
    });

    it("should handle patient creation within acceptable time", async () => {
      const testData = generateTestData("perf");
      const patientData = {
        name: testData.name,
        email: testData.email,
        phone: "123-456-7890",
        dateOfBirth: "1990-01-01",
        psychologistEmail: "test@example.com",
      };

      const startTime = performance.now();

      const response = await server.request(
        "/api/patients",
        createApiRequest("POST", patientData, authCookies)
      );

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      assertEquals(response.status, 201);
      assert(
        responseTime < 2000,
        `Creation time ${responseTime}ms exceeds 2000ms threshold`
      );
    });
  });

  describe("Concurrent Request Tests", () => {
    it("should handle multiple concurrent GET requests", async () => {
      const concurrentRequests = 10;
      const promises: Promise<Response>[] = [];

      const startTime = performance.now();

      // Crear múltiples requests concurrentes
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          server.request(
            "/api/patients",
            createApiRequest("GET", undefined, authCookies)
          )
        );
      }

      const responses = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Verificar que todas las respuestas fueron exitosas
      responses.forEach((response, index) => {
        assertEquals(response.status, 200, `Request ${index} failed`);
      });

      // Verificar que el tiempo total es razonable
      assert(
        totalTime < 5000,
        `Total time ${totalTime}ms for ${concurrentRequests} requests exceeds 5000ms`
      );

      console.log(
        `✅ ${concurrentRequests} concurrent requests completed in ${totalTime.toFixed(
          2
        )}ms`
      );
    });

    it("should handle concurrent patient creation without conflicts", async () => {
      const concurrentCreations = 5;
      const promises: Promise<Response>[] = [];

      // Crear múltiples pacientes concurrentemente con emails únicos
      for (let i = 0; i < concurrentCreations; i++) {
        const testData = generateTestData(`concurrent${i}`);
        const patientData = {
          name: testData.name,
          email: testData.email,
          phone: `123-456-789${i}`,
          dateOfBirth: "1990-01-01",
          psychologistEmail: "test@example.com",
        };

        promises.push(
          server.request(
            "/api/patients",
            createApiRequest("POST", patientData, authCookies)
          )
        );
      }

      const responses = await Promise.all(promises);

      // Verificar que todas las creaciones fueron exitosas
      responses.forEach((response, index) => {
        assertEquals(response.status, 201, `Patient creation ${index} failed`);
      });

      // Verificar que se crearon todos los pacientes
      const listResponse = await server.request(
        "/api/patients",
        createApiRequest("GET", undefined, authCookies)
      );
      const data = await listResponse.json();
      assertEquals(data.patients.length, concurrentCreations);

      console.log(
        `✅ ${concurrentCreations} concurrent patient creations completed successfully`
      );
    });
  });

  describe("Memory and Resource Tests", () => {
    it("should handle large patient list without memory issues", async () => {
      const patientCount = 50;
      const batchSize = 10;

      console.log(
        `Creating ${patientCount} patients in batches of ${batchSize}...`
      );

      // Crear pacientes en lotes para evitar sobrecargar el servidor
      for (let batch = 0; batch < patientCount / batchSize; batch++) {
        const batchPromises: Promise<Response>[] = [];

        for (let i = 0; i < batchSize; i++) {
          const patientIndex = batch * batchSize + i;
          const testData = generateTestData(`bulk${patientIndex}`);
          const patientData = {
            name: testData.name,
            email: testData.email,
            phone: `123-456-${patientIndex.toString().padStart(4, "0")}`,
            dateOfBirth: "1990-01-01",
            psychologistEmail: "test@example.com",
          };

          batchPromises.push(
            server.request(
              "/api/patients",
              createApiRequest("POST", patientData, authCookies)
            )
          );
        }

        const batchResponses = await Promise.all(batchPromises);

        // Verificar que todas las creaciones del lote fueron exitosas
        batchResponses.forEach((response, index) => {
          assertEquals(
            response.status,
            201,
            `Batch ${batch}, patient ${index} creation failed`
          );
        });

        // Pequeña pausa entre lotes
        await delay(100);
      }

      // Verificar que se pueden obtener todos los pacientes
      const startTime = performance.now();
      const listResponse = await server.request(
        "/api/patients",
        createApiRequest("GET", undefined, authCookies)
      );
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      assertEquals(listResponse.status, 200);
      const data = await listResponse.json();
      assertEquals(data.patients.length, patientCount);

      // Verificar que el tiempo de respuesta sigue siendo aceptable
      assert(
        responseTime < 3000,
        `Large list response time ${responseTime}ms exceeds 3000ms threshold`
      );

      console.log(
        `✅ Retrieved ${patientCount} patients in ${responseTime.toFixed(2)}ms`
      );
    });
  });

  describe("Rate Limiting and Throttling Tests", () => {
    it("should handle rapid successive requests gracefully", async () => {
      const rapidRequests = 20;
      const requestInterval = 50; // ms entre requests
      const responses: Response[] = [];

      console.log(
        `Making ${rapidRequests} rapid requests with ${requestInterval}ms intervals...`
      );

      for (let i = 0; i < rapidRequests; i++) {
        const response = await server.request(
          "/api/patients",
          createApiRequest("GET", undefined, authCookies)
        );

        responses.push(response);

        // Verificar que no hay errores de servidor
        assert(
          response.status < 500,
          `Server error on request ${i}: ${response.status}`
        );

        if (i < rapidRequests - 1) {
          await delay(requestInterval);
        }
      }

      // Contar respuestas exitosas vs rate limited
      const successfulResponses = responses.filter(
        (r) => r.status === 200
      ).length;
      const rateLimitedResponses = responses.filter(
        (r) => r.status === 429
      ).length;

      console.log(
        `✅ ${successfulResponses} successful, ${rateLimitedResponses} rate limited`
      );

      // Al menos algunas respuestas deberían ser exitosas
      assert(successfulResponses > 0, "No successful responses received");
    });
  });

  describe("Database Performance Tests", () => {
    it("should handle complex queries efficiently", async () => {
      // Crear algunos pacientes para diferentes psicólogos
      const psychologists = [
        "psych1@example.com",
        "psych2@example.com",
        "psych3@example.com",
      ];
      const patientsPerPsychologist = 10;

      console.log(
        `Creating ${patientsPerPsychologist} patients for ${psychologists.length} psychologists...`
      );

      for (const psychEmail of psychologists) {
        for (let i = 0; i < patientsPerPsychologist; i++) {
          const testData = generateTestData(`${psychEmail}-${i}`);
          const patientData = {
            name: testData.name,
            email: testData.email,
            phone: `123-456-${i.toString().padStart(4, "0")}`,
            dateOfBirth: "1990-01-01",
            psychologistEmail: psychEmail,
          };

          await server.request(
            "/api/patients",
            createApiRequest("POST", patientData, authCookies)
          );
        }
      }

      // Probar consultas por psicólogo
      for (const psychEmail of psychologists) {
        const startTime = performance.now();

        const response = await server.request(
          `/api/patients/by-psychologist/${encodeURIComponent(psychEmail)}`,
          createApiRequest("GET", undefined, authCookies)
        );

        const endTime = performance.now();
        const queryTime = endTime - startTime;

        assertEquals(response.status, 200);
        const data = await response.json();
        assertEquals(data.patients.length, patientsPerPsychologist);

        assert(
          queryTime < 1000,
          `Query time ${queryTime}ms for psychologist ${psychEmail} exceeds 1000ms`
        );

        console.log(
          `✅ Query for ${psychEmail}: ${
            data.patients.length
          } patients in ${queryTime.toFixed(2)}ms`
        );
      }
    });
  });

  describe("Error Recovery Tests", () => {
    it("should recover gracefully from invalid requests", async () => {
      const invalidRequests = [
        { path: "/api/patients", method: "POST", body: "invalid json" },
        { path: "/api/patients/invalid-id", method: "GET", body: undefined },
        { path: "/api/patients", method: "POST", body: {} },
        {
          path: "/api/patients/123",
          method: "PUT",
          body: { invalidField: "value" },
        },
      ];

      for (const [index, { path, method, body }] of invalidRequests.entries()) {
        const requestInit: RequestInit = {
          method,
          headers: {
            "Content-Type": "application/json",
            ...authCookies,
          },
        };

        if (body) {
          requestInit.body =
            typeof body === "string" ? body : JSON.stringify(body);
        }

        const response = await server.request(path, requestInit);

        // Verificar que el servidor maneja el error apropiadamente
        assert(
          response.status >= 400 && response.status < 500,
          `Invalid request ${index} should return 4xx status, got ${response.status}`
        );

        // Verificar que el servidor sigue funcionando después del error
        const healthCheck = await server.request(
          "/api/patients",
          createApiRequest("GET", undefined, authCookies)
        );
        assertEquals(
          healthCheck.status,
          200,
          `Server not responding after invalid request ${index}`
        );
      }

      console.log(
        `✅ Server recovered gracefully from ${invalidRequests.length} invalid requests`
      );
    });
  });
});
