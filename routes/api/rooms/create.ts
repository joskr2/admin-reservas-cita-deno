import { type FreshContext } from "$fresh/server.ts";
import { type AppState, type Room } from "../../../types/index.ts";
import { getRoomRepository } from "../../../lib/database/index.ts";

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

  try {
    let roomData;

    // Intentar parsear JSON con manejo de errores
    try {
      roomData = await req.json();
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "JSON inválido",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validar campos requeridos
    if (!roomData.name || !roomData.roomType) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Nombre y tipo de sala son requeridos",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const roomRepository = getRoomRepository();

    // Crear la entidad Room completa
    const newRoom: Room = {
      id: crypto.randomUUID(),
      name: roomData.name,
      roomType: roomData.roomType,
      capacity: roomData.capacity || 1,
      equipment: roomData.equipment || [],
      isAvailable: roomData.isAvailable ?? true,
      description: roomData.description || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const success = await roomRepository.create(newRoom);

    if (success) {
      return new Response(
        JSON.stringify({
          success: true,
          room: newRoom,
        }),
        {
          status: 201,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Error al crear la sala",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error creating room:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error interno del servidor",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
