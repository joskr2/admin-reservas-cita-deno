/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import type { IDatabaseConnection } from "./interfaces.ts";

// Singleton Pattern para la conexión a la base de datos
export class DatabaseConnection implements IDatabaseConnection {
  private static instance: DatabaseConnection;
  private kv: Deno.Kv | null = null;
  private isConnecting = false;

  private constructor() {}

  // Singleton Pattern
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async getInstance(): Promise<Deno.Kv> {
    if (this.kv) {
      return this.kv;
    }

    // Evitar múltiples conexiones simultáneas
    if (this.isConnecting) {
      return new Promise((resolve) => {
        const checkConnection = () => {
          if (this.kv) {
            resolve(this.kv);
          } else {
            setTimeout(checkConnection, 10);
          }
        };
        checkConnection();
      });
    }

    this.isConnecting = true;
    try {
      this.kv = await Deno.openKv();
      return this.kv;
    } catch (error) {
      console.error("Error connecting to Deno KV:", error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  public close(): void {
    if (this.kv) {
      this.kv.close();
      this.kv = null;
    }
  }

  // Método para verificar si la conexión está activa
  public isConnected(): boolean {
    return this.kv !== null;
  }

  // Método para reconectar si es necesario
  public async reconnect(): Promise<Deno.Kv> {
    this.close();
    return await this.getInstance();
  }
}
