import { deleteCookie } from "$std/http/cookie.ts";

export function GET(_req: Request): Response {
  const response = new Response(
    JSON.stringify({
      success: true,
      message: "Cookies cleared successfully",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );

  // Eliminar todas las cookies relacionadas con autenticación
  deleteCookie(response.headers, "auth_session", { path: "/" });
  deleteCookie(response.headers, "session", { path: "/" });

  return response;
}
