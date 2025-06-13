/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import type { Room, RoomId } from "../../../types/index.ts";
import type { IAppointmentRepository, IRoomRepository } from "../interfaces.ts";
import { BaseRepository } from "./base.ts";

export class RoomRepository extends BaseRepository<Room, RoomId>
  implements IRoomRepository {
  protected keyPrefix = ["rooms"];
  private appointmentRepository: IAppointmentRepository;

  constructor(appointmentRepository: IAppointmentRepository) {
    super();
    this.appointmentRepository = appointmentRepository;
  }

  protected override getEntityId(entity: Room): RoomId {
    return entity.id;
  }

  protected override validate(entity: Room): boolean {
    return (
      super.validate(entity) &&
      typeof entity.id === "string" &&
      entity.id.length > 0 &&
      typeof entity.name === "string" &&
      entity.name.length > 0 &&
      typeof entity.isAvailable === "boolean" &&
      Array.isArray(entity.equipment) &&
      (entity.capacity === undefined || (typeof entity.capacity === "number" && entity.capacity > 0))
    );
  }

  public override async create(room: Room): Promise<boolean> {
    if (!this.validate(room)) {
      console.warn("Invalid room data provided to create:", room);
      return false;
    }

    try {
      const kv = await this.getKv();
      const result = await kv.set(["rooms", room.id], room);
      return result.ok;
    } catch (error) {
      console.error("Error creating room:", error);
      return false;
    }
  }

  public async updateAvailability(
    id: RoomId,
    isAvailable: boolean,
  ): Promise<boolean> {
    try {
      const room = await this.getById(id);
      if (!room) return false;

      const updatedRoom = { ...room, isAvailable };
      const kv = await this.getKv();
      const result = await kv.set(["rooms", id], updatedRoom);
      return result.ok;
    } catch (error) {
      console.error(`Error updating room availability for ${id}:`, error);
      return false;
    }
  }

  public async getAvailableRooms(
    date: string,
    time: string,
    excludeAppointmentId?: string,
  ): Promise<Room[]> {
    try {
      const allRooms = await this.getAll();
      const appointments = await this.appointmentRepository.getAll();

      // Filtrar citas en la misma fecha y hora
      const conflictingAppointments = appointments.filter(
        (apt) =>
          apt.appointmentDate === date &&
          apt.appointmentTime === time &&
          apt.status !== "cancelled" &&
          apt.id !== excludeAppointmentId,
      );

      const occupiedRoomIds = conflictingAppointments.map((apt) => apt.roomId);

      return allRooms.filter(
        (room) => room.isAvailable && !occupiedRoomIds.includes(room.id),
      );
    } catch (error) {
      console.error(
        `Error getting available rooms for ${date} ${time}:`,
        error,
      );
      return [];
    }
  }

  public async initializeDefaultRooms(): Promise<void> {
    const defaultRooms: Room[] = [
      {
        id: crypto.randomUUID(),
        name: "Sala A - Terapia Individual",
        isAvailable: true,
        equipment: ["Sillón", "Mesa", "Lámpara"],
        roomType: "individual",
        description: "Sala diseñada para sesiones de terapia individual",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: "Sala B - Terapia Familiar",
        isAvailable: true,
        equipment: ["Sofá", "Sillas", "Mesa de centro"],
        roomType: "family",
        description: "Espacio amplio para terapia familiar y de pareja",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: "Sala C - Terapia de Grupo",
        isAvailable: true,
        equipment: ["Círculo de sillas", "Pizarra"],
        roomType: "group",
        description: "Sala configurada para sesiones grupales",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: "Sala D - Evaluación",
        isAvailable: true,
        equipment: ["Escritorio", "Computadora", "Tests"],
        roomType: "evaluation",
        description: "Sala equipada para evaluaciones psicológicas",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        name: "Sala E - Relajación",
        isAvailable: true,
        equipment: ["Camilla", "Música", "Aromaterapia"],
        roomType: "relaxation",
        description: "Espacio tranquilo para técnicas de relajación",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    try {
      const kv = await this.getKv();

      // Verificar si ya existen salas en la base de datos
      const existingRooms = await this.getAll();
      if (existingRooms.length > 0) {
        console.log(
          "Salas ya inicializadas, omitiendo creación de salas por defecto",
        );
        return;
      }

      for (const room of defaultRooms) {
        await kv.set(["rooms", room.id], room);
        console.log(`Sala por defecto creada: ${room.name}`);
      }
    } catch (error) {
      console.error("Error initializing default rooms:", error);
    }
  }

  public override async getAll(): Promise<Room[]> {
    try {
      const rooms = await super.getAll();
      return rooms.sort((a, b) => a.id.localeCompare(b.id));
    } catch (error) {
      console.error("Error getting all rooms:", error);
      return [];
    }
  }
}
