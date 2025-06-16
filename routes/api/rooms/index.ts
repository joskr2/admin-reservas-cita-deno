import { type FreshContext } from "$fresh/server.ts";
import { type AppState } from "../../../types/index.ts";
import { getRoomRepository } from "../../../lib/database/index.ts";

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verificar autenticación
  const currentUser = ctx.state.user;
  if (!currentUser) {
    return new Response(JSON.stringify({ error: "No autenticado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const roomRepository = getRoomRepository();
    const rooms = await roomRepository.getAll();

    return new Response(
      JSON.stringify({
        success: true,
        rooms: rooms,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error interno del servidor",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
