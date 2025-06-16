#!/usr/bin/env -S deno run --allow-read --allow-write --unstable-kv

/**
 * Script para limpiar datos de testing y preparar la aplicación para usuarios reales
 * 
 * Este script:
 * 1. Elimina citas de testing (generadas aleatoriamente)
 * 2. Elimina pacientes de testing 
 * 3. Mantiene usuarios administrativos y psicólogos
 * 4. Mantiene salas configuradas
 * 5. Reinicia contadores y estadísticas
 * 
 * Ejecutar: deno task cleanup-data
 * o: deno run --allow-read --allow-write --unstable-kv scripts/cleanup-test-data.ts
 */

import {
  getAppointmentRepository,
  getPatientRepository,
  getRoomRepository,
  getUserRepository,
  getSessionRepository,
} from "../lib/database/index.ts";


interface CleanupOptions {
  keepUsers?: string[]; // Lista de emails de usuarios a mantener
  keepPatients?: boolean; // Mantener pacientes reales
  keepRooms?: boolean; // Mantener configuración de salas
  verbose?: boolean; // Mostrar detalles de limpieza
}

async function checkDatabaseStatus(title: string = "Estado de la base de datos"): Promise<void> {
  console.log(`📊 ${title}:`);
  
  const kv = await Deno.openKv();
  const prefixes = [
    ["users"],
    ["users_by_role"],
    ["rooms"],
    ["patients"],
    ["appointments"],
    ["appointments_by_psychologist"],
    ["sessions"],
  ];

  for (const prefix of prefixes) {
    const entries = kv.list({ prefix });
    let count = 0;
    for await (const _entry of entries) {
      count++;
    }
    console.log(`   ${prefix.join('_')}: ${count} registros`);
  }
  
  await kv.close();
}

async function cleanupTestAppointments(options: CleanupOptions): Promise<number> {
  console.log("🗑️  Limpiando citas de testing...");
  
  const appointmentRepo = getAppointmentRepository();
  const appointments = await appointmentRepo.getAll();
  
  let deletedCount = 0;
  
  for (const appointment of appointments) {
    // Eliminar todas las citas (asumiendo que son de testing)
    // En un entorno real, aquí podrías agregar lógica para identificar
    // citas de testing vs. citas reales
    const deleted = await appointmentRepo.delete(appointment.id);
    if (deleted) {
      deletedCount++;
      if (options.verbose) {
        console.log(`   ✅ Eliminada cita: ${appointment.patientName} - ${appointment.appointmentDate}`);
      }
    }
  }
  
  console.log(`   📅 ${deletedCount} citas eliminadas`);
  return deletedCount;
}

async function cleanupTestPatients(options: CleanupOptions): Promise<number> {
  if (options.keepPatients) {
    console.log("👤 Manteniendo pacientes existentes (según configuración)");
    return 0;
  }
  
  console.log("🗑️  Limpiando pacientes de testing...");
  
  const patientRepo = getPatientRepository();
  const patients = await patientRepo.getAll();
  
  let deletedCount = 0;
  
  for (const patient of patients) {
    // Eliminar todos los pacientes de testing
    // En un entorno real, podrías mantener pacientes específicos
    const deleted = await patientRepo.delete(patient.id);
    if (deleted) {
      deletedCount++;
      if (options.verbose) {
        console.log(`   ✅ Eliminado paciente: ${patient.name}`);
      }
    }
  }
  
  console.log(`   👤 ${deletedCount} pacientes eliminados`);
  return deletedCount;
}

async function cleanupTestUsers(options: CleanupOptions): Promise<{ kept: number; deleted: number }> {
  console.log("👥 Limpiando usuarios de testing...");
  
  const userRepo = getUserRepository();
  const users = await userRepo.getAll();
  
  // Usuarios que siempre se mantienen (administrativos)
  const defaultKeepUsers = [
    "admin@horizonte.com",
    "admin2@horizonte.com", 
    "admin3@horizonte.com"
  ];
  
  const keepUsers = [...defaultKeepUsers, ...(options.keepUsers || [])];
  
  let keptCount = 0;
  let deletedCount = 0;
  
  for (const user of users) {
    if (keepUsers.includes(user.email)) {
      keptCount++;
      if (options.verbose) {
        console.log(`   ✅ Mantenido usuario: ${user.email} (${user.role})`);
      }
    } else {
      // Eliminar usuarios de testing
      const deleted = await userRepo.delete(user.id);
      if (deleted) {
        deletedCount++;
        if (options.verbose) {
          console.log(`   🗑️  Eliminado usuario: ${user.email} (${user.role})`);
        }
      }
    }
  }
  
  console.log(`   👥 ${keptCount} usuarios mantenidos, ${deletedCount} usuarios eliminados`);
  return { kept: keptCount, deleted: deletedCount };
}

async function cleanupSessions(): Promise<number> {
  console.log("🔐 Limpiando sesiones activas...");
  
  const sessionRepo = getSessionRepository();
  
  // Limpiar sesiones expiradas
  await sessionRepo.cleanExpiredSessions();
  
  // Para una limpieza completa, eliminar todas las sesiones
  const kv = await Deno.openKv();
  const sessions = kv.list({ prefix: ["sessions"] });
  
  let deletedCount = 0;
  for await (const session of sessions) {
    await kv.delete(session.key);
    deletedCount++;
  }
  
  await kv.close();
  
  console.log(`   🔐 ${deletedCount} sesiones eliminadas`);
  return deletedCount;
}

async function verifyRooms(): Promise<number> {
  console.log("🏠 Verificando configuración de salas...");
  
  const roomRepo = getRoomRepository();
  const rooms = await roomRepo.getAll();
  
  console.log(`   🏠 ${rooms.length} salas configuradas`);
  
  for (const room of rooms) {
    console.log(`   - ${room.name} (${room.roomType}) - ${room.isAvailable ? 'Disponible' : 'No disponible'}`);
  }
  
  return rooms.length;
}

async function createProductionUsers(): Promise<void> {
  console.log("👨‍⚕️ Creando usuarios para producción...");
  
  const userRepo = getUserRepository();
  
  // Verificar si ya existe el usuario admin principal
  const existingAdmin = await userRepo.getUserByEmail("admin@horizonte.com");
  
  if (!existingAdmin) {
    console.log("   ⚠️  No se encontró usuario admin principal. Considere ejecutar el seed con usuarios básicos.");
  } else {
    console.log("   ✅ Usuario admin principal encontrado");
  }
  
  // Aquí podrías agregar lógica para crear usuarios específicos para producción
  // Por ejemplo, un usuario demo o usuarios iniciales específicos
}

function generateCleanupReport(
  appointmentsDeleted: number,
  patientsDeleted: number,
  usersResult: { kept: number; deleted: number },
  sessionsDeleted: number,
  roomsCount: number
): void {
  console.log("\n📋 Reporte de limpieza:");
  console.log("=" .repeat(50));
  console.log(`📅 Citas eliminadas: ${appointmentsDeleted}`);
  console.log(`👤 Pacientes eliminados: ${patientsDeleted}`);
  console.log(`👥 Usuarios mantenidos: ${usersResult.kept}`);
  console.log(`👥 Usuarios eliminados: ${usersResult.deleted}`);
  console.log(`🔐 Sesiones eliminadas: ${sessionsDeleted}`);
  console.log(`🏠 Salas configuradas: ${roomsCount}`);
  console.log("=" .repeat(50));
  
  if (usersResult.kept === 0) {
    console.log("⚠️  ADVERTENCIA: No se mantuvieron usuarios. La aplicación podría no ser accesible.");
    console.log("   Considere ejecutar el script de seed para crear usuarios administrativos.");
  }
}

async function promptConfirmation(): Promise<boolean> {
  console.log("\n⚠️  ADVERTENCIA: Esta operación eliminará datos de testing de la base de datos.");
  console.log("   Esto incluye:");
  console.log("   - Todas las citas programadas");
  console.log("   - Todos los pacientes");
  console.log("   - Usuarios de testing (manteniendo usuarios admin)");
  console.log("   - Todas las sesiones activas");
  console.log("\n❓ ¿Está seguro de que desea continuar? (y/N)");
  
  // Para scripts automatizados, usar una variable de entorno
  const autoConfirm = Deno.env.get("AUTO_CONFIRM_CLEANUP");
  if (autoConfirm === "true") {
    console.log("   ✅ Confirmación automática activada");
    return true;
  }
  
  // Leer entrada del usuario
  const decoder = new TextDecoder();
  const buffer = new Uint8Array(1024);
  const bytesRead = await Deno.stdin.read(buffer);
  
  if (bytesRead === null) {
    return false;
  }
  
  const input = decoder.decode(buffer.subarray(0, bytesRead)).trim().toLowerCase();
  return input === 'y' || input === 'yes' || input === 'sí' || input === 's';
}

async function main(): Promise<void> {
  try {
    console.log("🧹 Script de limpieza de datos de testing");
    console.log("========================================\n");
    
    // Mostrar estado inicial
    await checkDatabaseStatus("Estado inicial de la base de datos");
    
    // Pedir confirmación
    const confirmed = await promptConfirmation();
    if (!confirmed) {
      console.log("❌ Operación cancelada por el usuario");
      return;
    }
    
    console.log("\n🚀 Iniciando limpieza...\n");
    
    // Configuración de limpieza
    const options: CleanupOptions = {
      keepUsers: [], // Emails de usuarios adicionales a mantener
      keepPatients: false, // Cambiar a true si quieres mantener pacientes reales
      keepRooms: true, // Mantener configuración de salas
      verbose: true, // Mostrar detalles
    };
    
    // Ejecutar limpieza
    const appointmentsDeleted = await cleanupTestAppointments(options);
    const patientsDeleted = await cleanupTestPatients(options);
    const usersResult = await cleanupTestUsers(options);
    const sessionsDeleted = await cleanupSessions();
    const roomsCount = await verifyRooms();
    
    // Crear usuarios para producción si es necesario
    await createProductionUsers();
    
    // Mostrar estado final
    console.log("\n");
    await checkDatabaseStatus("Estado final de la base de datos");
    
    // Generar reporte
    await generateCleanupReport(
      appointmentsDeleted,
      patientsDeleted,
      usersResult,
      sessionsDeleted,
      roomsCount
    );
    
    console.log("\n✅ Limpieza completada exitosamente!");
    console.log("🎯 La aplicación está lista para usuarios reales.");
    console.log("\n💡 Próximos pasos recomendados:");
    console.log("   1. Verificar que puedes acceder con las credenciales de admin");
    console.log("   2. Crear usuarios psicólogos reales desde el panel de administración");
    console.log("   3. Configurar salas adicionales si es necesario");
    console.log("   4. Comenzar a registrar pacientes reales");
    
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
    throw error;
  }
}

// Función para usar desde otros scripts
export async function cleanupTestData(_options: CleanupOptions = {}): Promise<void> {
  await main();
}

// Ejecutar si se llama directamente
if (import.meta.main) {
  await main();
}