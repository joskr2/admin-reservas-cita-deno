import { type FreshContext } from "$fresh/server.ts";
import { type AppState, type RoomId } from "../../../../types/index.ts";
import { getRoomRepository } from "../../../../lib/database/index.ts";

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  // Manejar CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
      },
    });
  }

  if (req.method !== "POST") {
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

  const roomId = ctx.params.id as RoomId;

  try {
    const roomRepository = getRoomRepository();

    // Obtener la sala actual
    const room = await roomRepository.getById(roomId);
    if (!room) {
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

    // Cambiar la disponibilidad
    const newAvailability = !room.isAvailable;
    const success = await roomRepository.updateAvailability(
      roomId,
      newAvailability,
    );

    if (success) {
      const message = newAvailability
        ? `Sala ${roomId} marcada como disponible`
        : `Sala ${roomId} marcada como ocupada`;

      // Obtener la sala actualizada
      const updatedRoom = await roomRepository.getById(roomId);

      // Siempre devolver respuesta JSON
      return new Response(
        JSON.stringify({
          success: true,
          message,
          room: updatedRoom,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Error al actualizar la disponibilidad",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  } catch (error) {
    console.error("Error toggling room availability:", error);
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
