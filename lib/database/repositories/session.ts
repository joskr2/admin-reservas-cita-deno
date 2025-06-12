/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import type { KVSessionKey } from "../../../types/index.ts";
import type { ISessionRepository, IDatabaseConnection } from "../interfaces.ts";
import { DatabaseConnection } from "../connection.ts";

interface SessionData {
  userEmail: string;
  createdAt: string;
  expiresAt: string;
}

export class SessionRepository implements ISessionRepository {
  private connection: IDatabaseConnection;

  constructor(connection?: IDatabaseConnection) {
    this.connection = connection || DatabaseConnection.getInstance();
  }

  private async getKv(): Promise<Deno.Kv> {
    return await this.connection.getInstance();
  }

  public async createSession(sessionId: string, userEmail: string): Promise<void> {
    if (typeof sessionId !== "string" || !sessionId) {
      throw new Error("Invalid sessionId provided to createSession");
    }
    if (typeof userEmail !== "string" || !userEmail) {
      throw new Error("Invalid userEmail provided to createSession");
    }

    const session: SessionData = {
      userEmail,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
    };

    try {
      const kv = await this.getKv();
      await kv.set(["sessions", sessionId] as KVSessionKey, session);
    } catch (error) {
      console.error(`Error creating session ${sessionId}:`, error);
      throw error;
    }
  }

  public async getSession(sessionId: string): Promise<{ userEmail: string } | null> {
    if (typeof sessionId !== "string" || !sessionId) {
      console.warn("Invalid sessionId provided to getSession:", sessionId);
      return null;
    }

    try {
      const kv = await this.getKv();
      const result = await kv.get<SessionData>(["sessions", sessionId] as KVSessionKey);
      const session = result.value;

      if (!session) return null;

      // Verificar si la sesión ha expirado
      if (new Date(session.expiresAt) < new Date()) {
        await this.deleteSession(sessionId);
        return null;
      }

      return { userEmail: session.userEmail };
    } catch (error) {
      console.error(`Error getting session ${sessionId}:`, error);
      return null;
    }
  }

  public async deleteSession(sessionId: string): Promise<void> {
    if (typeof sessionId !== "string" || !sessionId) {
      console.warn("Invalid sessionId provided to deleteSession:", sessionId);
      return;
    }

    try {
      const kv = await this.getKv();
      await kv.delete(["sessions", sessionId] as KVSessionKey);
    } catch (error) {
      console.error(`Error deleting session ${sessionId}:`, error);
    }
  }

  public async cleanExpiredSessions(): Promise<void> {
    try {
      const kv = await this.getKv();
      const now = new Date();
      const expiredSessions: string[] = [];

      const iter = kv.list<SessionData>({ prefix: ["sessions"] });

      for await (const entry of iter) {
        const session = entry.value;
        if (session && new Date(session.expiresAt) < now) {
          const sessionId = entry.key[1] as string;
          expiredSessions.push(sessionId);
        }
      }

      // Eliminar sesiones expiradas en lotes
      for (const sessionId of expiredSessions) {
        await this.deleteSession(sessionId);
      }

      if (expiredSessions.length > 0) {
        console.log(`Cleaned ${expiredSessions.length} expired sessions`);
      }
    } catch (error) {
      console.error("Error cleaning expired sessions:", error);
    }
  }

  public async extendSession(sessionId: string, extensionDays = 7): Promise<boolean> {
    try {
      const kv = await this.getKv();
      const result = await kv.get<SessionData>(["sessions", sessionId] as KVSessionKey);
      const session = result.value;

      if (!session) return false;

      const extendedSession: SessionData = {
        ...session,
        expiresAt: new Date(Date.now() + extensionDays * 24 * 60 * 60 * 1000).toISOString(),
      };

      await kv.set(["sessions", sessionId] as KVSessionKey, extendedSession);
      return true;
    } catch (error) {
      console.error(`Error extending session ${sessionId}:`, error);
      return false;
    }
  }

  public async getAllActiveSessions(): Promise<Array<{ sessionId: string; session: SessionData }>> {
    try {
      const kv = await this.getKv();
      const activeSessions: Array<{ sessionId: string; session: SessionData }> = [];
      const now = new Date();

      const iter = kv.list<SessionData>({ prefix: ["sessions"] });

      for await (const entry of iter) {
        const session = entry.value;
        if (session && new Date(session.expiresAt) > now) {
          const sessionId = entry.key[1] as string;
          activeSessions.push({ sessionId, session });
        }
      }

      return activeSessions;
    } catch (error) {
      console.error("Error getting all active sessions:", error);
      return [];
    }
  }
}