// tests/integration/api/rooms.test.ts - Tests de integración para API de salas
import { assertEquals, assertExists } from "$std/testing/asserts.ts";
import { afterEach, beforeEach, describe, it } from "$std/testing/bdd.ts";
import {
  authenticateUser,
  cleanupTestData,
  cleanupTestResources,
  createApiRequest,
  createTestServer,
  type TestServer,
} from "../../helpers/integration.ts";
import type { Room } from "../../../types/index.ts";

describe("Rooms API Integration Tests", () => {
  let testServer: TestServer;
  let adminCookies: Record<string, string>;

  beforeEach(async () => {
    // Limpiar datos de prueba
    await cleanupTestData();

    // Crear servidor de pruebas
    testServer = await createTestServer();

    // Autenticar como admin
    const authResult = await authenticateUser(
      testServer,
      "admin@horizonte.com",
      "admin123",
    );
    adminCookies = authResult.cookies;
  });

  afterEach(async () => {
    if (testServer) {
      await testServer.close();
    }
    await cleanupTestData();
    await cleanupTestResources();
  });

  describe("GET /api/rooms", () => {
    it("should return list of rooms", async () => {
      const response = await testServer.request("/api/rooms", {
        headers: {
          Cookie: Object.entries(adminCookies)
            .map(([key, value]) => `${key}=${value}`)
            .join("; "),
        },
      });

      assertEquals(response.status, 200);

      const data = await response.json();
      assertExists(data.rooms);
      assertEquals(Array.isArray(data.rooms), true);
    });

    it("should handle unauthorized access", async () => {
      const response = await testServer.request("/api/rooms");

      // Debería redirigir al login o devolver 401
      assertEquals(response.status === 401 || response.status === 302, true);
    });
  });

  describe("POST /api/rooms/create", () => {
    it("should create room successfully", async () => {
      const roomData = {
        name: "Sala de Prueba",
        description: "Sala creada en test",
        capacity: 4,
        equipment: ["Sillas", "Mesa"],
        roomType: "individual",
      };

      const response = await testServer.request(
        "/api/rooms/create",
        createApiRequest("POST", roomData, {
          Cookie: Object.entries(adminCookies)
            .map(([key, value]) => `${key}=${value}`)
            .join("; "),
        }),
      );

      assertEquals(response.status, 201);

      const result = await response.json();
      assertEquals(result.success, true);
      assertExists(result.room);
      assertEquals(result.room.name, roomData.name);
    });

    it("should validate required fields", async () => {
      const invalidData = {
        description: "Solo descripción",
      };

      const response = await testServer.request(
        "/api/rooms/create",
        createApiRequest("POST", invalidData, {
          Cookie: Object.entries(adminCookies)
            .map(([key, value]) => `${key}=${value}`)
            .join("; "),
        }),
      );

      assertEquals(response.status, 400);

      const result = await response.json();
      assertEquals(result.success, false);
      assertExists(result.error);
    });

    it("should handle unauthorized creation", async () => {
      const roomData = {
        name: "Sala No Autorizada",
        capacity: 2,
      };

      const response = await testServer.request(
        "/api/rooms/create",
        createApiRequest("POST", roomData),
      );

      // Debería redirigir al login o devolver 401
      assertEquals(response.status === 401 || response.status === 302, true);
    });
  });

  describe("PUT /api/rooms/:id/update", () => {
    let testRoom: Room;

    beforeEach(async () => {
      // Crear una sala de prueba
      const roomData = {
        name: "Sala para Actualizar",
        description: "Sala que será actualizada",
        capacity: 2,
        equipment: ["Sillas"],
        roomType: "individual",
      };

      const createResponse = await testServer.request(
        "/api/rooms/create",
        createApiRequest("POST", roomData, {
          Cookie: Object.entries(adminCookies)
            .map(([key, value]) => `${key}=${value}`)
            .join("; "),
        }),
      );

      const createResult = await createResponse.json();
      testRoom = createResult.room;
    });

    it("should update room successfully", async () => {
      const updateData = {
        name: "Sala Actualizada",
        capacity: 6,
        equipment: ["Sillas", "Mesa", "Proyector"],
      };

      const response = await testServer.request(
        `/api/rooms/${testRoom.id}/update`,
        createApiRequest("PUT", updateData, {
          Cookie: Object.entries(adminCookies)
            .map(([key, value]) => `${key}=${value}`)
            .join("; "),
        }),
      );

      assertEquals(response.status, 200);

      const result = await response.json();
      assertEquals(result.success, true);
      assertExists(result.room);
      assertEquals(result.room.name, updateData.name);
      assertEquals(result.room.capacity, updateData.capacity);
    });

    it("should handle non-existent room", async () => {
      const updateData = {
        name: "Sala Inexistente",
      };

      const response = await testServer.request(
        "/api/rooms/non-existent-id/update",
        createApiRequest("PUT", updateData, {
          Cookie: Object.entries(adminCookies)
            .map(([key, value]) => `${key}=${value}`)
            .join("; "),
        }),
      );

      assertEquals(response.status, 404);

      const result = await response.json();
      assertEquals(result.success, false);
      assertExists(result.error);
    });

    it("should validate update data", async () => {
      const invalidData = {
        capacity: -1, // Capacidad inválida
      };

      const response = await testServer.request(
        `/api/rooms/${testRoom.id}/update`,
        createApiRequest("PUT", invalidData, {
          Cookie: Object.entries(adminCookies)
            .map(([key, value]) => `${key}=${value}`)
            .join("; "),
        }),
      );

      assertEquals(response.status, 400);

      const result = await response.json();
      assertEquals(result.success, false);
      assertExists(result.error);
    });
  });

  describe("POST /api/rooms/:id/toggle-availability", () => {
    let testRoom: Room;

    beforeEach(async () => {
      // Crear una sala de prueba
      const roomData = {
        name: "Sala para Toggle",
        description: "Sala para probar toggle",
        capacity: 2,
        equipment: ["Sillas"],
        roomType: "individual",
      };

      const createResponse = await testServer.request(
        "/api/rooms/create",
        createApiRequest("POST", roomData, {
          Cookie: Object.entries(adminCookies)
            .map(([key, value]) => `${key}=${value}`)
            .join("; "),
        }),
      );

      const createResult = await createResponse.json();
      testRoom = createResult.room;
    });

    it("should toggle room availability successfully", async () => {
      const initialAvailability = testRoom.isAvailable;

      const response = await testServer.request(
        `/api/rooms/${testRoom.id}/toggle-availability`,
        createApiRequest(
          "POST",
          {},
          {
            Cookie: Object.entries(adminCookies)
              .map(([key, value]) => `${key}=${value}`)
              .join("; "),
          },
        ),
      );

      assertEquals(response.status, 200);

      const result = await response.json();
      assertEquals(result.success, true);
      assertExists(result.room);
      assertEquals(result.room.isAvailable, !initialAvailability);
    });

    it("should handle non-existent room", async () => {
      const response = await testServer.request(
        "/api/rooms/non-existent-id/toggle-availability",
        createApiRequest(
          "POST",
          {},
          {
            Cookie: Object.entries(adminCookies)
              .map(([key, value]) => `${key}=${value}`)
              .join("; "),
          },
        ),
      );

      assertEquals(response.status, 404);

      const result = await response.json();
      assertEquals(result.success, false);
      assertExists(result.error);
    });

    it("should handle unauthorized access", async () => {
      const response = await testServer.request(
        `/api/rooms/${testRoom.id}/toggle-availability`,
        createApiRequest("POST", {}),
      );

      // Debería redirigir al login o devolver 401
      assertEquals(response.status === 401 || response.status === 302, true);
    });
  });

  describe("DELETE /api/rooms/:id/delete", () => {
    let testRoom: Room;

    beforeEach(async () => {
      // Crear una sala de prueba
      const roomData = {
        name: "Sala para Eliminar",
        description: "Sala que será eliminada",
        capacity: 2,
        equipment: ["Sillas"],
        roomType: "individual",
      };

      const createResponse = await testServer.request(
        "/api/rooms/create",
        createApiRequest("POST", roomData, {
          Cookie: Object.entries(adminCookies)
            .map(([key, value]) => `${key}=${value}`)
            .join("; "),
        }),
      );

      const createResult = await createResponse.json();
      testRoom = createResult.room;
    });

    it("should delete room successfully", async () => {
      const response = await testServer.request(
        `/api/rooms/${testRoom.id}/delete`,
        createApiRequest(
          "DELETE",
          {},
          {
            Cookie: Object.entries(adminCookies)
              .map(([key, value]) => `${key}=${value}`)
              .join("; "),
          },
        ),
      );

      assertEquals(response.status, 200);

      const result = await response.json();
      assertEquals(result.success, true);
      assertExists(result.message);
    });

    it("should handle non-existent room", async () => {
      const response = await testServer.request(
        "/api/rooms/non-existent-id/delete",
        createApiRequest(
          "DELETE",
          {},
          {
            Cookie: Object.entries(adminCookies)
              .map(([key, value]) => `${key}=${value}`)
              .join("; "),
          },
        ),
      );

      assertEquals(response.status, 404);

      const result = await response.json();
      assertEquals(result.success, false);
      assertExists(result.error);
    });

    it("should handle unauthorized deletion", async () => {
      const response = await testServer.request(
        `/api/rooms/${testRoom.id}/delete`,
        createApiRequest("DELETE", {}),
      );

      // Debería redirigir al login o devolver 401
      assertEquals(response.status === 401 || response.status === 302, true);
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed JSON requests", async () => {
      const response = await testServer.request("/api/rooms/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: Object.entries(adminCookies)
            .map(([key, value]) => `${key}=${value}`)
            .join("; "),
        },
        body: "invalid json",
      });

      assertEquals(response.status, 400);

      const result = await response.json();
      assertEquals(result.success, false);
      assertExists(result.error);
    });

    it("should handle missing content type", async () => {
      const response = await testServer.request("/api/rooms/create", {
        method: "POST",
        headers: {
          Cookie: Object.entries(adminCookies)
            .map(([key, value]) => `${key}=${value}`)
            .join("; "),
        },
        body: JSON.stringify({ name: "Test Room" }),
      });

      // Debería manejar la falta de Content-Type
      assertEquals(response.status >= 400, true);
    });

    it("should handle invalid HTTP methods", async () => {
      const response = await testServer.request(
        "/api/rooms/test-id/toggle-availability",
        {
          method: "GET", // Método incorrecto
          headers: {
            Cookie: Object.entries(adminCookies)
              .map(([key, value]) => `${key}=${value}`)
              .join("; "),
          },
        },
      );

      assertEquals(response.status, 405);
    });

    it("should handle CORS preflight requests", async () => {
      const response = await testServer.request(
        "/api/rooms/test-id/toggle-availability",
        {
          method: "OPTIONS",
        },
      );

      assertEquals(response.status, 200);
      assertExists(response.headers.get("Access-Control-Allow-Origin"));
    });
  });
});
