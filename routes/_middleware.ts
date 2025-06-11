import type { FreshContext } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import type { AppState, SessionUser } from "../types/index.ts";

// Lista de rutas que requieren autenticación
const PROTECTED_ROUTES = ["/dashboard", "/profiles", "/appointments"];

// Lista de rutas que requieren rol de superadmin
const SUPERADMIN_ROUTES = ["/profiles", "/admin"];

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  const url = new URL(req.url);
  const { pathname } = url;

  // Si la ruta es para archivos estáticos, omitir lógica del middleware
  if (
    pathname.startsWith("/css") ||
    pathname.startsWith("/js") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/static")
  ) {
    return await ctx.next();
  }

  // --- Lógica de Validación de Sesión ---
  const cookies = getCookies(req.headers);
  const sessionId = cookies.auth_session;

  ctx.state.user = null; // Por defecto no hay usuario

  if (sessionId) {
    const kv = await Deno.openKv();
    try {
      const sessionEntry = await kv.get(["sessions", sessionId]);

      if (sessionEntry.value) {
        // Si la sesión es válida, obtener la clave primaria del usuario
        const userKey = sessionEntry.value as Deno.KvKey;
        const userResult = await kv.get(userKey);

        if (userResult.value) {
          // Almacenar información del usuario en el estado del contexto
          const userData = userResult.value as { email: string; role: string };
          ctx.state.user = {
            email: userData.email,
            role: userData.role as SessionUser["role"],
          };
        }
      }
    } catch (error) {
      console.error("Error validating session:", error);
      // En caso de error, continuar sin usuario autenticado
    } finally {
      await kv.close();
    }
  }

  const isAuthenticated = ctx.state.user !== null;
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isSuperadminRoute = SUPERADMIN_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // --- Lógica de Redirección ---

  // 1. Si el usuario no está autenticado y trata de acceder a una ruta protegida
  if (!isAuthenticated && isProtectedRoute) {
    // Redirigir a la página de login, preservando el destino original
    const redirectUrl = new URL("/login", url.origin);
    redirectUrl.searchParams.set("from", pathname);
    return Response.redirect(redirectUrl, 307); // Redirección temporal
  }

  // 2. Si el usuario está autenticado pero no es superadmin y trata de acceder a rutas de superadmin
  if (
    isAuthenticated &&
    isSuperadminRoute &&
    ctx.state.user?.role !== "superadmin"
  ) {
    // Redirigir al dashboard con mensaje de error
    const redirectUrl = new URL("/dashboard", url.origin);
    redirectUrl.searchParams.set("error", "access_denied");
    return Response.redirect(redirectUrl, 403); // Prohibido
  }

  // 3. Si el usuario está autenticado y trata de acceder a la página de login
  if (isAuthenticated && pathname === "/login") {
    // Redirigir a su dashboard
    return Response.redirect(new URL("/dashboard", url.origin), 303); // Ver Otro
  }

  // Si ninguna de las condiciones anteriores se cumple, proceder con la solicitud
  return await ctx.next();
}
