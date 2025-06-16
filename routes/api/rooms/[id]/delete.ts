import { type FreshContext } from "$fresh/server.ts";
import { type AppState, type RoomId } from "../../../../types/index.ts";
import { getRoomRepository } from "../../../../lib/database/index.ts";

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  if (req.method !== "DELETE") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verificar autenticación y permisos
  const currentUser = ctx.state.user;
  if (!currentUser) {
    return new Response(JSON.stringify({ error: "No autenticado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (currentUser.role !== "superadmin") {
    return new Response(JSON.stringify({ error: "Permisos insuficientes" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const roomId = ctx.params.id as RoomId;
    const roomRepository = getRoomRepository();

    // Verificar que la sala existe
    const existingRoom = await roomRepository.getById(roomId);
    if (!existingRoom) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Sala no encontrada",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const success = await roomRepository.delete(roomId);

    if (success) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Sala eliminada exitosamente",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Error al eliminar la sala",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  } catch (error) {
    console.error("Error deleting room:", error);
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
