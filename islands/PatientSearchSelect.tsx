import { useEffect, useState } from "preact/hooks";
import { Icon } from "../components/ui/Icon.tsx";

interface PatientSearchSelectProps {
  name: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  onPatientSelect?: (patientName: string) => void;
}

interface Patient {
  name: string;
  lastAppointment?: string;
  appointmentCount: number;
}

export default function PatientSearchSelect({
  name,
  value = "",
  placeholder = "Buscar paciente...",
  required = false,
  disabled = false,
  onPatientSelect,
}: PatientSearchSelectProps) {
  const [searchTerm, setSearchTerm] = useState(value);
  const [suggestions, setSuggestions] = useState<Patient[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);

  // Cargar pacientes recientes al montar el componente
  useEffect(() => {
    loadRecentPatients();
  }, []);

  const loadRecentPatients = () => {
    // Simular carga de pacientes recientes
    // En una implementación real, esto vendría de una API
    setRecentPatients([
      {
        name: "María García",
        lastAppointment: "2024-01-15",
        appointmentCount: 5,
      },
      {
        name: "Juan Pérez",
        lastAppointment: "2024-01-10",
        appointmentCount: 3,
      },
      { name: "Ana López", lastAppointment: "2024-01-08", appointmentCount: 7 },
    ]);
    setIsLoading(false);
  };

  const searchPatients = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Simular búsqueda de pacientes
      // En una implementación real, esto sería una llamada a la API
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simular delay de red

      const allPatients: Patient[] = [
        ...recentPatients,
        {
          name: "Roberto Carlos Silva",
          lastAppointment: "2024-01-10",
          appointmentCount: 4,
        },
        {
          name: "Lucía Fernanda Torres",
          lastAppointment: "2024-01-09",
          appointmentCount: 7,
        },
        {
          name: "Miguel Ángel Ruiz",
          lastAppointment: "2024-01-08",
          appointmentCount: 1,
        },
        {
          name: "Sofía Isabel Morales",
          lastAppointment: "2024-01-07",
          appointmentCount: 9,
        },
        {
          name: "Diego Alejandro Castro",
          lastAppointment: "2024-01-06",
          appointmentCount: 3,
        },
        {
          name: "Valentina Paz Jiménez",
          lastAppointment: "2024-01-05",
          appointmentCount: 5,
        },
        {
          name: "Andrés Felipe Vargas",
          lastAppointment: "2024-01-04",
          appointmentCount: 2,
        },
        {
          name: "Isabella María Delgado",
          lastAppointment: "2024-01-03",
          appointmentCount: 6,
        },
      ];

      const filtered = allPatients.filter((patient) =>
        patient.name.toLowerCase().includes(query.toLowerCase())
      );

      // Ordenar por relevancia: primero los que empiezan con la búsqueda, luego por número de citas
      filtered.sort((a, b) => {
        const aStartsWith = a.name
          .toLowerCase()
          .startsWith(query.toLowerCase());
        const bStartsWith = b.name
          .toLowerCase()
          .startsWith(query.toLowerCase());

        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;

        return b.appointmentCount - a.appointmentCount;
      });

      setSuggestions(filtered.slice(0, 8)); // Limitar a 8 resultados
    } catch (error) {
      console.error("Error searching patients:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const value = target.value;
    setSearchTerm(value);
    setIsOpen(true);

    if (value.length >= 2) {
      searchPatients(value);
    } else {
      setSuggestions([]);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSearchTerm(patient.name);
    setIsOpen(false);
    setSuggestions([]);

    if (onPatientSelect) {
      onPatientSelect(patient.name);
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (searchTerm.length === 0) {
      setSuggestions(recentPatients.slice(0, 5));
    }
  };

  const handleBlur = () => {
    // Delay para permitir clicks en las sugerencias
    setTimeout(() => setIsOpen(false), 200);
  };

  const formatLastAppointment = (date: string) => {
    return new Date(date).toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div class="relative w-full">
      {/* Input principal */}
      <div class="relative">
        <input
          type="text"
          name={name}
          value={searchTerm}
          onInput={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          class={`
            block w-full pl-10 pr-4 py-2 
            border border-gray-300 dark:border-gray-600 
            rounded-lg shadow-sm 
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
            dark:bg-gray-700 dark:text-white dark:placeholder-gray-400
            text-sm transition-colors duration-200
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        />

        {/* Icono de búsqueda */}
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon
            name="user"
            size={16}
            className="text-gray-400 dark:text-gray-500"
          />
        </div>

        {/* Indicador de carga */}
        {isLoading && (
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div class="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* Dropdown de sugerencias */}
      {isOpen && (suggestions.length > 0 || searchTerm.length === 0) && (
        <div class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {searchTerm.length === 0 && recentPatients.length > 0 && (
            <div class="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              Pacientes recientes
            </div>
          )}

          {(searchTerm.length === 0
            ? recentPatients.slice(0, 5)
            : suggestions
          ).map((patient, index) => (
            <button
              key={`${patient.name}-${index}`}
              type="button"
              onClick={() => handlePatientSelect(patient)}
              class="w-full px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none transition-colors"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {patient.name}
                  </p>
                  <div class="flex items-center space-x-2 mt-1">
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      {patient.appointmentCount} cita
                      {patient.appointmentCount !== 1 ? "s" : ""}
                    </span>
                    {patient.lastAppointment && (
                      <>
                        <span class="text-xs text-gray-400">•</span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">
                          Última:{" "}
                          {formatLastAppointment(patient.lastAppointment)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <Icon
                  name="user"
                  size={14}
                  className="text-gray-400 dark:text-gray-500 ml-2"
                />
              </div>
            </button>
          ))}

          {searchTerm.length >= 2 && suggestions.length === 0 && !isLoading && (
            <div class="px-3 py-4 text-center">
              <Icon
                name="user"
                size={24}
                className="mx-auto text-gray-300 dark:text-gray-600 mb-2"
              />
              <p class="text-sm text-gray-500 dark:text-gray-400">
                No se encontraron pacientes
              </p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Puedes escribir un nombre nuevo
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
