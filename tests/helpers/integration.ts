// tests/helpers/integration.ts - Helper para tests de integración
import { createHandler } from "$fresh/server.ts";
import manifest from "../../fresh.gen.ts";
import { testUtils } from "../setup.ts";
import type { User } from "../../types/index.ts";

export interface TestServer {
  server: Deno.HttpServer;
  baseUrl: string;
  request: (path: string, init?: RequestInit) => Promise<Response>;
  close: () => Promise<void>;
}

/**
 * Crea un servidor de pruebas para tests de integración
 */
export async function createTestServer(): Promise<TestServer> {
  const handler = await createHandler(manifest);

  // Usar puerto 0 para obtener un puerto disponible automáticamente
  const server = Deno.serve({
    port: 0,
    hostname: "127.0.0.1",
    handler,
  });

  const { port } = server.addr as Deno.NetAddr;
  const baseUrl = `http://127.0.0.1:${port}`;

  return {
    server,
    baseUrl,
    request: async (path: string, init?: RequestInit) => {
      const url = `${baseUrl}${path}`;
      return await fetch(url, init);
    },
    close: async () => {
      await server.shutdown();
    },
  };
}

/**
 * Helper para crear requests con headers comunes
 */
export function createApiRequest(
  method: string,
  body?: unknown,
  headers: Record<string, string> = {}
): RequestInit {
  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body) {
    init.body = JSON.stringify(body);
  }

  return init;
}

/**
 * Helper para extraer cookies de una respuesta
 */
export function extractCookies(response: Response): Record<string, string> {
  const cookies: Record<string, string> = {};
  const setCookieHeaders = response.headers.getSetCookie();

  for (const cookie of setCookieHeaders) {
    const [nameValue] = cookie.split(";");
    if (nameValue) {
      const [name, value] = nameValue.split("=");
      if (name && value) {
        cookies[name.trim()] = value.trim();
      }
    }
  }

  return cookies;
}

/**
 * Helper para crear headers con cookies
 */
export function createCookieHeaders(
  cookies: Record<string, string>
): Record<string, string> {
  const cookieString = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");

  return cookieString ? { Cookie: cookieString } : {};
}

/**
 * Helper para autenticar un usuario en tests
 */
export async function authenticateUser(
  server: TestServer,
  email: string = "admin@horizonte.com",
  password: string = "password123"
): Promise<{ cookies: Record<string, string>; user: User }> {
  // Crear el usuario de prueba directamente en la base de datos de test
  const kv = await Deno.openKv();

  // Importar hash function
  const { hash } = await import("../../lib/crypto.ts");

  const passwordHash = await hash(password);
  const testUser: User = {
    id: crypto.randomUUID(),
    email,
    passwordHash,
    role: "superadmin",
    name: "Test Admin",
    createdAt: new Date().toISOString(),
    isActive: true,
    // Additional fields for psychologists (optional for superadmin but included for completeness)
    dni: "00000000",
    specialty: "Administración",
    customSpecialty: undefined,
    licenseNumber: "ADMIN-001",
    phone: "+1000000000",
    education: "Administración de Sistemas de Salud",
    experienceYears: 10,
    bio: "Administrador del sistema con experiencia en gestión de clínicas.",
  };

  // Guardar usuario en la base de datos de test
  await kv.set(["users", email], testUser);
  await kv.close();

  // Intentar login
  const loginResponse = await server.request(
    "/api/auth/login",
    createApiRequest("POST", { email, password })
  );

  if (!loginResponse.ok) {
    const errorText = await loginResponse.text();
    throw new Error(
      `Failed to authenticate user: ${loginResponse.status} - ${errorText}`
    );
  }

  const cookies = extractCookies(loginResponse);
  const userData = await loginResponse.json();

  if (!userData.success) {
    throw new Error(`Authentication failed: ${userData.error}`);
  }

  return { cookies, user: userData.user };
}

/**
 * Helper para limpiar datos de prueba
 */
export async function cleanupTestData(): Promise<void> {
  try {
    const kv = await Deno.openKv();

    // Limpiar todas las claves de prueba
    const prefixes = [
      ["users"],
      ["patients"],
      ["appointments"],
      ["rooms"],
      ["sessions"],
    ];

    for (const prefix of prefixes) {
      const iter = kv.list({ prefix });
      for await (const entry of iter) {
        await kv.delete(entry.key);
      }
    }

    await kv.close();
  } catch (error) {
    console.warn("Error cleaning up test data:", error);
  }
}

/**
 * Helper para verificar estructura de respuesta de API
 */
export function assertApiResponse(
  response: Record<string, unknown>,
  expectedKeys: string[] = ["success"]
): void {
  if (typeof response !== "object" || response === null) {
    throw new Error("Response is not an object");
  }

  for (const key of expectedKeys) {
    if (!(key in response)) {
      throw new Error(`Missing key '${key}' in API response`);
    }
  }
}

/**
 * Helper para verificar errores de API
 */
export function assertApiError(
  response: Record<string, unknown>,
  expectedErrorCode?: string
): void {
  assertApiResponse(response, ["success", "error"]);

  if (response.success !== false) {
    throw new Error("Expected API error response");
  }

  if (expectedErrorCode && response.error !== expectedErrorCode) {
    throw new Error(
      `Expected error code '${expectedErrorCode}', got '${response.error}'`
    );
  }
}

/**
 * Helper para esperar un tiempo determinado (útil para tests de rate limiting)
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper para generar datos de prueba únicos
 */
export function generateTestData(prefix: string = "test"): {
  email: string;
  name: string;
  id: string;
} {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);

  return {
    email: `${prefix}-${timestamp}-${random}@example.com`,
    name: `${prefix} User ${timestamp}`,
    id: `${prefix}-${timestamp}-${random}`,
  };
}

/**
 * Helper para limpiar recursos después de los tests
 */
export async function cleanupTestResources() {
  try {
    // Cerrar conexiones KV abiertas
    const kv = await Deno.openKv();
    kv.close();
  } catch (error) {
    // Ignorar errores de limpieza
    console.warn(
      "Warning during cleanup:",
      error instanceof Error ? error.message : String(error)
    );
  }
}
