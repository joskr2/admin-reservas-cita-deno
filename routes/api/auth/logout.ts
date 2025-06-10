import type { Handlers } from "$fresh/server.ts";
import { deleteCookie, getCookies } from "$std/http/cookie.ts";

export const handler: Handlers = {
  async GET(req) {
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
  },
};
