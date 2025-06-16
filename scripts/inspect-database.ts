#!/usr/bin/env -S deno run --allow-read --allow-write --unstable-kv

/**
 * Script para inspeccionar la estructura y contenido de la base de datos
 * 
 * Este script:
 * 1. Muestra estadísticas de la base de datos
 * 2. Lista usuarios y sus roles
 * 3. Muestra información de salas
 * 4. Muestra estadísticas de citas
 * 5. Lista pacientes
 * 6. Muestra sesiones activas
 * 
 * Ejecutar: deno task inspect-db
 * o: deno run --allow-read --allow-write --unstable-kv scripts/inspect-database.ts
 */

import {
  getAppointmentRepository,
  getPatientRepository,
  getRoomRepository,
  getUserRepository,
} from "../lib/database/index.ts";

import type { User, Appointment, Patient, Room, UserRole } from "../types/index.ts";

interface DatabaseSummary {
  users: {
    total: number;
    byRole: Record<UserRole, number>;
    activeUsers: number;
  };
  patients: {
    total: number;
    active: number;
  };
  appointments: {
    total: number;
    byStatus: Record<string, number>;
    byMonth: Record<string, number>;
  };
  rooms: {
    total: number;
    available: number;
    byType: Record<string, number>;
  };
  sessions: {
    total: number;
  };
}

async function getGeneralStats(): Promise<void> {
  console.log("📊 Estadísticas generales de la base de datos");
  console.log("=" .repeat(50));
  
  const kv = await Deno.openKv();
  const prefixes = [
    ["users"],
    ["users_by_role"],
    ["users_by_id"],
    ["rooms"],
    ["patients"],
    ["patients_by_name"],
    ["appointments"],
    ["appointments_by_psychologist"],
    ["appointments_by_patient"],
    ["sessions"],
  ];

  for (const prefix of prefixes) {
    const entries = kv.list({ prefix });
    let count = 0;
    for await (const _entry of entries) {
      count++;
    }
    console.log(`${prefix.join('_').padEnd(25)}: ${count.toString().padStart(3)} registros`);
  }
  
  await kv.close();
  console.log("");
}

async function inspectUsers(): Promise<void> {
  console.log("👥 Usuarios en el sistema");
  console.log("-" .repeat(50));
  
  const userRepo = getUserRepository();
  const users = await userRepo.getAll();
  
  const roleStats: Record<string, number> = {};
  
  for (const user of users) {
    roleStats[user.role] = (roleStats[user.role] || 0) + 1;
    
    const status = user.isActive ? "✅ Activo" : "❌ Inactivo";
    const specialty = user.specialty ? ` (${user.specialty})` : "";
    
    console.log(`${user.email.padEnd(35)} | ${user.role.padEnd(12)} | ${status}${specialty}`);
  }
  
  console.log("\n📈 Estadísticas por rol:");
  for (const [role, count] of Object.entries(roleStats)) {
    console.log(`   ${role.padEnd(15)}: ${count} usuarios`);
  }
  console.log("");
}

async function inspectRooms(): Promise<void> {
  console.log("🏠 Salas configuradas");
  console.log("-" .repeat(50));
  
  const roomRepo = getRoomRepository();
  const rooms = await roomRepo.getAll();
  
  const typeStats: Record<string, number> = {};
  let availableCount = 0;
  
  for (const room of rooms) {
    const type = room.roomType || "sin tipo";
    typeStats[type] = (typeStats[type] || 0) + 1;
    
    if (room.isAvailable) {
      availableCount++;
    }
    
    const status = room.isAvailable ? "✅ Disponible" : "❌ No disponible";
    const capacity = room.capacity ? ` (Cap: ${room.capacity})` : "";
    
    console.log(`${room.name.padEnd(35)} | ${type.padEnd(12)} | ${status}${capacity}`);
  }
  
  console.log("\n📈 Estadísticas de salas:");
  console.log(`   Total: ${rooms.length} salas`);
  console.log(`   Disponibles: ${availableCount} salas`);
  console.log(`   No disponibles: ${rooms.length - availableCount} salas`);
  
  console.log("\n📊 Por tipo de sala:");
  for (const [type, count] of Object.entries(typeStats)) {
    console.log(`   ${type.padEnd(15)}: ${count} salas`);
  }
  console.log("");
}

async function inspectPatients(): Promise<void> {
  console.log("👤 Pacientes registrados");
  console.log("-" .repeat(50));
  
  const patientRepo = getPatientRepository();
  const patients = await patientRepo.getAll();
  
  let activeCount = 0;
  
  for (const patient of patients) {
    if (patient.isActive) {
      activeCount++;
    }
    
    const status = patient.isActive ? "✅ Activo" : "❌ Inactivo";
    const phone = patient.phone ? ` | ${patient.phone}` : "";
    const email = patient.email ? ` | ${patient.email}` : "";
    
    console.log(`${patient.name.padEnd(35)} | ${status}${phone}${email}`);
  }
  
  console.log("\n📈 Estadísticas de pacientes:");
  console.log(`   Total: ${patients.length} pacientes`);
  console.log(`   Activos: ${activeCount} pacientes`);
  console.log(`   Inactivos: ${patients.length - activeCount} pacientes`);
  console.log("");
}

async function inspectAppointments(): Promise<void> {
  console.log("📅 Citas programadas");
  console.log("-" .repeat(50));
  
  const appointmentRepo = getAppointmentRepository();
  const appointments = await appointmentRepo.getAll();
  
  const statusStats: Record<string, number> = {};
  const monthStats: Record<string, number> = {};
  const psychologistStats: Record<string, number> = {};
  
  // Estadísticas por fecha
  const today = new Date().toISOString().split('T')[0];
  const futureAppointments = appointments.filter(apt => apt.appointmentDate > today);
  const pastAppointments = appointments.filter(apt => apt.appointmentDate <= today);
  
  for (const appointment of appointments) {
    // Estadísticas por estado
    statusStats[appointment.status] = (statusStats[appointment.status] || 0) + 1;
    
    // Estadísticas por mes
    const month = appointment.appointmentDate.substring(0, 7); // YYYY-MM
    monthStats[month] = (monthStats[month] || 0) + 1;
    
    // Estadísticas por psicólogo
    const psychologist = appointment.psychologistName || appointment.psychologistEmail;
    psychologistStats[psychologist] = (psychologistStats[psychologist] || 0) + 1;
  }
  
  // Mostrar algunas citas recientes
  const recentAppointments = appointments
    .filter(apt => apt.appointmentDate >= today)
    .sort((a, b) => `${a.appointmentDate} ${a.startTime}`.localeCompare(`${b.appointmentDate} ${b.startTime}`))
    .slice(0, 10);
  
  console.log("🔍 Próximas citas (máximo 10):");
  for (const apt of recentAppointments) {
    const psychologist = apt.psychologistName || apt.psychologistEmail.split('@')[0];
    console.log(`   ${apt.appointmentDate} ${apt.startTime} | ${apt.patientName.padEnd(20)} | ${psychologist} | ${apt.status}`);
  }
  
  console.log("\n📈 Estadísticas de citas:");
  console.log(`   Total: ${appointments.length} citas`);
  console.log(`   Futuras: ${futureAppointments.length} citas`);
  console.log(`   Pasadas: ${pastAppointments.length} citas`);
  
  console.log("\n📊 Por estado:");
  for (const [status, count] of Object.entries(statusStats)) {
    console.log(`   ${status.padEnd(15)}: ${count} citas`);
  }
  
  console.log("\n📅 Por mes (últimos meses):");
  const recentMonths = Object.entries(monthStats)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 6);
  
  for (const [month, count] of recentMonths) {
    console.log(`   ${month.padEnd(15)}: ${count} citas`);
  }
  
  console.log("\n👨‍⚕️ Por psicólogo (top 10):");
  const topPsychologists = Object.entries(psychologistStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);
  
  for (const [psychologist, count] of topPsychologists) {
    const name = psychologist.length > 30 ? psychologist.substring(0, 27) + "..." : psychologist;
    console.log(`   ${name.padEnd(30)}: ${count} citas`);
  }
  console.log("");
}

async function inspectSessions(): Promise<void> {
  console.log("🔐 Sesiones activas");
  console.log("-" .repeat(50));
  
  const kv = await Deno.openKv();
  const sessions = kv.list({ prefix: ["sessions"] });
  
  let count = 0;
  for await (const session of sessions) {
    count++;
    const sessionId = session.key[1] as string;
    const sessionData = session.value as { userEmail: string };
    
    console.log(`   ${sessionId.substring(0, 20)}... | ${sessionData.userEmail}`);
  }
  
  await kv.close();
  
  console.log(`\n📈 Total de sesiones activas: ${count}`);
  console.log("");
}

async function generateDatabaseReport(): Promise<void> {
  console.log("📋 Reporte de la base de datos");
  console.log("=" .repeat(50));
  
  const userRepo = getUserRepository();
  const patientRepo = getPatientRepository();
  const appointmentRepo = getAppointmentRepository();
  const roomRepo = getRoomRepository();
  
  const users = await userRepo.getAll();
  const patients = await patientRepo.getAll();
  const appointments = await appointmentRepo.getAll();
  const rooms = await roomRepo.getAll();
  
  const kv = await Deno.openKv();
  const sessions = kv.list({ prefix: ["sessions"] });
  let sessionCount = 0;
  for await (const _session of sessions) {
    sessionCount++;
  }
  await kv.close();
  
  // Análisis de datos
  const activeUsers = users.filter(u => u.isActive).length;
  const psychologists = users.filter(u => u.role === 'psychologist').length;
  const admins = users.filter(u => u.role === 'admin' || u.role === 'superadmin').length;
  
  const activePatients = patients.filter(p => p.isActive).length;
  const availableRooms = rooms.filter(r => r.isAvailable).length;
  
  const today = new Date().toISOString().split('T')[0];
  const futureAppointments = appointments.filter(apt => apt.appointmentDate >= today).length;
  const completedAppointments = appointments.filter(apt => apt.status === 'completed').length;
  
  console.log("📊 Resumen ejecutivo:");
  console.log(`   👥 Usuarios: ${users.length} total (${activeUsers} activos)`);
  console.log(`   👨‍⚕️ Psicólogos: ${psychologists} profesionales`);
  console.log(`   🔑 Administradores: ${admins} usuarios`);
  console.log(`   👤 Pacientes: ${patients.length} total (${activePatients} activos)`);
  console.log(`   🏠 Salas: ${rooms.length} total (${availableRooms} disponibles)`);
  console.log(`   📅 Citas: ${appointments.length} total (${futureAppointments} futuras, ${completedAppointments} completadas)`);
  console.log(`   🔐 Sesiones: ${sessionCount} activas`);
  
  // Indicadores de salud
  console.log("\n🏥 Indicadores de salud del sistema:");
  
  if (users.length === 0) {
    console.log("   ❌ No hay usuarios en el sistema");
  } else if (admins === 0) {
    console.log("   ⚠️  No hay usuarios administrativos");
  } else {
    console.log("   ✅ Usuarios administrativos configurados");
  }
  
  if (psychologists === 0) {
    console.log("   ⚠️  No hay psicólogos registrados");
  } else {
    console.log(`   ✅ ${psychologists} psicólogos disponibles`);
  }
  
  if (rooms.length === 0) {
    console.log("   ❌ No hay salas configuradas");
  } else if (availableRooms === 0) {
    console.log("   ⚠️  No hay salas disponibles");
  } else {
    console.log(`   ✅ ${availableRooms} salas disponibles`);
  }
  
  const testDataIndicators = [];
  
  // Detectar datos de testing
  if (users.some(u => u.email.includes('test@') || u.email.includes('psicologo'))) {
    testDataIndicators.push("usuarios de testing");
  }
  
  if (patients.some(p => p.name.includes('Test') || p.name.includes('Patricio'))) {
    testDataIndicators.push("pacientes de testing");
  }
  
  if (appointments.length > 50) {
    testDataIndicators.push("muchas citas (posiblemente de testing)");
  }
  
  if (testDataIndicators.length > 0) {
    console.log(`   ⚠️  Se detectaron datos de testing: ${testDataIndicators.join(', ')}`);
    console.log("   💡 Considere ejecutar 'deno task cleanup-data' para limpiar datos de testing");
  } else {
    console.log("   ✅ No se detectaron datos de testing obvios");
  }
  
  console.log("");
}

async function main(): Promise<void> {
  try {
    console.log("🔍 Inspección de la base de datos Horizonte Clínica");
    console.log("=" .repeat(60));
    console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
    console.log("");
    
    await getGeneralStats();
    await inspectUsers();
    await inspectRooms();
    await inspectPatients();
    await inspectAppointments();
    await inspectSessions();
    await generateDatabaseReport();
    
    console.log("✅ Inspección completada");
    
  } catch (error) {
    console.error("❌ Error durante la inspección:", error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (import.meta.main) {
  await main();
}

// Función exportable para usar desde otros scripts
export { main as inspectDatabase };