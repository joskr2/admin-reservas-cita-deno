import { useState } from "preact/hooks";
import { Select } from "../components/ui/Select.tsx";
import { Input } from "../components/ui/Input.tsx";

interface SpecialtySelectorProps {
  name: string;
  value?: string;
  customValue?: string;
  required?: boolean;
  className?: string;
}

export default function SpecialtySelector({
  name,
  value = "",
  customValue = "",
  required = false,
  className = "",
}: SpecialtySelectorProps) {
  const [selectedSpecialty, setSelectedSpecialty] = useState(value);
  const [customSpecialty, setCustomSpecialty] = useState(customValue);

  const specialtyOptions = [
    { value: "", label: "Seleccionar especialidad" },
    { value: "Psicología Clínica", label: "Psicología Clínica" },
    {
      value: "Psicología Cognitivo-Conductual",
      label: "Psicología Cognitivo-Conductual",
    },
    { value: "Psicología Familiar", label: "Psicología Familiar" },
    { value: "Psicología Infantil", label: "Psicología Infantil" },
    { value: "Neuropsicología", label: "Neuropsicología" },
    { value: "Psicología de Pareja", label: "Psicología de Pareja" },
    { value: "Psicología de Grupos", label: "Psicología de Grupos" },
    { value: "Psicología del Trauma", label: "Psicología del Trauma" },
    { value: "Psicología Organizacional", label: "Psicología Organizacional" },
    { value: "Otra", label: "Otra" },
  ];

  return (
    <div className="space-y-3">
      <Select
        name={name}
        value={selectedSpecialty}
        required={required}
        className={className}
        onChange={(e) => {
          const newValue = (e.target as HTMLSelectElement).value;
          setSelectedSpecialty(newValue);
          // Limpiar la especialidad personalizada si no es "Otra"
          if (newValue !== "Otra") {
            setCustomSpecialty("");
          }
        }}
      >
        {specialtyOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      {selectedSpecialty === "Otra" && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Especificar especialidad:
          </label>
          <Input
            type="text"
            name="customSpecialty"
            value={customSpecialty}
            placeholder="Ej: Psicología Deportiva, Neuropsicología Infantil, etc."
            required={selectedSpecialty === "Otra"}
            className="w-full"
            onInput={(e) => {
              setCustomSpecialty((e.target as HTMLInputElement).value);
            }}
          />
        </div>
      )}
    </div>
  );
}
