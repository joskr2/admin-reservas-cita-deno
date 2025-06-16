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
import { logger, getErrorDetails, getKvResultDetails } from "../../logger.ts";

export class PatientRepository extends BaseRepository<Patient, string>
  implements IPatientRepository {
  protected keyPrefix = ["patients"];

  protected override getEntityId(entity: Patient): string {
    return entity.id;
  }

  protected override validate(entity: Patient): boolean {
    // Basic validation from parent
    if (!super.validate(entity)) {
      return false;
    }

    // Name is required
    if (!entity.name || typeof entity.name !== "string" || entity.name.trim().length === 0) {
      return false;
    }

    // isActive is required
    if (typeof entity.isActive !== "boolean") {
      return false;
    }

    // DNI validation if provided (same as psychologists)
    if (entity.dni !== undefined && entity.dni !== null) {
      if (typeof entity.dni !== "string" || !/^[A-Za-z0-9]{7,30}$/.test(entity.dni)) {
        return false;
      }
    }

    return true;
  }

  public override async create(patient: Patient): Promise<boolean> {
    await logger.debug('DATABASE', 'Attempting to create patient', {
      patientId: patient.id,
      patientName: patient.name,
      hasEmail: !!patient.email,
      hasPhone: !!patient.phone,
      isActive: patient.isActive,
    });
    
    if (!this.validate(patient)) {
      await logger.error('DATABASE', 'Invalid patient data provided to create', { patient });
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

    await logger.debug('DATABASE', 'Starting atomic transaction for patient creation', {
      patientId: patient.id,
      patientName: patient.name,
      keys: [
        ["patients", patient.id],
        ["patients_by_name", patient.name.toLowerCase(), patient.id]
      ]
    });

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

      const resultDetails = getKvResultDetails(result);
      await logger.info('DATABASE', 'Patient creation transaction result', {
        patientId: patient.id,
        patientName: patient.name,
        success: resultDetails.ok,
        versionstamp: resultDetails.versionstamp,
      });

      return result.ok;
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      await logger.error('DATABASE', 'Error creating patient', {
        patientId: patient.id,
        patientName: patient.name,
        error: errorDetails.message,
        stack: errorDetails.stack,
      });
      return false;
    }
  }

  public async getPatientByName(name: string): Promise<Patient[]> {
    if (typeof name !== "string" || !name) {
      await logger.warn('DATABASE', 'Invalid name provided to getPatientByName', {
        providedName: name,
        nameType: typeof name,
      });
      return [];
    }

    await logger.debug('DATABASE', 'Searching patients by name', { searchName: name });

    try {
      const kv = await this.getKv();
      const patients: Patient[] = [];
      const searchName = name.toLowerCase();
      let processedEntries = 0;
      let foundMatches = 0;

      // Buscar por coincidencia exacta y parcial
      const iter = kv.list<string>({ prefix: ["patients_by_name"] });

      for await (const entry of iter) {
        processedEntries++;
        const storedName = entry.key[1] as string;
        if (storedName.includes(searchName)) {
          foundMatches++;
          const patientId = entry.value;
          const patient = await this.getById(patientId);
          if (patient) {
            patients.push(patient);
          } else {
            await logger.warn('DATABASE', 'Patient referenced in name index but not found', {
              patientId,
              storedName,
            });
          }
        }
      }

      await logger.info('DATABASE', 'Completed patient search by name', {
        searchName: name,
        processedEntries,
        foundMatches,
        returnedPatients: patients.length,
      });

      return patients;
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      await logger.error('DATABASE', 'Error getting patients by name', {
        searchName: name,
        error: errorDetails.message,
        stack: errorDetails.stack,
      });
      return [];
    }
  }

  public async getAllPatientsAsProfiles(): Promise<PatientProfile[]> {
    await logger.debug('DATABASE', 'Getting all patients as profiles');
    
    try {
      const patients = await this.getAll();
      const profiles = patients.map((patient) =>
        this.mapPatientToProfile(patient)
      );
      
      await logger.info('DATABASE', 'Successfully retrieved all patients as profiles', {
        totalPatients: patients.length,
        totalProfiles: profiles.length,
      });
      
      return this.sortPatientProfiles(profiles);
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      await logger.error('DATABASE', 'Error getting all patients as profiles', {
        error: errorDetails.message,
        stack: errorDetails.stack,
      });
      return [];
    }
  }

  public async searchPatients(query: string): Promise<PatientProfile[]> {
    if (typeof query !== "string" || !query) {
      await logger.debug('DATABASE', 'Empty search query, returning all patients');
      return await this.getAllPatientsAsProfiles();
    }

    await logger.debug('DATABASE', 'Searching patients', { searchQuery: query });

    try {
      const searchQuery = query.toLowerCase();
      const allPatients = await this.getAll();

      const matchingPatients = allPatients.filter((patient) =>
        patient.name.toLowerCase().includes(searchQuery) ||
        (patient.email && patient.email.toLowerCase().includes(searchQuery)) ||
        (patient.phone && patient.phone.includes(searchQuery))
      );

      await logger.info('DATABASE', 'Patient search completed', {
        searchQuery: query,
        totalPatients: allPatients.length,
        matchingPatients: matchingPatients.length,
      });

      const profiles = matchingPatients.map((patient) =>
        this.mapPatientToProfile(patient)
      );
      return this.sortPatientProfiles(profiles);
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      await logger.error('DATABASE', 'Error searching patients', {
        searchQuery: query,
        error: errorDetails.message,
        stack: errorDetails.stack,
      });
      return [];
    }
  }

  public async getActivePatients(): Promise<PatientProfile[]> {
    await logger.debug('DATABASE', 'Getting active patients only');
    
    try {
      const allPatients = await this.getAll();
      const activePatients = allPatients.filter((patient) => patient.isActive);
      
      await logger.info('DATABASE', 'Successfully retrieved active patients', {
        totalPatients: allPatients.length,
        activePatients: activePatients.length,
        inactivePatients: allPatients.length - activePatients.length,
      });
      
      const profiles = activePatients.map((patient) =>
        this.mapPatientToProfile(patient)
      );
      return this.sortPatientProfiles(profiles);
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      await logger.error('DATABASE', 'Error getting active patients', {
        error: errorDetails.message,
        stack: errorDetails.stack,
      });
      return [];
    }
  }

  public override async update(
    id: string,
    updates: Partial<Patient>,
  ): Promise<boolean> {
    await logger.debug('DATABASE', 'Attempting to update patient', {
      patientId: id,
      updateFields: Object.keys(updates),
      hasNameUpdate: 'name' in updates,
    });
    
    try {
      const existingPatient = await this.getById(id);
      if (!existingPatient) {
        await logger.warn('DATABASE', 'Patient not found for update', { patientId: id });
        return false;
      }

      // Agregar timestamp de actualización
      const updatedPatient = {
        ...existingPatient,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Si cambió el nombre, actualizar índices
      if (updates.name && updates.name !== existingPatient.name) {
        await logger.info('DATABASE', 'Name change detected, updating name indices', {
          patientId: id,
          oldName: existingPatient.name,
          newName: updates.name,
        });
        
        const kv = await this.getKv();
        const result = await kv
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
          
        const resultDetails = getKvResultDetails(result);
        await logger.info('DATABASE', 'Name update transaction result', {
          patientId: id,
          success: resultDetails.ok,
          versionstamp: resultDetails.versionstamp,
          oldName: existingPatient.name,
          newName: updates.name,
        });
        
        return result.ok;
      }

      await logger.debug('DATABASE', 'No name change, using standard update', {
        patientId: id,
        updates,
      });
      
      const result = await super.update(id, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      
      await logger.info('DATABASE', 'Patient update result', {
        patientId: id,
        success: result,
        updates,
      });
      
      return result;
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      await logger.error('DATABASE', 'Error updating patient', {
        patientId: id,
        error: errorDetails.message,
        stack: errorDetails.stack,
      });
      return false;
    }
  }

  public override async delete(id: string): Promise<boolean> {
    await logger.info('DATABASE', 'Attempting to delete patient', { patientId: id });
    
    try {
      const patient = await this.getById(id);
      if (!patient) {
        await logger.warn('DATABASE', 'Patient not found for deletion', { patientId: id });
        return false;
      }

      await logger.debug('DATABASE', 'Starting atomic transaction for patient deletion', {
        patientId: id,
        patientName: patient.name,
        keys: [
          ["patients", id],
          ["patients_by_name", patient.name.toLowerCase(), id]
        ]
      });

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

      const resultDetails = getKvResultDetails(result);
      await logger.info('DATABASE', 'Patient deletion transaction result', {
        patientId: id,
        patientName: patient.name,
        success: resultDetails.ok,
        versionstamp: resultDetails.versionstamp,
      });

      return result.ok;
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      await logger.error('DATABASE', 'Error deleting patient', {
        patientId: id,
        error: errorDetails.message,
        stack: errorDetails.stack,
      });
      return false;
    }
  }

  private mapPatientToProfile(patient: Patient): PatientProfile {
    return {
      id: patient.id,
      name: patient.name,
      dni: patient.dni,
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
