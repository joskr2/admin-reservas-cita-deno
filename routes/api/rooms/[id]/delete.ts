import { type FreshContext } from "$fresh/server.ts";
import { type AppState, type RoomId } from "../../../../types/index.ts";
import { getRoomRepository } from "../../../../lib/database/index.ts";

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  const method = req.method;
  let actualMethod = method;

  // Soportar POST con _method=DELETE para formularios HTML
  if (method === "POST") {
    const formData = await req.formData();
    const methodOverride = formData.get("_method");
    if (methodOverride === "DELETE") {
      actualMethod = "DELETE";
    }
  }

  if (actualMethod !== "DELETE") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const roomId = ctx.params.id as RoomId;
    const roomRepository = getRoomRepository();

    // Verificar que la sala existe
    const room = await roomRepository.getById(roomId);
    if (!room) {
      if (method === "POST") {
        // Redirigir con error para formularios
        return new Response("", {
          status: 302,
          headers: { Location: "/rooms?error=room_not_found" },
        });
      }
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
      if (method === "POST") {
        // Redirigir con éxito para formularios
        return new Response("", {
          status: 302,
          headers: { Location: "/rooms?success=sala_eliminada" },
        });
      }
      return new Response(
        JSON.stringify({
          success: true,
          message: "Sala eliminada exitosamente",
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    } else {
      if (method === "POST") {
        // Redirigir con error para formularios
        return new Response("", {
          status: 302,
          headers: { Location: "/rooms?error=delete_failed" },
        });
      }
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
    if (req.method === "POST") {
      // Redirigir con error para formularios
      return new Response("", {
        status: 302,
        headers: { Location: "/rooms?error=server_error" },
      });
    }
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
