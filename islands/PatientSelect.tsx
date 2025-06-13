import { useEffect, useState } from "preact/hooks";
import { Icon } from "../components/ui/Icon.tsx";
import type { Patient } from "../types/index.ts";

interface PatientSelectProps {
  patients: Patient[];
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
}

export default function PatientSelect({
  patients,
  value = "",
  onChange,
  required = false,
}: PatientSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [_showNewPatientDialog, _setShowNewPatientDialog] = useState(false);

  // Filtrar pacientes basado en la búsqueda
  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.email &&
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Efecto para sincronizar el paciente seleccionado con el valor
  useEffect(() => {
    if (value) {
      const patient = patients.find((p) => p.name === value);
      setSelectedPatient(patient || null);
      setSearchTerm(patient?.name || value);
    }
  }, [value, patients]);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchTerm(patient.name);
    setIsOpen(false);
    onChange?.(patient.name);
  };

  const handleSearchChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setSearchTerm(target.value);
    setIsOpen(true);

    // Si no hay selección específica, usar el texto de búsqueda como valor
    if (!selectedPatient || selectedPatient.name !== target.value) {
      onChange?.(target.value);
    }
  };

  const handleNewPatient = () => {
    globalThis.open("/patients/new", "_blank");
  };

  return (
    <div class="relative">
      {/* Input de búsqueda */}
      <div class="relative">
        <input
          type="text"
          name="patientName"
          value={searchTerm}
          onInput={handleSearchChange}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder="Buscar paciente por nombre o email..."
          required={required}
          class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
        <div class="absolute inset-y-0 right-0 flex items-center pr-3">
          <Icon name="search" size={16} className="text-gray-400" />
        </div>
      </div>

      {/* Dropdown de resultados */}
      {isOpen && (
        <div class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredPatients.length > 0 ? (
            <>
              {filteredPatients.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => handleSelectPatient(patient)}
                  class="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="font-medium text-gray-900 dark:text-white">
                        {patient.name}
                      </div>
                      {patient.email && (
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          {patient.email}
                        </div>
                      )}
                      {patient.phone && (
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          {patient.phone}
                        </div>
                      )}
                    </div>
                    <div class="flex items-center">
                      <span
                        class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          patient.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {patient.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </>
          ) : (
            <div class="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
              {searchTerm
                ? "No se encontraron pacientes"
                : "Escriba para buscar pacientes"}
            </div>
          )}

          {/* Botón para crear nuevo paciente */}
          <button
            type="button"
            onClick={handleNewPatient}
            class="w-full px-4 py-3 text-left border-t border-gray-200 dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400"
          >
            <div class="flex items-center">
              <Icon name="plus" size={16} className="mr-2" />
              <span class="font-medium">Crear nuevo paciente</span>
            </div>
          </button>
        </div>
      )}

      {/* Información del paciente seleccionado */}
      {selectedPatient && (
        <div class="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h4 class="font-medium text-blue-900 dark:text-blue-100">
                Paciente seleccionado
              </h4>
              <div class="mt-1 text-sm text-blue-700 dark:text-blue-300">
                <div>
                  <strong>Nombre:</strong> {selectedPatient.name}
                </div>
                {selectedPatient.email && (
                  <div>
                    <strong>Email:</strong> {selectedPatient.email}
                  </div>
                )}
                {selectedPatient.phone && (
                  <div>
                    <strong>Teléfono:</strong> {selectedPatient.phone}
                  </div>
                )}
                {selectedPatient.dateOfBirth && (
                  <div>
                    <strong>Fecha de nacimiento:</strong>{" "}
                    {selectedPatient.dateOfBirth}
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedPatient(null);
                setSearchTerm("");
                onChange?.("");
              }}
              class="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              title="Limpiar selección"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
