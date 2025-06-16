// tests/unit/repositories/session.test.ts - Tests unitarios para SessionRepository
import { assert, assertEquals, assertRejects } from "$std/testing/asserts.ts";
import { beforeEach, describe, it } from "$std/testing/bdd.ts";
import { SessionRepository } from "../../../lib/database/repositories/session.ts";
import type { IDatabaseConnection } from "../../../lib/database/interfaces.ts";
import { DatabaseConnection } from "../../../lib/database/connection.ts";
import { testUtils } from "../../setup.ts";

describe("SessionRepository", () => {
  let sessionRepository: SessionRepository;
  let mockConnection: IDatabaseConnection;
  let connection: DatabaseConnection;

  beforeEach(async () => {
    // Limpiar datos de prueba antes de cada test
    await testUtils.cleanupTestData();

    // Mock de IDatabaseConnection
    const mockKv = {
      get: () => Promise.resolve({ key: [], value: null, versionstamp: "" }),
      set: () => Promise.resolve({ ok: true, versionstamp: "" }),
      delete: () => Promise.resolve(),
      list: () => ({
        [Symbol.asyncIterator]: () => ({
          next: () => Promise.resolve({ done: true, value: undefined }),
        }),
      }),
      close: () => {},
      atomic: () => ({
        check: () => ({}),
        mutate: () => ({}),
        sum: () => ({}),
        max: () => ({}),
        min: () => ({}),
        set: () => ({}),
        delete: () => ({}),
        enqueue: () => ({}),
        commit: () => Promise.resolve({ ok: true, versionstamp: "" }),
      }),
      watch: () => ({
        [Symbol.asyncIterator]: () => ({
          next: () => Promise.resolve({ done: true, value: undefined }),
        }),
      }),
      enqueue: () => Promise.resolve({ ok: true }),
      listenQueue: () => Promise.resolve(),
    } as unknown as Deno.Kv;

    mockConnection = {
      getInstance: () => Promise.resolve(mockKv),
      close: () => {},
    };

    connection = DatabaseConnection.getInstance();
    sessionRepository = new SessionRepository(connection);
  });

  describe("createSession", () => {
    it("should create session successfully", async () => {
      const sessionId = "session-123";
      const userEmail = "test@example.com";

      // createSession retorna void, no un objeto
      await sessionRepository.createSession(sessionId, userEmail);

      // Verificar que no lanza error
      assert(true);
    });

    it("should reject invalid session ID", async () => {
      await assertRejects(
        () => sessionRepository.createSession("", "test@example.com"),
        Error,
        "Invalid sessionId provided to createSession",
      );
    });

    it("should reject invalid user email", async () => {
      const sessionId = "session-123";

      await assertRejects(
        () => sessionRepository.createSession(sessionId, ""),
        Error,
        "Invalid userEmail provided to createSession",
      );
    });

    it("should handle database errors", async () => {
      // Mock que simula error de base de datos
      const errorConnection: IDatabaseConnection = {
        getInstance: () => Promise.reject(new Error("Database error")),
        close: () => {},
      };

      const errorRepository = new SessionRepository(errorConnection);

      await assertRejects(
        () => errorRepository.createSession("session-123", "test@example.com"),
        Error,
        "Database error",
      );
    });
  });

  describe("getSession", () => {
    it("should return session when found", async () => {
      const sessionId = "session-123";
      const mockSessionData = {
        userEmail: "test@example.com",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      // Mock que retorna la sesión
      const mockKvWithSession = {
        get: () =>
          Promise.resolve({
            key: ["sessions", sessionId],
            value: mockSessionData,
            versionstamp: "123",
          }),
      } as unknown as Deno.Kv;

      const connectionWithSession: IDatabaseConnection = {
        getInstance: () => Promise.resolve(mockKvWithSession),
        close: () => {},
      };

      const repositoryWithSession = new SessionRepository(
        connectionWithSession,
      );
      const result = await repositoryWithSession.getSession(sessionId);

      assertEquals(result?.userEmail, "test@example.com");
    });

    it("should return null when session not found", async () => {
      const result = await sessionRepository.getSession("non-existent-session");
      assertEquals(result, null);
    });

    it("should return null for expired sessions", async () => {
      const sessionId = "expired-session";
      const expiredSessionData = {
        userEmail: "test@example.com",
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Expirada
      };

      // Mock que retorna sesión expirada
      const mockKvWithExpired = {
        get: () =>
          Promise.resolve({
            key: ["sessions", sessionId],
            value: expiredSessionData,
            versionstamp: "123",
          }),
        delete: () => Promise.resolve(),
      } as unknown as Deno.Kv;

      const connectionWithExpired: IDatabaseConnection = {
        getInstance: () => Promise.resolve(mockKvWithExpired),
        close: () => {},
      };

      const repositoryWithExpired = new SessionRepository(
        connectionWithExpired,
      );
      const result = await repositoryWithExpired.getSession(sessionId);

      assertEquals(result, null);
    });

    it("should handle database errors gracefully", async () => {
      const errorConnection: IDatabaseConnection = {
        getInstance: () =>
          Promise.reject(new Error("Database connection failed")),
        close: () => {},
      };

      const errorRepository = new SessionRepository(errorConnection);
      const result = await errorRepository.getSession("session-123");

      assertEquals(result, null);
    });
  });

  describe("deleteSession", () => {
    it("should delete session successfully", async () => {
      const sessionId = "session-to-delete";

      // deleteSession retorna void
      await sessionRepository.deleteSession(sessionId);

      // Verificar que no lanza error
      assert(true);
    });

    it("should handle non-existent session deletion", async () => {
      const sessionId = "non-existent-session";

      // No debería lanzar error
      await sessionRepository.deleteSession(sessionId);
      assert(true);
    });

    it("should handle invalid session ID gracefully", async () => {
      // No debería lanzar error
      await sessionRepository.deleteSession("");
      assert(true);
    });
  });

  describe("cleanExpiredSessions", () => {
    it("should clean expired sessions successfully", async () => {
      const expiredSessionData = {
        userEmail: "test@example.com",
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Expirada
      };

      const mockKvWithExpired = {
        list: () => ({
          [Symbol.asyncIterator]: () => {
            let returned = false;
            return {
              next: () => {
                if (!returned) {
                  returned = true;
                  return Promise.resolve({
                    done: false,
                    value: {
                      key: ["sessions", "expired-session"],
                      value: expiredSessionData,
                      versionstamp: "123",
                    },
                  });
                }
                return Promise.resolve({ done: true, value: undefined });
              },
            };
          },
        }),
        delete: () => Promise.resolve(),
      } as unknown as Deno.Kv;

      const connectionWithExpired: IDatabaseConnection = {
        getInstance: () => Promise.resolve(mockKvWithExpired),
        close: () => {},
      };

      const repositoryWithExpired = new SessionRepository(
        connectionWithExpired,
      );

      // cleanExpiredSessions retorna void
      await repositoryWithExpired.cleanExpiredSessions();
      assert(true);
    });

    it("should handle cleanup errors gracefully", async () => {
      const errorConnection: IDatabaseConnection = {
        getInstance: () => Promise.reject(new Error("List failed")),
        close: () => {},
      };

      const errorRepository = new SessionRepository(errorConnection);

      // No debería lanzar error, solo loggear
      await errorRepository.cleanExpiredSessions();
      assert(true);
    });
  });

  describe("extendSession", () => {
    it("should extend session successfully", async () => {
      const sessionId = "session-123";
      const sessionData = {
        userEmail: "test@example.com",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const mockKvWithSession = {
        get: () =>
          Promise.resolve({
            key: ["sessions", sessionId],
            value: sessionData,
            versionstamp: "123",
          }),
        set: () => Promise.resolve({ ok: true, versionstamp: "" }),
      } as unknown as Deno.Kv;

      const connectionWithSession: IDatabaseConnection = {
        getInstance: () => Promise.resolve(mockKvWithSession),
        close: () => {},
      };

      const repositoryWithSession = new SessionRepository(
        connectionWithSession,
      );
      const result = await repositoryWithSession.extendSession(sessionId, 14);

      assertEquals(result, true);
    });

    it("should return false for non-existent session", async () => {
      const result = await sessionRepository.extendSession(
        "non-existent-session",
      );
      assertEquals(result, false);
    });
  });

  describe("getAllActiveSessions", () => {
    it("should return active sessions", async () => {
      const sessionData = {
        userEmail: "test@example.com",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const mockKvWithSessions = {
        list: () => ({
          [Symbol.asyncIterator]: () => {
            let returned = false;
            return {
              next: () => {
                if (!returned) {
                  returned = true;
                  return Promise.resolve({
                    done: false,
                    value: {
                      key: ["sessions", "session-1"],
                      value: sessionData,
                      versionstamp: "123",
                    },
                  });
                }
                return Promise.resolve({ done: true, value: undefined });
              },
            };
          },
        }),
      } as unknown as Deno.Kv;

      const connectionWithSessions: IDatabaseConnection = {
        getInstance: () => Promise.resolve(mockKvWithSessions),
        close: () => {},
      };

      const repositoryWithSessions = new SessionRepository(
        connectionWithSessions,
      );
      const result = await repositoryWithSessions.getAllActiveSessions();

      assertEquals(result.length, 1);
      assertEquals(result[0]!.sessionId, "session-1");
      assertEquals(result[0]!.session.userEmail, "test@example.com");
    });

    it("should return empty array when no sessions found", async () => {
      const result = await sessionRepository.getAllActiveSessions();
      assertEquals(result.length, 0);
    });

    it("should handle database errors gracefully", async () => {
      const errorConnection: IDatabaseConnection = {
        getInstance: () => Promise.reject(new Error("Database error")),
        close: () => {},
      };

      const errorRepository = new SessionRepository(errorConnection);
      const result = await errorRepository.getAllActiveSessions();

      assertEquals(result.length, 0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle malformed session data", async () => {
      const mockKvWithBadData = {
        get: () =>
          Promise.resolve({
            key: ["sessions", "bad-session"],
            value: { invalid: "data" },
            versionstamp: "123",
          }),
      } as unknown as Deno.Kv;

      const connectionWithBadData: IDatabaseConnection = {
        getInstance: () => Promise.resolve(mockKvWithBadData),
        close: () => {},
      };

      const repositoryWithBadData = new SessionRepository(
        connectionWithBadData,
      );
      const result = await repositoryWithBadData.getSession("bad-session");

      // Debería manejar datos malformados gracefully
      assertEquals(result, null);
    });

    it("should handle concurrent session operations", async () => {
      const sessionId = "concurrent-session";
      const userEmail = "test@example.com";

      // Simular operaciones concurrentes
      const promises = [
        sessionRepository.createSession(sessionId + "-1", userEmail),
        sessionRepository.createSession(sessionId + "-2", userEmail),
        sessionRepository.createSession(sessionId + "-3", userEmail),
      ];

      // No debería lanzar errores
      await Promise.all(promises);
      assert(true);
    });
  });
});
