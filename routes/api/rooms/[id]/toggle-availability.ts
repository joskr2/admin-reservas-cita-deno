import { type FreshContext } from "$fresh/server.ts";
import { type AppState, type RoomId } from "../../../../types/index.ts";
import { getRoomRepository } from "../../../../lib/database/index.ts";

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const roomId = ctx.params.id as RoomId;

  try {
    const roomRepository = getRoomRepository();

    // Obtener la sala actual
    const room = await roomRepository.getById(roomId);
    if (!room) {
      return new Response(JSON.stringify({ error: "Sala no encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Cambiar la disponibilidad
    const newAvailability = !room.isAvailable;
    const success = await roomRepository.updateAvailability(
      roomId,
      newAvailability
    );

    if (success) {
      const message = newAvailability
        ? `Sala ${roomId} marcada como disponible`
        : `Sala ${roomId} marcada como ocupada`;

      // Verificar si es una petición AJAX (desde el island)
      const acceptHeader = req.headers.get("Accept");
      const isAjax = acceptHeader?.includes("application/json");

      if (isAjax) {
        // Respuesta JSON para el island
        return new Response(
          JSON.stringify({
            success: true,
            message,
            newAvailability,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } else {
        // Redirección para formularios tradicionales
        return new Response("", {
          status: 302,
          headers: {
            Location: `/rooms?success=${encodeURIComponent(message)}`,
          },
        });
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Error al actualizar la disponibilidad" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error toggling room availability:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
