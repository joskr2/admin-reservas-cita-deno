// tests/unit/repositories/user.test.ts - Tests para UserRepository
import { assertEquals, assert } from "$std/testing/asserts.ts";
import { describe, it, beforeEach } from "$std/testing/bdd.ts";
import { UserRepository } from "../../../lib/database/repositories/user.ts";
import { DatabaseConnection } from "../../../lib/database/connection.ts";
import type { User } from "../../../types/index.ts";
import { testUtils } from "../../setup.ts";

describe("UserRepository", () => {
  let userRepository: UserRepository;
  let connection: DatabaseConnection;

  beforeEach(async () => {
    // Limpiar datos de prueba antes de cada test
    await testUtils.cleanupTestData();

    connection = DatabaseConnection.getInstance();
    userRepository = new UserRepository(connection);
  });

  describe("create", () => {
    it("should create a new user successfully", async () => {
      const user = testUtils.createUser({
        email: "test@example.com",
        name: "Test User",
        role: "psychologist",
        dni: "87654321",
        specialty: "Psicología Infantil",
        licenseNumber: "PSI-002",
        phone: "+9876543210",
        education: "Universidad Nacional, Maestría en Psicología Infantil",
        experienceYears: 3,
        bio: "Especialista en psicología infantil con enfoque en terapia de juego.",
      });

      const result = await userRepository.create(user);
      assertEquals(result, true);

      // Verificar que el usuario fue creado
      const createdUser = await userRepository.getUserByEmail(user.email);
      assertEquals(createdUser?.email, user.email);
      assertEquals(createdUser?.name, user.name);
      assertEquals(createdUser?.role, user.role);
      assertEquals(createdUser?.dni, user.dni);
      assertEquals(createdUser?.specialty, user.specialty);
      assertEquals(createdUser?.licenseNumber, user.licenseNumber);
      assertEquals(createdUser?.phone, user.phone);
      assertEquals(createdUser?.education, user.education);
      assertEquals(createdUser?.experienceYears, user.experienceYears);
      assertEquals(createdUser?.bio, user.bio);
    });

    it("should generate ID if not provided", async () => {
      const user = testUtils.createUser();
      // Crear un usuario sin ID explícito, pero el repositorio debería generar uno
      const userData: User = {
        id: "", // ID vacío para que el repositorio genere uno
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash: user.passwordHash,
        isActive: user.isActive,
        createdAt: user.createdAt,
      };

      const result = await userRepository.create(userData);
      assertEquals(result, true);

      // Verificar que se generó un ID
      const createdUser = await userRepository.getUserByEmail(user.email);
      assert(createdUser?.id);
    });

    it("should add timestamps on creation", async () => {
      const user = testUtils.createUser();
      const userData: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash: user.passwordHash,
        isActive: user.isActive,
        createdAt: user.createdAt,
      };

      const result = await userRepository.create(userData);
      assertEquals(result, true);

      const createdUser = await userRepository.getUserByEmail(user.email);
      assert(createdUser?.createdAt);
    });

    it("should validate required fields", async () => {
      const invalidUser: User = {
        id: "test-id",
        email: "", // Email vacío
        name: "Test User",
        role: "psychologist",
        passwordHash: "hashedpassword",
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      const result = await userRepository.create(invalidUser);
      assertEquals(result, false);
    });

    it("should validate email format", async () => {
      const invalidUser = testUtils.createUser({ email: "invalid-email" });
      const result = await userRepository.create(invalidUser);
      assertEquals(result, false);
    });

    it("should validate unique email", async () => {
      const user1 = testUtils.createUser({ email: "test@example.com" });
      const user2 = testUtils.createUser({ email: "test@example.com" });

      await userRepository.create(user1);
      const result = await userRepository.create(user2);
      assertEquals(result, false);
    });
  });

  describe("getUserById", () => {
    it("should return user when ID exists", async () => {
      const user = testUtils.createUser();
      await userRepository.create(user);

      const foundUser = await userRepository.getUserById(user.id);
      assertEquals(foundUser?.id, user.id);
      assertEquals(foundUser?.email, user.email);
    });

    it("should return null when ID does not exist", async () => {
      const foundUser = await userRepository.getUserById("nonexistent-id");
      assertEquals(foundUser, null);
    });
  });

  describe("getUserByEmail", () => {
    it("should return user when email exists", async () => {
      const user = testUtils.createUser({ email: "test@example.com" });
      await userRepository.create(user);

      const foundUser = await userRepository.getUserByEmail("test@example.com");
      assertEquals(foundUser?.email, user.email);
      assertEquals(foundUser?.id, user.id);
    });

    it("should return null when email does not exist", async () => {
      const foundUser = await userRepository.getUserByEmail(
        "nonexistent@example.com"
      );
      assertEquals(foundUser, null);
    });

    it("should be case insensitive", async () => {
      const user = testUtils.createUser({ email: "test@example.com" });
      await userRepository.create(user);

      const foundUser = await userRepository.getUserByEmail("TEST@EXAMPLE.COM");
      assertEquals(foundUser?.email, user.email);
    });
  });

  describe("getUsersByRole", () => {
    it("should return users with specific role", async () => {
      const adminUser = testUtils.createUser({
        email: "admin@example.com",
        role: "superadmin",
      });
      const regularUser = testUtils.createUser({
        email: "user@example.com",
        role: "psychologist",
      });

      await userRepository.create(adminUser);
      await userRepository.create(regularUser);

      const adminUsers = await userRepository.getUsersByRole("superadmin");
      assertEquals(adminUsers.length, 1);
      assertEquals(adminUsers[0]?.role, "superadmin");
      assertEquals(adminUsers[0]?.email, "admin@example.com");
    });

    it("should return empty array when no users with role", async () => {
      const users = await userRepository.getUsersByRole("nonexistent");
      assertEquals(users.length, 0);
    });
  });

  describe("getAllUsersAsProfiles", () => {
    it("should return all users as profiles", async () => {
      const user1 = testUtils.createUser({ email: "user1@example.com" });
      const user2 = testUtils.createUser({ email: "user2@example.com" });

      await userRepository.create(user1);
      await userRepository.create(user2);

      const profiles = await userRepository.getAllUsersAsProfiles();
      assertEquals(profiles.length, 2);

      // Verificar que los perfiles tienen las propiedades correctas
      profiles.forEach((profile) => {
        assert(profile.id);
        assert(profile.email);
        assert(profile.role);
      });
    });
  });

  describe("update", () => {
    it("should update user successfully", async () => {
      const user = testUtils.createUser({ name: "Original Name" });
      await userRepository.create(user);

      const updates = {
        name: "Updated Name",
      };
      const result = await userRepository.update(user.email, updates);
      assertEquals(result, true);

      const updatedUser = await userRepository.getUserByEmail(user.email);
      assertEquals(updatedUser?.name, "Updated Name");
    });

    it("should update role index when role changes", async () => {
      const user = testUtils.createUser({
        email: "test@example.com",
        role: "psychologist",
      });
      await userRepository.create(user);

      await userRepository.update(user.email, { role: "superadmin" });

      // Verificar que se puede encontrar por el nuevo rol
      const foundByNewRole = await userRepository.getUsersByRole("superadmin");
      assertEquals(foundByNewRole.length, 1);
      assertEquals(foundByNewRole[0]?.email, user.email);

      // Verificar que no se encuentra por el rol anterior
      const foundByOldRole = await userRepository.getUsersByRole(
        "psychologist"
      );
      assertEquals(foundByOldRole.length, 0);
    });

    it("should return false when updating non-existent user", async () => {
      const result = await userRepository.update("nonexistent@example.com", {
        name: "New Name",
      });
      assertEquals(result, false);
    });

    it("should preserve other fields when updating", async () => {
      const user = testUtils.createUser({
        name: "Original Name",
        email: "original@example.com",
        role: "psychologist",
      });
      await userRepository.create(user);

      await userRepository.update(user.email, { name: "Updated Name" });

      const updatedUser = await userRepository.getUserByEmail(user.email);
      assertEquals(updatedUser?.name, "Updated Name");
      assertEquals(updatedUser?.email, "original@example.com");
      assertEquals(updatedUser?.role, "psychologist");
    });
  });

  describe("delete", () => {
    it("should delete user successfully", async () => {
      const user = testUtils.createUser();
      await userRepository.create(user);

      const result = await userRepository.delete(user.email);
      assertEquals(result, true);

      const deletedUser = await userRepository.getUserByEmail(user.email);
      assertEquals(deletedUser, null);
    });

    it("should remove from role index when deleted", async () => {
      const user = testUtils.createUser({
        email: "test@example.com",
        role: "psychologist",
      });
      await userRepository.create(user);

      await userRepository.delete(user.email);

      const foundByRole = await userRepository.getUsersByRole("psychologist");
      assertEquals(foundByRole.length, 0);
    });

    it("should return false when deleting non-existent user", async () => {
      const result = await userRepository.delete("nonexistent@example.com");
      assertEquals(result, false);
    });
  });

  describe("getAll", () => {
    it("should return all users", async () => {
      const user1 = testUtils.createUser({ email: "user1@example.com" });
      const user2 = testUtils.createUser({ email: "user2@example.com" });

      await userRepository.create(user1);
      await userRepository.create(user2);

      const allUsers = await userRepository.getAll();
      assertEquals(allUsers.length, 2);
    });

    it("should return empty array when no users exist", async () => {
      const allUsers = await userRepository.getAll();
      assertEquals(allUsers.length, 0);
    });
  });

  describe("validation", () => {
    it("should validate email is required", async () => {
      const invalidUser = testUtils.createUser({ email: "" });
      const result = await userRepository.create(invalidUser);
      assertEquals(result, false);
    });

    it("should validate role is valid", async () => {
      const invalidUser = testUtils.createUser({
        role: "" as unknown as "psychologist",
      });
      const result = await userRepository.create(invalidUser);
      assertEquals(result, false);
    });

    it("should validate name is required", async () => {
      const invalidUser = testUtils.createUser({ name: "" });
      const result = await userRepository.create(invalidUser);
      assertEquals(result, false);
    });

    it("should validate DNI format", async () => {
      const invalidUser = testUtils.createUser({ dni: "123" }); // Too short
      const result = await userRepository.create(invalidUser);
      assertEquals(result, false);
    });

    it("should allow valid DNI", async () => {
      const validUser = testUtils.createUser({ dni: "12345678" });
      const result = await userRepository.create(validUser);
      assertEquals(result, true);
    });

    it("should validate experience years is non-negative", async () => {
      const invalidUser = testUtils.createUser({ experienceYears: -1 });
      const result = await userRepository.create(invalidUser);
      assertEquals(result, false);
    });

    it("should allow zero experience years", async () => {
      const validUser = testUtils.createUser({ experienceYears: 0 });
      const result = await userRepository.create(validUser);
      assertEquals(result, true);
    });

    it("should handle custom specialty when specialty is 'Otra'", async () => {
      const userWithCustomSpecialty = testUtils.createUser({
        specialty: "Otra",
        customSpecialty: "Neuropsicología Clínica",
      });
      const result = await userRepository.create(userWithCustomSpecialty);
      assertEquals(result, true);

      const createdUser = await userRepository.getUserByEmail(userWithCustomSpecialty.email);
      assertEquals(createdUser?.specialty, "Otra");
      assertEquals(createdUser?.customSpecialty, "Neuropsicología Clínica");
    });

    it("should update psychologist fields", async () => {
      const user = testUtils.createUser({ email: "psychologist@test.com" });
      await userRepository.create(user);

      const updates = {
        dni: "98765432",
        specialty: "Psicología Educativa",
        licenseNumber: "PSI-999",
        phone: "+1122334455",
        education: "Universidad Actualizada, Doctorado en Psicología",
        experienceYears: 10,
        bio: "Bio actualizada con más experiencia.",
      };

      const result = await userRepository.update(user.email, updates);
      assertEquals(result, true);

      const updatedUser = await userRepository.getUserByEmail(user.email);
      assertEquals(updatedUser?.dni, updates.dni);
      assertEquals(updatedUser?.specialty, updates.specialty);
      assertEquals(updatedUser?.licenseNumber, updates.licenseNumber);
      assertEquals(updatedUser?.phone, updates.phone);
      assertEquals(updatedUser?.education, updates.education);
      assertEquals(updatedUser?.experienceYears, updates.experienceYears);
      assertEquals(updatedUser?.bio, updates.bio);
    });
  });
});
