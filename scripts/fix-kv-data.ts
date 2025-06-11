#!/usr/bin/env -S deno run --allow-read --allow-write --unstable-kv

/**
 * Script para limpiar y reparar datos corruptos en Deno KV
 * Ejecutar: deno run --allow-read --allow-write --unstable-kv scripts/fix-kv-data.ts
 */

import { getKv } from "../lib/kv.ts";
import type { User, UserRole } from "../types/index.ts";

async function fixKvData() {
  console.log("🔧 Iniciando reparación de datos KV...");

  const kv = await getKv();

  // 1. Limpiar índices corruptos de users_by_role
  console.log("🧹 Limpiando índices users_by_role...");
  await cleanUsersByRoleIndex(kv);

  // 2. Reconstruir índices desde los datos principales
  console.log("🔨 Reconstruyendo índices...");
  await rebuildUserIndexes(kv);

  console.log("✅ Reparación completada!");
}

async function cleanUsersByRoleIndex(kv: Deno.Kv) {
  const roles: UserRole[] = ["superadmin", "psychologist"];

  for (const role of roles) {
    console.log(`  Limpiando índice para rol: ${role}`);
    const iter = kv.list({ prefix: ["users_by_role", role] });

    for await (const entry of iter) {
      try {
        // Verificar si el valor es válido
        const email = entry.value;
        if (typeof email !== "string" || !email) {
          console.log(
            `    Eliminando entrada corrupta: ${JSON.stringify(entry.key)}`
          );
          await kv.delete(entry.key);
        }
      } catch (error) {
        console.error(`    Error procesando entrada: ${error}`);
        await kv.delete(entry.key);
      }
    }
  }
}

async function rebuildUserIndexes(kv: Deno.Kv) {
  console.log("  Reconstruyendo índices desde usuarios principales...");

  const iter = kv.list<User>({ prefix: ["users"] });

  for await (const entry of iter) {
    try {
      const user = entry.value;
      if (user && user.email && user.role) {
        // Recrear el índice users_by_role
        const indexKey = ["users_by_role", user.role, user.email];
        await kv.set(indexKey, user.email);
        console.log(`    Recreado índice para: ${user.email} (${user.role})`);
      }
    } catch (error) {
      console.error(`    Error reconstruyendo índice para usuario: ${error}`);
    }
  }
}

async function verifyData() {
  console.log("🔍 Verificando integridad de datos...");

  const kv = await getKv();

  // Verificar usuarios
  const userIter = kv.list<User>({ prefix: ["users"] });
  let userCount = 0;

  for await (const entry of userIter) {
    userCount++;
    const user = entry.value;
    console.log(`  Usuario: ${user.email} (${user.role})`);
  }

  console.log(`📊 Total usuarios encontrados: ${userCount}`);

  // Verificar índices por rol
  const roles: UserRole[] = ["superadmin", "psychologist"];

  for (const role of roles) {
    const roleIter = kv.list({ prefix: ["users_by_role", role] });
    let roleCount = 0;

    for await (const entry of roleIter) {
      roleCount++;
      console.log(`  ${role}: ${entry.value}`);
    }

    console.log(`📊 Total ${role}s en índice: ${roleCount}`);
  }
}

if (import.meta.main) {
  try {
    await fixKvData();
    await verifyData();
  } catch (error) {
    console.error("❌ Error durante la reparación:", error);
    Deno.exit(1);
  }
}
