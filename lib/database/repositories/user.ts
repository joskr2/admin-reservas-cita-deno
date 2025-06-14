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
import { logger, getErrorDetails, getKvResultDetails } from "../../logger.ts";

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
    await logger.debug('DATABASE', 'Attempting to create user', {
      userEmail: user.email,
      userRole: user.role,
      userName: user.name,
    });

    if (!this.validate(user)) {
      await logger.error('DATABASE', 'Invalid user data provided to create', { 
        user: { ...user, passwordHash: '[REDACTED]' } 
      });
      return false;
    }

    // Check for existing email (case insensitive)
    const existingUser = await this.getUserByEmail(user.email);
    if (existingUser) {
      await logger.warn('DATABASE', 'User with email already exists', {
        email: user.email,
      });
      return false;
    }

    // Generar ID si no existe
    if (!user.id) {
      user.id = crypto.randomUUID();
    }

    try {
      const kv = await this.getKv();

      await logger.debug('DATABASE', 'Starting atomic transaction for user creation', {
        userId: user.id,
        userEmail: user.email,
        keys: [
          ["users", user.email.toLowerCase()],
          ["users_by_id", user.id],
          ["users_by_role", user.role, user.email.toLowerCase()]
        ]
      });

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

      const resultDetails = getKvResultDetails(result);
      await logger.info('DATABASE', 'User creation transaction result', {
        userId: user.id,
        userEmail: user.email,
        success: resultDetails.ok,
        versionstamp: resultDetails.versionstamp,
      });

      return result.ok;
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      await logger.error('DATABASE', 'Error creating user', {
        userId: user.id,
        userEmail: user.email,
        error: errorDetails.message,
        stack: errorDetails.stack,
      });
      return false;
    }
  }

  public async getUserByEmail(email: string): Promise<User | null> {
    if (typeof email !== "string" || !email) {
      await logger.warn('DATABASE', 'Invalid email provided to getUserByEmail', {
        providedEmail: email,
        emailType: typeof email,
      });
      return null;
    }

    await logger.debug('DATABASE', 'Getting user by email', {
      email: email.toLowerCase(),
    });

    // Use lowercase for case-insensitive lookup
    return await this.getById(email.toLowerCase());
  }

  public async getUserById(id: string): Promise<User | null> {
    if (typeof id !== "string" || !id) {
      await logger.warn('DATABASE', 'Invalid id provided to getUserById', {
        providedId: id,
        idType: typeof id,
      });
      return null;
    }

    await logger.debug('DATABASE', 'Getting user by ID', { userId: id });

    try {
      const kv = await this.getKv();
      const result = await kv.get<User>(["users_by_id", id] as KVUserByIdKey);
      
      await logger.debug('DATABASE', 'User by ID query result', {
        userId: id,
        found: !!result.value,
        versionstamp: result.versionstamp,
      });
      
      return result.value;
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      await logger.error('DATABASE', 'Error getting user by ID', {
        userId: id,
        error: errorDetails.message,
        stack: errorDetails.stack,
      });
      return null;
    }
  }

  public async getUsersByRole(role: string): Promise<UserProfile[]> {
    if (typeof role !== "string" || !role) {
      await logger.warn('DATABASE', 'Invalid role provided to getUsersByRole', {
        providedRole: role,
        roleType: typeof role,
      });
      return [];
    }

    await logger.debug('DATABASE', 'Getting users by role', { role });

    try {
      const kv = await this.getKv();
      const users: UserProfile[] = [];
      const iter = kv.list<string>({ prefix: ["users_by_role", role] });
      let processedCount = 0;
      let errorCount = 0;

      for await (const entry of iter) {
        try {
          processedCount++;
          const email = entry.value;
          if (typeof email !== "string" || !email) {
            await logger.warn('DATABASE', 'Invalid email value in users_by_role index', {
              role,
              email,
              emailType: typeof email,
              entryKey: entry.key,
            });
            errorCount++;
            continue;
          }

          const user = await this.getUserByEmail(email);
          if (user) {
            users.push(this.mapUserToProfile(user));
          } else {
            await logger.warn('DATABASE', 'User referenced in role index but not found', {
              role,
              email,
            });
            errorCount++;
          }
        } catch (error) {
          const errorDetails = getErrorDetails(error);
          await logger.error('DATABASE', 'Error processing user entry for role', {
            role,
            entryKey: entry.key,
            error: errorDetails.message,
            stack: errorDetails.stack,
          });
          errorCount++;
          continue;
        }
      }

      await logger.info('DATABASE', 'Completed getting users by role', {
        role,
        totalProcessed: processedCount,
        validUsers: users.length,
        errors: errorCount,
      });

      return this.sortUserProfiles(users);
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      await logger.error('DATABASE', 'Error getting users by role', {
        role,
        error: errorDetails.message,
        stack: errorDetails.stack,
      });
      return [];
    }
  }

  public async getAllUsersAsProfiles(): Promise<UserProfile[]> {
    await logger.debug('DATABASE', 'Getting all users as profiles');
    
    try {
      const users = await this.getAll();
      const profiles = users.map((user) => this.mapUserToProfile(user));
      
      await logger.info('DATABASE', 'Successfully retrieved all users as profiles', {
        totalUsers: users.length,
        totalProfiles: profiles.length,
      });
      
      return this.sortUserProfiles(profiles);
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      await logger.error('DATABASE', 'Error getting all users as profiles', {
        error: errorDetails.message,
        stack: errorDetails.stack,
      });
      return [];
    }
  }

  public override async update(
    email: string,
    updates: Partial<User>,
  ): Promise<boolean> {
    await logger.debug('DATABASE', 'Attempting to update user', {
      userEmail: email,
      updateFields: Object.keys(updates),
      hasPasswordUpdate: 'passwordHash' in updates,
    });
    
    try {
      const existingUser = await this.getUserByEmail(email);
      if (!existingUser) {
        await logger.warn('DATABASE', 'User not found for update', { email });
        return false;
      }

      const updatedUser = { ...existingUser, ...updates };
      const redactedUpdates = { ...updates };
      if ('passwordHash' in redactedUpdates) {
        redactedUpdates.passwordHash = '[REDACTED]';
      }

      // Si cambió el rol, actualizar índices
      if (updates.role && updates.role !== existingUser.role) {
        await logger.info('DATABASE', 'Role change detected, updating role indices', {
          userEmail: email,
          oldRole: existingUser.role,
          newRole: updates.role,
        });
        
        const kv = await this.getKv();
        const result = await kv
          .atomic()
          .set(["users", email] as KVUserKey, updatedUser)
          .set(["users_by_id", updatedUser.id!] as KVUserByIdKey, updatedUser)
          .delete(
            ["users_by_role", existingUser.role, email] as KVUserByRoleKey,
          )
          .set(["users_by_role", updates.role, email] as KVUserByRoleKey, email)
          .commit();
          
        const resultDetails = getKvResultDetails(result);
        await logger.info('DATABASE', 'Role update transaction result', {
          userEmail: email,
          userId: updatedUser.id,
          success: resultDetails.ok,
          versionstamp: resultDetails.versionstamp,
          oldRole: existingUser.role,
          newRole: updates.role,
        });
        
        return result.ok;
      }

      await logger.debug('DATABASE', 'No role change, using standard update', {
        userEmail: email,
        updates: redactedUpdates,
      });
      
      const result = await super.update(email, updates);
      
      await logger.info('DATABASE', 'User update result', {
        userEmail: email,
        success: result,
        updates: redactedUpdates,
      });
      
      return result;
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      await logger.error('DATABASE', 'Error updating user', {
        userEmail: email,
        error: errorDetails.message,
        stack: errorDetails.stack,
      });
      return false;
    }
  }

  public override async delete(email: string): Promise<boolean> {
    await logger.info('DATABASE', 'Attempting to delete user', { userEmail: email });
    
    try {
      const user = await this.getUserByEmail(email);
      if (!user) {
        await logger.warn('DATABASE', 'User not found for deletion', { email });
        return false;
      }

      await logger.debug('DATABASE', 'Starting atomic transaction for user deletion', {
        userId: user.id,
        userEmail: email,
        userRole: user.role,
        keys: [
          ["users", email],
          ["users_by_id", user.id],
          ["users_by_role", user.role, email]
        ]
      });

      const kv = await this.getKv();
      const result = await kv
        .atomic()
        .delete(["users", email] as KVUserKey)
        .delete(["users_by_id", user.id!] as KVUserByIdKey)
        .delete(["users_by_role", user.role, email] as KVUserByRoleKey)
        .commit();

      const resultDetails = getKvResultDetails(result);
      await logger.info('DATABASE', 'User deletion transaction result', {
        userId: user.id,
        userEmail: email,
        userRole: user.role,
        success: resultDetails.ok,
        versionstamp: resultDetails.versionstamp,
      });

      return result.ok;
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      await logger.error('DATABASE', 'Error deleting user', {
        userEmail: email,
        error: errorDetails.message,
        stack: errorDetails.stack,
      });
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
