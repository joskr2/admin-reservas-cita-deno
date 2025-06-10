import type { FreshContext } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";

// Define the shape of the user data we'll store in the context state
interface User {
  email: string;
  role: string;
}

// Define the application state, which will include the user if logged in
export interface AppState {
  user: User | null;
}

// List of routes that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/profiles"];

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  const url = new URL(req.url);
  const { pathname } = url;

  // If the route is for static files, skip middleware logic.
  if (pathname.startsWith("/css") || pathname.startsWith("/favicon.ico")) {
    return await ctx.next();
  }

  // --- Session Validation Logic ---
  const cookies = getCookies(req.headers);
  const sessionId = cookies.auth_session;

  ctx.state.user = null; // Default to no user

  if (sessionId) {
    const kv = await Deno.openKv();
    const sessionEntry = await kv.get(["sessions", sessionId]);

    if (sessionEntry.value) {
      // If the session is valid, retrieve the user's primary key
      const userKey = sessionEntry.value as Deno.KvKey;
      const userResult = await kv.get(userKey);

      if (userResult.value) {
        // Store user info in the context state for access in other parts of the app
        const userData = userResult.value as { email: string; role: string };
        ctx.state.user = { email: userData.email, role: userData.role };
      }
    }
    kv.close();
  }

  const isAuthenticated = ctx.state.user !== null;
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // --- Redirection Logic ---

  // 1. If user is not authenticated and trying to access a protected route
  if (!isAuthenticated && isProtectedRoute) {
    // Redirect to login page, preserving the original destination for after login
    const redirectUrl = new URL("/login", url.origin);
    redirectUrl.searchParams.set("from", pathname);
    return Response.redirect(redirectUrl, 307); // Temporary Redirect
  }

  // 2. If user is authenticated and tries to access the login page
  if (isAuthenticated && pathname === "/login") {
    // Redirect to their dashboard
    return Response.redirect(new URL("/dashboard", url.origin), 303); // See Other
  }

  // If none of the above conditions are met, proceed with the request
  return await ctx.next();
}
