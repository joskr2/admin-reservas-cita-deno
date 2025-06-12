/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import type { IDatabaseConnection, IRepository } from "../interfaces.ts";
import { DatabaseConnection } from "../connection.ts";

// Base Repository siguiendo DRY y Single Responsibility Principle
export abstract class BaseRepository<T, K = string> implements IRepository<T, K> {
  protected connection: IDatabaseConnection;
  protected abstract keyPrefix: string[];

  constructor(connection?: IDatabaseConnection) {
    this.connection = connection || DatabaseConnection.getInstance();
  }

  protected async getKv(): Promise<Deno.Kv> {
    return await this.connection.getInstance();
  }

  protected buildKey(id: K): Deno.KvKey {
    return [...this.keyPrefix, id] as Deno.KvKey;
  }

  protected buildListKey(): Deno.KvKey {
    return this.keyPrefix as Deno.KvKey;
  }

  public async create(entity: T): Promise<boolean> {
    try {
      const kv = await this.getKv();
      const key = this.buildKey(this.getEntityId(entity));
      const result = await kv.set(key, entity);
      return result.ok;
    } catch (error) {
      console.error(`Error creating entity in ${this.keyPrefix.join('/')}:`, error);
      return false;
    }
  }

  public async getById(id: K): Promise<T | null> {
    try {
      const kv = await this.getKv();
      const key = this.buildKey(id);
      const result = await kv.get<T>(key);
      return result.value;
    } catch (error) {
      console.error(`Error getting entity by id ${id} in ${this.keyPrefix.join('/')}:`, error);
      return null;
    }
  }

  public async getAll(): Promise<T[]> {
    try {
      const kv = await this.getKv();
      const entities: T[] = [];
      const iter = kv.list<T>({ prefix: this.buildListKey() });

      for await (const entry of iter) {
        entities.push(entry.value);
      }

      return entities;
    } catch (error) {
      console.error(`Error getting all entities in ${this.keyPrefix.join('/')}:`, error);
      return [];
    }
  }

  public async update(id: K, updates: Partial<T>): Promise<boolean> {
    try {
      const current = await this.getById(id);
      if (!current) return false;

      const updated = { ...current, ...updates };
      const kv = await this.getKv();
      const key = this.buildKey(id);
      const result = await kv.set(key, updated);
      return result.ok;
    } catch (error) {
      console.error(`Error updating entity ${id} in ${this.keyPrefix.join('/')}:`, error);
      return false;
    }
  }

  public async delete(id: K): Promise<boolean> {
    try {
      const kv = await this.getKv();
      const key = this.buildKey(id);
      await kv.delete(key);
      return true;
    } catch (error) {
      console.error(`Error deleting entity ${id} in ${this.keyPrefix.join('/')}:`, error);
      return false;
    }
  }

  // Método abstracto que debe ser implementado por cada repositorio específico
  protected abstract getEntityId(entity: T): K;

  // Método para validar entidades antes de guardar
  protected validate(entity: T): boolean {
    return entity !== null && entity !== undefined;
  }
}