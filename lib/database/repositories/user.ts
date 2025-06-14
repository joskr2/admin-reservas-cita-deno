/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import type {
  KVUserByIdKey,
  KVUserByRoleKey,
  KVUserKey,
  User,
  UserProfile,
} from "../../../types/index.ts";
import type { IUserRepository } from "../interfaces.ts";
import { BaseRepository } from "./base.ts";

export class UserRepository extends BaseRepository<User, string>
  implements IUserRepository {
  protected keyPrefix = ["users"];

  protected override getEntityId(entity: User): string {
    return entity.email;
  }

  protected override validate(user: User): boolean {
    // Basic validation from parent
    if (!super.validate(user)) {
      return false;
    }

    // Email is required and must be valid format
    if (!user.email || typeof user.email !== "string") {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      return false;
    }

    // Role is required
    if (!user.role || typeof user.role !== "string" || user.role.length === 0) {
      return false;
    }

    // Name is required
    if (!user.name || typeof user.name !== "string" || user.name.trim().length === 0) {
      return false;
    }

    // DNI validation if provided
    if (user.dni !== undefined && user.dni !== null) {
      if (typeof user.dni !== "string" || !/^[A-Za-z0-9]{7,30}$/.test(user.dni)) {
        return false;
      }
    }

    // Experience years validation if provided
    if (user.experienceYears !== undefined && user.experienceYears !== null) {
      if (typeof user.experienceYears !== "number" || user.experienceYears < 0 || user.experienceYears > 50) {
        return false;
      }
    }

    // Custom specialty validation
    if (user.specialty === "Otra" && (!user.customSpecialty || user.customSpecialty.trim().length === 0)) {
      return false;
    }

    return true;
  }

  public override async create(user: User): Promise<boolean> {
    if (!this.validate(user)) {
      console.warn("Invalid user data provided to create:", user);
      return false;
    }

    // Check for existing email (case insensitive)
    const existingUser = await this.getUserByEmail(user.email);
    if (existingUser) {
      console.warn("User with email already exists:", user.email);
      return false;
    }

    // Generar ID si no existe
    if (!user.id) {
      user.id = crypto.randomUUID();
    }

    try {
      const kv = await this.getKv();

      // Usar transacciones atómicas para mantener consistencia
      const result = await kv
        .atomic()
        .set(["users", user.email.toLowerCase()] as KVUserKey, user)
        .set(["users_by_id", user.id] as KVUserByIdKey, user)
        .set(
          ["users_by_role", user.role, user.email.toLowerCase()] as KVUserByRoleKey,
          user.email.toLowerCase(),
        )
        .commit();

      return result.ok;
    } catch (error) {
      console.error("Error creating user:", error);
      return false;
    }
  }

  public async getUserByEmail(email: string): Promise<User | null> {
    if (typeof email !== "string" || !email) {
      console.warn("Invalid email provided to getUserByEmail:", email);
      return null;
    }

    // Use lowercase for case-insensitive lookup
    return await this.getById(email.toLowerCase());
  }

  public async getUserById(id: string): Promise<User | null> {
    if (typeof id !== "string" || !id) {
      console.warn("Invalid id provided to getUserById:", id);
      return null;
    }

    try {
      const kv = await this.getKv();
      const result = await kv.get<User>(["users_by_id", id] as KVUserByIdKey);
      return result.value;
    } catch (error) {
      console.error(`Error getting user by id ${id}:`, error);
      return null;
    }
  }

  public async getUsersByRole(role: string): Promise<UserProfile[]> {
    if (typeof role !== "string" || !role) {
      console.warn("Invalid role provided to getUsersByRole:", role);
      return [];
    }

    try {
      const kv = await this.getKv();
      const users: UserProfile[] = [];
      const iter = kv.list<string>({ prefix: ["users_by_role", role] });

      for await (const entry of iter) {
        try {
          const email = entry.value;
          if (typeof email !== "string" || !email) {
            console.warn(
              `Invalid email value in users_by_role for role ${role}:`,
              email,
            );
            continue;
          }

          const user = await this.getUserByEmail(email);
          if (user) {
            users.push(this.mapUserToProfile(user));
          }
        } catch (error) {
          console.error(`Error processing user entry for role ${role}:`, error);
          continue;
        }
      }

      return this.sortUserProfiles(users);
    } catch (error) {
      console.error(`Error getting users by role ${role}:`, error);
      return [];
    }
  }

  public async getAllUsersAsProfiles(): Promise<UserProfile[]> {
    try {
      const users = await this.getAll();
      const profiles = users.map((user) => this.mapUserToProfile(user));
      return this.sortUserProfiles(profiles);
    } catch (error) {
      console.error("Error getting all users as profiles:", error);
      return [];
    }
  }

  public override async update(
    email: string,
    updates: Partial<User>,
  ): Promise<boolean> {
    try {
      const existingUser = await this.getUserByEmail(email);
      if (!existingUser) return false;

      const updatedUser = { ...existingUser, ...updates };

      // Si cambió el rol, actualizar índices
      if (updates.role && updates.role !== existingUser.role) {
        const kv = await this.getKv();
        await kv
          .atomic()
          .set(["users", email] as KVUserKey, updatedUser)
          .set(["users_by_id", updatedUser.id!] as KVUserByIdKey, updatedUser)
          .delete(
            ["users_by_role", existingUser.role, email] as KVUserByRoleKey,
          )
          .set(["users_by_role", updates.role, email] as KVUserByRoleKey, email)
          .commit();
        return true;
      }

      return await super.update(email, updates);
    } catch (error) {
      console.error(`Error updating user ${email}:`, error);
      return false;
    }
  }

  public override async delete(email: string): Promise<boolean> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) return false;

      const kv = await this.getKv();
      const result = await kv
        .atomic()
        .delete(["users", email] as KVUserKey)
        .delete(["users_by_id", user.id!] as KVUserByIdKey)
        .delete(["users_by_role", user.role, email] as KVUserByRoleKey)
        .commit();

      return result.ok;
    } catch (error) {
      console.error(`Error deleting user ${email}:`, error);
      return false;
    }
  }

  private mapUserToProfile(user: User): UserProfile {
    const profile: UserProfile = {
      id: user.id || crypto.randomUUID(),
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    // Solo agregar propiedades opcionales si tienen valor
    if (user.name !== undefined) {
      profile.name = user.name;
    }
    if (user.isActive !== undefined) {
      profile.isActive = user.isActive;
    }

    return profile;
  }

  private sortUserProfiles(profiles: UserProfile[]): UserProfile[] {
    return profiles.sort((a, b) =>
      (a.name || a.email).localeCompare(b.name || b.email)
    );
  }

}
