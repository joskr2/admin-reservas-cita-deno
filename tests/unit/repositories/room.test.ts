// tests/unit/repositories/room.test.ts - Tests para RoomRepository
import { assertEquals, assertExists, assert } from "$std/testing/asserts.ts";
import { describe, it, beforeEach } from "$std/testing/bdd.ts";
import { RoomRepository } from "../../../lib/database/repositories/room.ts";
import { AppointmentRepository } from "../../../lib/database/repositories/appointment.ts";
import { testUtils } from "../../setup.ts";
import type { Room, RoomId } from "../../../types/index.ts";
import type {
  IDatabaseConnection,
  IAppointmentRepository,
} from "../../../lib/database/interfaces.ts";

describe("RoomRepository", () => {
  let roomRepository: RoomRepository;
  let appointmentRepository: IAppointmentRepository;
  let mockConnection: IDatabaseConnection;

  beforeEach(() => {
    const mockKv = {
      get: () => Promise.resolve({ key: [], value: null, versionstamp: "" }),
      set: () => Promise.resolve({ ok: true, versionstamp: "" }),
      delete: () => Promise.resolve(),
      list: () => ({
        [Symbol.asyncIterator]: () => ({
          next: () => Promise.resolve({ done: true, value: undefined }),
        }),
      }),
    } as unknown as Deno.Kv;

    mockConnection = {
      getInstance: () => Promise.resolve(mockKv),
      close: () => {},
    };

    appointmentRepository = new AppointmentRepository(mockConnection);
    roomRepository = new RoomRepository(appointmentRepository);
  });

  describe("create", () => {
    it("should create a new room successfully", async () => {
      const room = testUtils.createRoom({
        name: "Sala de Terapia 1",
        capacity: 2,
        isAvailable: true,
      });

      const result = await roomRepository.create(room);
      assertEquals(result, true);

      // Verificar que la sala fue creada
      const createdRoom = await roomRepository.getById(room.id);
      assertExists(createdRoom);
      assertEquals(createdRoom.name, room.name);
      assertEquals(createdRoom.capacity, room.capacity);
      assertEquals(createdRoom.isAvailable, true);
    });

    it("should generate ID if not provided", async () => {
      const room = testUtils.createRoom();
      // Crear una sala sin ID
      const roomData = {
        name: room.name,
        capacity: room.capacity,
        isAvailable: room.isAvailable,
        equipment: room.equipment,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      };

      const result = await roomRepository.create(roomData as Room);
      assertEquals(result, true);

      // Verificar que se generó un ID
      const rooms = await roomRepository.getAll();
      assertEquals(rooms.length, 1);
      const firstRoom = rooms[0];
      assertExists(firstRoom);
      assertExists(firstRoom.id);
    });

    it("should validate required fields", async () => {
      const invalidRoom = {
        id: "test-id",
        name: "", // Nombre vacío
        capacity: 2,
        isAvailable: true,
        equipment: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await roomRepository.create(invalidRoom as Room);
      assertEquals(result, false);
    });

    it("should validate ID field", async () => {
      const invalidRoom = testUtils.createRoom({
        id: undefined as unknown as string,
      });
      const result = await roomRepository.create(invalidRoom);
      assertEquals(result, false);
    });

    it("should validate capacity is positive number", async () => {
      const invalidRoom = testUtils.createRoom({ capacity: -1 });
      const result = await roomRepository.create(invalidRoom);
      assertEquals(result, false);
    });

    it("should add timestamps on creation", async () => {
      const room = testUtils.createRoom();
      const roomData = {
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        isAvailable: room.isAvailable,
        equipment: room.equipment,
        createdAt: undefined as unknown as string,
        updatedAt: undefined as unknown as string,
      };

      const result = await roomRepository.create(roomData as Room);
      assertEquals(result, true);

      const createdRoom = await roomRepository.getById(room.id);
      assertExists(createdRoom);
      assertExists(createdRoom.createdAt);
      assertExists(createdRoom.updatedAt);
    });
  });

  describe("getById", () => {
    it("should return room when ID exists", async () => {
      const room = testUtils.createRoom();
      await roomRepository.create(room);

      const foundRoom = await roomRepository.getById(room.id);
      assertExists(foundRoom);
      assertEquals(foundRoom.id, room.id);
      assertEquals(foundRoom.name, room.name);
    });

    it("should return null when ID does not exist", async () => {
      const foundRoom = await roomRepository.getById(
        "nonexistent-id" as RoomId
      );
      assertEquals(foundRoom, null);
    });
  });

  describe("getAvailableRooms", () => {
    it("should return only available rooms for given date and time", async () => {
      const availableRoom = testUtils.createRoom({
        name: "Available Room",
        isAvailable: true,
      });
      const unavailableRoom = testUtils.createRoom({
        name: "Unavailable Room",
        isAvailable: false,
      });

      await roomRepository.create(availableRoom);
      await roomRepository.create(unavailableRoom);

      const availableRooms = await roomRepository.getAvailableRooms(
        "2024-03-15",
        "10:00"
      );
      assertEquals(availableRooms.length, 1);
      const firstAvailable = availableRooms[0];
      assertExists(firstAvailable);
      assertEquals(firstAvailable.name, "Available Room");
      assertEquals(firstAvailable.isAvailable, true);
    });

    it("should return empty array when no available rooms", async () => {
      const unavailableRoom = testUtils.createRoom({ isAvailable: false });
      await roomRepository.create(unavailableRoom);

      const availableRooms = await roomRepository.getAvailableRooms(
        "2024-03-15",
        "10:00"
      );
      assertEquals(availableRooms.length, 0);
    });
  });

  describe("updateAvailability", () => {
    it("should update room availability", async () => {
      const room = testUtils.createRoom({ isAvailable: true });
      await roomRepository.create(room);

      const result = await roomRepository.updateAvailability(room.id, false);
      assertEquals(result, true);

      const updatedRoom = await roomRepository.getById(room.id);
      assertExists(updatedRoom);
      assertEquals(updatedRoom.isAvailable, false);
    });

    it("should toggle back to available", async () => {
      const room = testUtils.createRoom({ isAvailable: false });
      await roomRepository.create(room);

      await roomRepository.updateAvailability(room.id, true);
      const updatedRoom = await roomRepository.getById(room.id);
      assertExists(updatedRoom);
      assertEquals(updatedRoom.isAvailable, true);
    });

    it("should return false when room does not exist", async () => {
      const result = await roomRepository.updateAvailability(
        "nonexistent-id" as RoomId,
        true
      );
      assertEquals(result, false);
    });
  });

  describe("update", () => {
    it("should update room successfully", async () => {
      const room = testUtils.createRoom({ name: "Original Name" });
      await roomRepository.create(room);

      const updates = {
        name: "Updated Name",
        capacity: 6,
      };
      const result = await roomRepository.update(room.id, updates);
      assertEquals(result, true);

      const updatedRoom = await roomRepository.getById(room.id);
      assertExists(updatedRoom);
      assertEquals(updatedRoom.name, "Updated Name");
      assertEquals(updatedRoom.capacity, 6);
      assertExists(updatedRoom.updatedAt);
    });

    it("should return false when updating non-existent room", async () => {
      const result = await roomRepository.update("nonexistent-id" as RoomId, {
        name: "New Name",
      });
      assertEquals(result, false);
    });

    it("should preserve other fields when updating", async () => {
      const room = testUtils.createRoom({
        name: "Original Name",
        capacity: 2,
        equipment: ["original", "equipment"],
      });
      await roomRepository.create(room);

      await roomRepository.update(room.id, { name: "Updated Name" });

      const updatedRoom = await roomRepository.getById(room.id);
      assertExists(updatedRoom);
      assertEquals(updatedRoom.name, "Updated Name");
      assertEquals(updatedRoom.capacity, 2);
      assertEquals(updatedRoom.equipment, ["original", "equipment"]);
    });
  });

  describe("delete", () => {
    it("should delete room successfully", async () => {
      const room = testUtils.createRoom();
      await roomRepository.create(room);

      const result = await roomRepository.delete(room.id);
      assertEquals(result, true);

      const deletedRoom = await roomRepository.getById(room.id);
      assertEquals(deletedRoom, null);
    });

    it("should return false when deleting non-existent room", async () => {
      const result = await roomRepository.delete("nonexistent-id" as RoomId);
      assertEquals(result, false);
    });
  });

  describe("getAll", () => {
    it("should return all rooms", async () => {
      const room1 = testUtils.createRoom({ name: "Room 1" });
      const room2 = testUtils.createRoom({ name: "Room 2" });

      await roomRepository.create(room1);
      await roomRepository.create(room2);

      const allRooms = await roomRepository.getAll();
      assertEquals(allRooms.length, 2);
    });

    it("should return empty array when no rooms exist", async () => {
      const allRooms = await roomRepository.getAll();
      assertEquals(allRooms.length, 0);
    });
  });

  describe("initializeDefaultRooms", () => {
    it("should initialize default rooms", async () => {
      await roomRepository.initializeDefaultRooms();

      // Verificar que se crearon las salas por defecto
      const rooms = await roomRepository.getAll();
      assert(rooms.length >= 5); // Al menos 5 salas por defecto
    });

    it("should not duplicate rooms if already exist", async () => {
      // Crear una sala primero
      const existingRoom = testUtils.createRoom();
      await roomRepository.create(existingRoom);

      await roomRepository.initializeDefaultRooms();

      const rooms = await roomRepository.getAll();
      // No debería duplicar salas si ya existen
      assertEquals(rooms.length, 1);
    });
  });

  describe("validation", () => {
    it("should validate name is required", async () => {
      const invalidRoom = testUtils.createRoom({ name: "" });
      const result = await roomRepository.create(invalidRoom);
      assertEquals(result, false);
    });

    it("should validate capacity is positive", async () => {
      const invalidRoom = testUtils.createRoom({ capacity: 0 });
      const result = await roomRepository.create(invalidRoom);
      assertEquals(result, false);
    });

    it("should validate equipment is array", async () => {
      const invalidRoom = testUtils.createRoom({
        equipment: "not-an-array" as unknown as string[],
      });
      const result = await roomRepository.create(invalidRoom);
      assertEquals(result, false);
    });

    it("should validate isAvailable is boolean", async () => {
      const invalidRoom = testUtils.createRoom({
        isAvailable: "true" as unknown as boolean, // String en lugar de boolean
      });
      const result = await roomRepository.create(invalidRoom);
      assertEquals(result, false);
    });

    it("should validate ID is string", async () => {
      const invalidRoom = testUtils.createRoom({
        id: 123 as unknown as RoomId, // Number en lugar de string
      });
      const result = await roomRepository.create(invalidRoom);
      assertEquals(result, false);
    });
  });

  describe("edge cases", () => {
    it("should handle concurrent room operations", async () => {
      const room1 = testUtils.createRoom({ name: "Concurrent Room 1" });
      const room2 = testUtils.createRoom({ name: "Concurrent Room 2" });
      const room3 = testUtils.createRoom({ name: "Concurrent Room 3" });

      // Simular operaciones concurrentes
      const promises = [
        roomRepository.create(room1),
        roomRepository.create(room2),
        roomRepository.create(room3),
      ];

      // No debería lanzar errores
      await Promise.all(promises);
      assert(true);
    });

    it("should handle malformed room data gracefully", async () => {
      const malformedRoom = {
        id: "test-room",
        name: "Test Room",
        // Faltan campos requeridos
      };

      const result = await roomRepository.create(malformedRoom as Room);
      assertEquals(result, false);
    });

    it("should handle database errors gracefully", async () => {
      // Simular error de base de datos
      const errorRepository = new RoomRepository({
        create: () => Promise.reject(new Error("Database error")),
        getById: () => Promise.reject(new Error("Database error")),
        getAll: () => Promise.reject(new Error("Database error")),
        update: () => Promise.reject(new Error("Database error")),
        delete: () => Promise.reject(new Error("Database error")),
        getAppointmentsByPsychologist: () =>
          Promise.reject(new Error("Database error")),
        getAppointmentsByDate: () =>
          Promise.reject(new Error("Database error")),
        getAppointmentsByStatus: () =>
          Promise.reject(new Error("Database error")),
      });

      const room = testUtils.createRoom();
      const result = await errorRepository.create(room);
      assertEquals(result, false);
    });
  });
});
