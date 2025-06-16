/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import type { Room, RoomId } from "../../../types/index.ts";
import type { IAppointmentRepository, IRoomRepository } from "../interfaces.ts";
import { BaseRepository } from "./base.ts";
import { getErrorDetails, getKvResultDetails, logger } from "../../logger.ts";

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
      (entity.capacity === undefined ||
        (typeof entity.capacity === "number" && entity.capacity > 0))
    );
  }

  public override async create(room: Room): Promise<boolean> {
    logger.debug("DATABASE", "Attempting to create room", {
      roomId: room.id,
      roomName: room.name,
      roomType: room.roomType,
      isAvailable: room.isAvailable,
      equipment: room.equipment,
    });

    if (!this.validate(room)) {
      logger.error("DATABASE", "Invalid room data provided to create", {
        room,
      });
      return false;
    }

    try {
      const kv = await this.getKv();
      const result = await kv.set(["rooms", room.id], room);

      const resultDetails = getKvResultDetails(result);
      logger.info("DATABASE", "Room creation result", {
        roomId: room.id,
        roomName: room.name,
        success: resultDetails.ok,
        versionstamp: resultDetails.versionstamp,
      });

      return result.ok;
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      logger.error("DATABASE", "Error creating room", {
        roomId: room.id,
        roomName: room.name,
        error: errorDetails.message,
        stack: errorDetails.stack,
      });
      return false;
    }
  }

  public async updateAvailability(
    id: RoomId,
    isAvailable: boolean,
  ): Promise<boolean> {
    logger.debug("DATABASE", "Updating room availability", {
      roomId: id,
      newAvailability: isAvailable,
    });

    try {
      const room = await this.getById(id);
      if (!room) {
        logger.warn(
          "DATABASE",
          "Room not found for availability update",
          { roomId: id },
        );
        return false;
      }

      const oldAvailability = room.isAvailable;
      const updatedRoom = { ...room, isAvailable };

      const kv = await this.getKv();
      const result = await kv.set(["rooms", id], updatedRoom);

      const resultDetails = getKvResultDetails(result);
      logger.info("DATABASE", "Room availability update result", {
        roomId: id,
        roomName: room.name,
        oldAvailability,
        newAvailability: isAvailable,
        success: resultDetails.ok,
        versionstamp: resultDetails.versionstamp,
      });

      return result.ok;
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      logger.error("DATABASE", "Error updating room availability", {
        roomId: id,
        isAvailable,
        error: errorDetails.message,
        stack: errorDetails.stack,
      });
      return false;
    }
  }

  public async getAvailableRooms(
    date: string,
    time: string,
    excludeAppointmentId?: string,
  ): Promise<Room[]> {
    logger.debug("DATABASE", "Getting available rooms", {
      date,
      time,
      excludeAppointmentId,
    });

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
      const availableRooms = allRooms.filter(
        (room) => room.isAvailable && !occupiedRoomIds.includes(room.id),
      );

      logger.info("DATABASE", "Available rooms calculation completed", {
        date,
        time,
        totalRooms: allRooms.length,
        totalAppointments: appointments.length,
        conflictingAppointments: conflictingAppointments.length,
        occupiedRoomIds,
        availableRooms: availableRooms.length,
        availableRoomIds: availableRooms.map((r) => r.id),
        excludeAppointmentId,
      });

      return availableRooms;
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      logger.error("DATABASE", "Error getting available rooms", {
        date,
        time,
        excludeAppointmentId,
        error: errorDetails.message,
        stack: errorDetails.stack,
      });
      return [];
    }
  }

  public async initializeDefaultRooms(): Promise<void> {
    logger.info("DATABASE", "Starting default rooms initialization");

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
        logger.info(
          "DATABASE",
          "Rooms already initialized, skipping default room creation",
          {
            existingRoomsCount: existingRooms.length,
          },
        );
        return;
      }

      logger.info("DATABASE", "Creating default rooms", {
        roomsToCreate: defaultRooms.length,
        roomNames: defaultRooms.map((r) => r.name),
      });

      let createdCount = 0;
      for (const room of defaultRooms) {
        const result = await kv.set(["rooms", room.id], room);
        if (result.ok) {
          createdCount++;
          logger.debug("DATABASE", "Default room created", {
            roomId: room.id,
            roomName: room.name,
            roomType: room.roomType,
          });
        } else {
          logger.error("DATABASE", "Failed to create default room", {
            roomId: room.id,
            roomName: room.name,
          });
        }
      }

      logger.info("DATABASE", "Default rooms initialization completed", {
        totalRooms: defaultRooms.length,
        createdRooms: createdCount,
        failedRooms: defaultRooms.length - createdCount,
      });
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      logger.error("DATABASE", "Error initializing default rooms", {
        error: errorDetails.message,
        stack: errorDetails.stack,
        totalRooms: defaultRooms.length,
      });
    }
  }

  public override async getAll(): Promise<Room[]> {
    logger.debug("DATABASE", "Getting all rooms");

    try {
      const rooms = await super.getAll();
      const sortedRooms = rooms.sort((a, b) => a.id.localeCompare(b.id));

      logger.info("DATABASE", "Successfully retrieved all rooms", {
        totalRooms: rooms.length,
        availableRooms: rooms.filter((r) => r.isAvailable).length,
        unavailableRooms: rooms.filter((r) => !r.isAvailable).length,
      });

      return sortedRooms;
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      logger.error("DATABASE", "Error getting all rooms", {
        error: errorDetails.message,
        stack: errorDetails.stack,
      });
      return [];
    }
  }
}
