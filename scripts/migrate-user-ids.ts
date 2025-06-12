#!/usr/bin/env -S deno run --allow-read --allow-write --unstable-kv

/**
 * Script para migrar usuarios existentes agregando IDs únicos
 * Ejecutar: deno run --allow-read --allow-write --unstable-kv scripts/migrate-user-ids.ts
 */

import type { User } from "../types/index.ts";

async function migrateUserIds() {
  console.log("🔄 Iniciando migración de IDs de usuarios...");

  const kv = await Deno.openKv();

  try {
    // Obtener todos los usuarios existentes
    const users: Array<{ email: string; user: User }> = [];
    const iter = kv.list<User>({ prefix: ["users"] });

    for await (const entry of iter) {
      const user = entry.value;
      const email = String(entry.key[1]);
      users.push({ email, user });
    }

    console.log(`📊 Encontrados ${users.length} usuarios para migrar`);

    // Migrar cada usuario
    for (const { email, user } of users) {
      try {
        // Generar ID si no existe
        if (!user.id) {
          user.id = crypto.randomUUID();
          console.log(`  ✅ Generado ID para ${email}: ${user.id}`);
        } else {
          console.log(`  ℹ️  Usuario ${email} ya tiene ID: ${user.id}`);
        }

        // Actualizar usuario con ID
        const atomic = kv
          .atomic()
          .set(["users", email], user) // Actualizar registro por email
          .set(["users_by_id", user.id], user); // Crear registro por ID

        const result = await atomic.commit();

        if (result.ok) {
          console.log(`  ✅ Migrado usuario: ${email} -> ID: ${user.id}`);
        } else {
          console.error(`  ❌ Error migrando usuario: ${email}`);
        }
      } catch (error) {
        console.error(`  ❌ Error procesando usuario ${email}:`, error);
      }
    }

    console.log("\n🎉 Migración completada!");
    console.log("\n📊 Verificando datos...");

    // Verificar migración
    await verifyMigration(kv);
  } catch (error) {
    console.error("❌ Error durante la migración:", error);
    throw error;
  } finally {
    await kv.close();
  }
}

async function verifyMigration(kv: Deno.Kv) {
  // Verificar usuarios por email
  const usersByEmail = kv.list<User>({ prefix: ["users"] });
  let emailCount = 0;

  for await (const entry of usersByEmail) {
    emailCount++;
    const user = entry.value;
    if (!user.id) {
      console.warn(`⚠️  Usuario sin ID: ${String(entry.key[1])}`);
    }
  }

  // Verificar usuarios por ID
  const usersById = kv.list<User>({ prefix: ["users_by_id"] });
  let idCount = 0;

  for await (const _entry of usersById) {
    idCount++;
  }

  console.log(`📊 Usuarios por email: ${emailCount}`);
  console.log(`📊 Usuarios por ID: ${idCount}`);

  if (emailCount === idCount) {
    console.log("✅ Migración verificada correctamente");
  } else {
    console.warn("⚠️  Discrepancia en la migración");
  }
}

if (import.meta.main) {
  await migrateUserIds();
}
