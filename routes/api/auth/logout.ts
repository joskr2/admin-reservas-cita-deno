/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />
import type { Handlers } from "$fresh/server.ts";
import { deleteCookie, getCookies } from "$std/http/cookie.ts";

// Función común para manejar el logout
async function handleLogout(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const cookies = getCookies(req.headers);
  const sessionId = cookies.auth_session;

  const headers = new Headers();

  if (sessionId) {
    const kv = await Deno.openKv();
    await kv.delete(["sessions", sessionId]);
    kv.close();

    // Instruct the browser to delete the session cookie
    deleteCookie(headers, "auth_session", {
      path: "/",
      // The domain must match the one used to set the cookie
      domain: url.hostname,
    });
  }

  // Redirect to the homepage after logout
  headers.set("location", "/");
  return new Response(null, {
    status: 303, // See Other
    headers,
  });
}

export const handler: Handlers = {
  // Mantener GET para compatibilidad con enlaces directos
  async GET(req) {
    return await handleLogout(req);
  },

  // Agregar POST para formularios (como el que tenemos en el header)
  async POST(req) {
    return await handleLogout(req);
  },
};
