'use client';

import { Bike, Store } from 'lucide-react';

interface DeliveryTypeSelectorProps {
  value: 'pickup' | 'delivery' | null;
  onChange: (type: 'pickup' | 'delivery') => void;
  disabled?: boolean;
}

const OPTIONS = [
  {
    value: 'pickup' as const,
    label: 'Retiro en el local',
    description: 'Sin costo',
    Icon: Store,
  },
  {
    value: 'delivery' as const,
    label: 'Envío a domicilio',
    description: 'Se calcula por distancia',
    Icon: Bike,
  },
];

export function DeliveryTypeSelector({ value, onChange, disabled = false }: DeliveryTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {OPTIONS.map(({ value: optionValue, label, description, Icon }) => {
        const selected = value === optionValue;
        return (
          <button
            key={optionValue}
            type="button"
            disabled={disabled}
            onClick={() => onChange(optionValue)}
            aria-pressed={selected}
            className={`flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition ${
              selected
                ? 'border-[#D95A2B] bg-orange-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Icon size={20} className={selected ? 'text-[#D95A2B]' : 'text-[#757575]'} />
            <span className="font-semibold text-sm text-[#212121]">{label}</span>
            <span className="text-xs text-[#757575]">{description}</span>
          </button>
        );
      })}
    </div>
  );
}
