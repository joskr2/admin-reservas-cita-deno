/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import type { KVSessionKey } from "../../../types/index.ts";
import type { IDatabaseConnection, ISessionRepository } from "../interfaces.ts";
import { DatabaseConnection } from "../connection.ts";
import { getErrorDetails, getKvResultDetails, logger } from "../../logger.ts";

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

  public async createSession(
    sessionId: string,
    userEmail: string,
  ): Promise<void> {
    logger.debug("DATABASE", "Attempting to create session", {
      sessionId: sessionId.substring(0, 8) + "...",
      userEmail,
    });

    if (typeof sessionId !== "string" || !sessionId) {
      logger.error(
        "DATABASE",
        "Invalid sessionId provided to createSession",
        {
          sessionId,
          sessionIdType: typeof sessionId,
        },
      );
      throw new Error("Invalid sessionId provided to createSession");
    }
    if (typeof userEmail !== "string" || !userEmail) {
      logger.error(
        "DATABASE",
        "Invalid userEmail provided to createSession",
        {
          userEmail,
          userEmailType: typeof userEmail,
        },
      );
      throw new Error("Invalid userEmail provided to createSession");
    }

    const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session: SessionData = {
      userEmail,
      createdAt: new Date().toISOString(),
      expiresAt: expirationDate.toISOString(), // 7 días
    };

    try {
      const kv = await this.getKv();
      const result = await kv.set(
        ["sessions", sessionId] as KVSessionKey,
        session,
      );

      const resultDetails = getKvResultDetails(result);
      logger.info("DATABASE", "Session created successfully", {
        sessionId: sessionId.substring(0, 8) + "...",
        userEmail,
        expiresAt: session.expiresAt,
        success: resultDetails.ok,
        versionstamp: resultDetails.versionstamp,
      });
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      logger.error("DATABASE", "Error creating session", {
        sessionId: sessionId.substring(0, 8) + "...",
        userEmail,
        error: errorDetails.message,
        stack: errorDetails.stack,
      });
      throw error;
    }
  }

  public async getSession(
    sessionId: string,
  ): Promise<{ userEmail: string } | null> {
    if (typeof sessionId !== "string" || !sessionId) {
      logger.warn(
        "DATABASE",
        "Invalid sessionId provided to getSession",
        {
          sessionId,
          sessionIdType: typeof sessionId,
        },
      );
      return null;
    }

    logger.debug("DATABASE", "Getting session", {
      sessionId: sessionId.substring(0, 8) + "...",
    });

    try {
      const kv = await this.getKv();
      const result = await kv.get<SessionData>(
        ["sessions", sessionId] as KVSessionKey,
      );
      const session = result.value;

      if (!session) {
        logger.debug("DATABASE", "Session not found", {
          sessionId: sessionId.substring(0, 8) + "...",
        });
        return null;
      }

      // Verificar si la sesión ha expirado
      const now = new Date();
      const expiresAt = new Date(session.expiresAt);

      if (expiresAt < now) {
        logger.info("DATABASE", "Session expired, deleting", {
          sessionId: sessionId.substring(0, 8) + "...",
          userEmail: session.userEmail,
          expiresAt: session.expiresAt,
          currentTime: now.toISOString(),
        });
        await this.deleteSession(sessionId);
        return null;
      }

      logger.debug("DATABASE", "Valid session found", {
        sessionId: sessionId.substring(0, 8) + "...",
        userEmail: session.userEmail,
        expiresAt: session.expiresAt,
      });

      return { userEmail: session.userEmail };
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      logger.error("DATABASE", "Error getting session", {
        sessionId: sessionId.substring(0, 8) + "...",
        error: errorDetails.message,
        stack: errorDetails.stack,
      });
      return null;
    }
  }

  public async deleteSession(sessionId: string): Promise<void> {
    if (typeof sessionId !== "string" || !sessionId) {
      logger.warn(
        "DATABASE",
        "Invalid sessionId provided to deleteSession",
        {
          sessionId,
          sessionIdType: typeof sessionId,
        },
      );
      return;
    }

    logger.debug("DATABASE", "Deleting session", {
      sessionId: sessionId.substring(0, 8) + "...",
    });

    try {
      const kv = await this.getKv();
      await kv.delete(["sessions", sessionId] as KVSessionKey);

      logger.info("DATABASE", "Session deleted successfully", {
        sessionId: sessionId.substring(0, 8) + "...",
      });
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      logger.error("DATABASE", "Error deleting session", {
        sessionId: sessionId.substring(0, 8) + "...",
        error: errorDetails.message,
        stack: errorDetails.stack,
      });
    }
  }

  public async cleanExpiredSessions(): Promise<void> {
    logger.info("DATABASE", "Starting expired sessions cleanup");

    try {
      const kv = await this.getKv();
      const now = new Date();
      const expiredSessions: string[] = [];
      let totalSessions = 0;

      const iter = kv.list<SessionData>({ prefix: ["sessions"] });

      for await (const entry of iter) {
        totalSessions++;
        const session = entry.value;
        if (session && new Date(session.expiresAt) < now) {
          const sessionId = entry.key[1] as string;
          expiredSessions.push(sessionId);
        }
      }

      logger.debug("DATABASE", "Found expired sessions", {
        totalSessions,
        expiredSessions: expiredSessions.length,
        activeSessions: totalSessions - expiredSessions.length,
      });

      // Eliminar sesiones expiradas en lotes
      let deletedCount = 0;
      for (const sessionId of expiredSessions) {
        try {
          await this.deleteSession(sessionId);
          deletedCount++;
        } catch (error) {
          const errorDetails = getErrorDetails(error);
          logger.warn("DATABASE", "Failed to delete expired session", {
            sessionId: sessionId.substring(0, 8) + "...",
            error: errorDetails.message,
          });
        }
      }

      logger.info("DATABASE", "Expired sessions cleanup completed", {
        totalSessions,
        expiredSessions: expiredSessions.length,
        deletedSessions: deletedCount,
        failedDeletions: expiredSessions.length - deletedCount,
      });
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      logger.error("DATABASE", "Error cleaning expired sessions", {
        error: errorDetails.message,
        stack: errorDetails.stack,
      });
    }
  }

  public async extendSession(
    sessionId: string,
    extensionDays = 7,
  ): Promise<boolean> {
    logger.debug("DATABASE", "Extending session", {
      sessionId: sessionId.substring(0, 8) + "...",
      extensionDays,
    });

    try {
      const kv = await this.getKv();
      const result = await kv.get<SessionData>(
        ["sessions", sessionId] as KVSessionKey,
      );
      const session = result.value;

      if (!session) {
        logger.warn("DATABASE", "Session not found for extension", {
          sessionId: sessionId.substring(0, 8) + "...",
        });
        return false;
      }

      const newExpirationDate = new Date(
        Date.now() + extensionDays * 24 * 60 * 60 * 1000,
      );
      const extendedSession: SessionData = {
        ...session,
        expiresAt: newExpirationDate.toISOString(),
      };

      const setResult = await kv.set(
        ["sessions", sessionId] as KVSessionKey,
        extendedSession,
      );

      const resultDetails = getKvResultDetails(setResult);
      logger.info("DATABASE", "Session extension result", {
        sessionId: sessionId.substring(0, 8) + "...",
        userEmail: session.userEmail,
        oldExpiresAt: session.expiresAt,
        newExpiresAt: extendedSession.expiresAt,
        extensionDays,
        success: resultDetails.ok,
        versionstamp: resultDetails.versionstamp,
      });

      return setResult.ok;
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      logger.error("DATABASE", "Error extending session", {
        sessionId: sessionId.substring(0, 8) + "...",
        extensionDays,
        error: errorDetails.message,
        stack: errorDetails.stack,
      });
      return false;
    }
  }

  public async getAllActiveSessions(): Promise<
    Array<{ sessionId: string; session: SessionData }>
  > {
    logger.debug("DATABASE", "Getting all active sessions");

    try {
      const kv = await this.getKv();
      const activeSessions: Array<{ sessionId: string; session: SessionData }> =
        [];
      const now = new Date();
      let totalSessions = 0;
      let expiredSessions = 0;

      const iter = kv.list<SessionData>({ prefix: ["sessions"] });

      for await (const entry of iter) {
        totalSessions++;
        const session = entry.value;
        if (session && new Date(session.expiresAt) > now) {
          const sessionId = entry.key[1] as string;
          activeSessions.push({ sessionId, session });
        } else if (session) {
          expiredSessions++;
        }
      }

      logger.info("DATABASE", "Retrieved all active sessions", {
        totalSessions,
        activeSessions: activeSessions.length,
        expiredSessions,
        uniqueUsers: new Set(activeSessions.map((s) =>
          s.session.userEmail
        )).size,
      });

      return activeSessions;
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      logger.error("DATABASE", "Error getting all active sessions", {
        error: errorDetails.message,
        stack: errorDetails.stack,
      });
      return [];
    }
  }
}
