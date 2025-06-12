/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import type { Room, RoomId } from "../../../types/index.ts";
import type { IRoomRepository, IAppointmentRepository } from "../interfaces.ts";
import { BaseRepository } from "./base.ts";

export class RoomRepository extends BaseRepository<Room, RoomId> implements IRoomRepository {
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
    return super.validate(entity) && 
           typeof entity.id === "string" && 
           entity.id.length > 0 &&
           typeof entity.name === "string" && 
           entity.name.length > 0 &&
           typeof entity.isAvailable === "boolean";
  }

  public async updateAvailability(id: RoomId, isAvailable: boolean): Promise<boolean> {
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
    excludeAppointmentId?: string
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
          apt.id !== excludeAppointmentId
      );

      const occupiedRoomIds = conflictingAppointments.map((apt) => apt.roomId);

      return allRooms.filter(
        (room) => room.isAvailable && !occupiedRoomIds.includes(room.id)
      );
    } catch (error) {
      console.error(`Error getting available rooms for ${date} ${time}:`, error);
      return [];
    }
  }

  public async initializeDefaultRooms(): Promise<void> {
    const defaultRooms: Room[] = [
      {
        id: "A",
        name: "Sala A - Terapia Individual",
        isAvailable: true,
        equipment: ["Sillón", "Mesa", "Lámpara"],
      },
      {
        id: "B",
        name: "Sala B - Terapia Familiar",
        isAvailable: true,
        equipment: ["Sofá", "Sillas", "Mesa de centro"],
      },
      {
        id: "C",
        name: "Sala C - Terapia de Grupo",
        isAvailable: true,
        equipment: ["Círculo de sillas", "Pizarra"],
      },
      {
        id: "D",
        name: "Sala D - Evaluación",
        isAvailable: true,
        equipment: ["Escritorio", "Computadora", "Tests"],
      },
      {
        id: "E",
        name: "Sala E - Relajación",
        isAvailable: true,
        equipment: ["Camilla", "Música", "Aromaterapia"],
      },
    ];

    try {
      const kv = await this.getKv();
      
      for (const room of defaultRooms) {
        const existing = await this.getById(room.id);
        if (!existing) {
          await kv.set(["rooms", room.id], room);
        }
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