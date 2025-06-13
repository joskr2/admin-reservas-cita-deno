import { type FreshContext } from "$fresh/server.ts";
import { type AppState, type RoomId } from "../../../../types/index.ts";
import { getRoomRepository } from "../../../../lib/database/index.ts";

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  if (req.method !== "PUT" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verificar autenticación y permisos
  const currentUser = ctx.state.user;
  if (!currentUser) {
    return new Response("", {
      status: 302,
      headers: { Location: "/login" },
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
        }
      );
    }

    const contentType = req.headers.get("Content-Type");
    let updateData: any;

    if (contentType?.includes("application/json")) {
      updateData = await req.json();
    } else {
      // Manejar datos de formulario
      const formData = await req.formData();
      updateData = {
        name: formData.get("name")?.toString(),
        description: formData.get("description")?.toString(),
        capacity: formData.get("capacity")
          ? parseInt(formData.get("capacity")?.toString() || "0")
          : undefined,
        equipment: formData
          .get("equipment")
          ?.toString()
          .split(",")
          .map((e) => e.trim())
          .filter((e) => e),
        roomType: formData.get("roomType")?.toString(),
      };
    }

    // Validar datos si se proporcionan
    if (
      updateData.name !== undefined &&
      (!updateData.name || !updateData.name.trim())
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "El nombre de la sala no puede estar vacío",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (updateData.capacity !== undefined && updateData.capacity <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "La capacidad debe ser mayor a 0",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Preparar datos de actualización
    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (updateData.name !== undefined) {
      updates.name = updateData.name.trim();
    }
    if (updateData.description !== undefined) {
      updates.description = updateData.description?.trim() || "";
    }
    if (updateData.capacity !== undefined) {
      updates.capacity = updateData.capacity;
    }
    if (updateData.equipment !== undefined) {
      updates.equipment = Array.isArray(updateData.equipment)
        ? updateData.equipment
        : [];
    }
    if (updateData.roomType !== undefined) {
      updates.roomType = updateData.roomType;
    }

    const success = await roomRepository.update(roomId, updates);

    if (success) {
      // Obtener la sala actualizada
      const updatedRoom = await roomRepository.getById(roomId);

      return new Response(
        JSON.stringify({
          success: true,
          room: updatedRoom,
          message: "Sala actualizada exitosamente",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Error al actualizar la sala",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error updating room:", error);
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
