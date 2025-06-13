/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import type {
  KVPatientByNameKey,
  KVPatientKey,
  Patient,
  PatientProfile,
} from "../../../types/index.ts";
import type { IPatientRepository } from "../interfaces.ts";
import { BaseRepository } from "./base.ts";

export class PatientRepository extends BaseRepository<Patient, string>
  implements IPatientRepository {
  protected keyPrefix = ["patients"];

  protected override getEntityId(entity: Patient): string {
    return entity.id;
  }

  protected override validate(entity: Patient): boolean {
    return super.validate(entity) &&
      typeof entity.name === "string" &&
      entity.name.length > 0 &&
      typeof entity.isActive === "boolean";
  }

  public override async create(patient: Patient): Promise<boolean> {
    if (!this.validate(patient)) {
      console.warn("Invalid patient data provided to create:", patient);
      return false;
    }

    // Generar ID si no existe
    if (!patient.id) {
      patient.id = crypto.randomUUID();
    }

    // Agregar timestamps
    const now = new Date().toISOString();
    patient.createdAt = now;
    patient.updatedAt = now;

    try {
      const kv = await this.getKv();

      // Usar transacciones atómicas para mantener consistencia
      const result = await kv
        .atomic()
        .set(["patients", patient.id] as KVPatientKey, patient)
        .set(
          [
            "patients_by_name",
            patient.name.toLowerCase(),
            patient.id,
          ] as KVPatientByNameKey,
          patient.id,
        )
        .commit();

      return result.ok;
    } catch (error) {
      console.error("Error creating patient:", error);
      return false;
    }
  }

  public async getPatientByName(name: string): Promise<Patient[]> {
    if (typeof name !== "string" || !name) {
      console.warn("Invalid name provided to getPatientByName:", name);
      return [];
    }

    try {
      const kv = await this.getKv();
      const patients: Patient[] = [];
      const searchName = name.toLowerCase();

      // Buscar por coincidencia exacta y parcial
      const iter = kv.list<string>({ prefix: ["patients_by_name"] });

      for await (const entry of iter) {
        const storedName = entry.key[1] as string;
        if (storedName.includes(searchName)) {
          const patientId = entry.value;
          const patient = await this.getById(patientId);
          if (patient) {
            patients.push(patient);
          }
        }
      }

      return patients;
    } catch (error) {
      console.error(`Error getting patients by name ${name}:`, error);
      return [];
    }
  }

  public async getAllPatientsAsProfiles(): Promise<PatientProfile[]> {
    try {
      const patients = await this.getAll();
      const profiles = patients.map((patient) =>
        this.mapPatientToProfile(patient)
      );
      return this.sortPatientProfiles(profiles);
    } catch (error) {
      console.error("Error getting all patients as profiles:", error);
      return [];
    }
  }

  public async searchPatients(query: string): Promise<PatientProfile[]> {
    if (typeof query !== "string" || !query) {
      return await this.getAllPatientsAsProfiles();
    }

    try {
      const searchQuery = query.toLowerCase();
      const allPatients = await this.getAll();

      const matchingPatients = allPatients.filter((patient) =>
        patient.name.toLowerCase().includes(searchQuery) ||
        (patient.email && patient.email.toLowerCase().includes(searchQuery)) ||
        (patient.phone && patient.phone.includes(searchQuery))
      );

      const profiles = matchingPatients.map((patient) =>
        this.mapPatientToProfile(patient)
      );
      return this.sortPatientProfiles(profiles);
    } catch (error) {
      console.error(`Error searching patients with query ${query}:`, error);
      return [];
    }
  }

  public async getActivePatients(): Promise<PatientProfile[]> {
    try {
      const allPatients = await this.getAll();
      const activePatients = allPatients.filter((patient) => patient.isActive);
      const profiles = activePatients.map((patient) =>
        this.mapPatientToProfile(patient)
      );
      return this.sortPatientProfiles(profiles);
    } catch (error) {
      console.error("Error getting active patients:", error);
      return [];
    }
  }

  public override async update(
    id: string,
    updates: Partial<Patient>,
  ): Promise<boolean> {
    try {
      const existingPatient = await this.getById(id);
      if (!existingPatient) return false;

      // Agregar timestamp de actualización
      const updatedPatient = {
        ...existingPatient,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Si cambió el nombre, actualizar índices
      if (updates.name && updates.name !== existingPatient.name) {
        const kv = await this.getKv();
        await kv
          .atomic()
          .set(["patients", id] as KVPatientKey, updatedPatient)
          .delete(
            [
              "patients_by_name",
              existingPatient.name.toLowerCase(),
              id,
            ] as KVPatientByNameKey,
          )
          .set(
            [
              "patients_by_name",
              updates.name.toLowerCase(),
              id,
            ] as KVPatientByNameKey,
            id,
          )
          .commit();
        return true;
      }

      return await super.update(id, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Error updating patient ${id}:`, error);
      return false;
    }
  }

  public override async delete(id: string): Promise<boolean> {
    try {
      const patient = await this.getById(id);
      if (!patient) return false;

      const kv = await this.getKv();
      const result = await kv
        .atomic()
        .delete(["patients", id] as KVPatientKey)
        .delete(
          [
            "patients_by_name",
            patient.name.toLowerCase(),
            id,
          ] as KVPatientByNameKey,
        )
        .commit();

      return result.ok;
    } catch (error) {
      console.error(`Error deleting patient ${id}:`, error);
      return false;
    }
  }

  private mapPatientToProfile(patient: Patient): PatientProfile {
    return {
      id: patient.id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      isActive: patient.isActive,
      createdAt: patient.createdAt,
    };
  }

  private sortPatientProfiles(profiles: PatientProfile[]): PatientProfile[] {
    return profiles.sort((a, b) => a.name.localeCompare(b.name));
  }
}
