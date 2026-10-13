import { Search } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar producto...',
  className = '',
}: SearchBarProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a0aec0]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[#cbd5e0] bg-white py-2.5 pl-10 pr-4 text-base text-[#2d3748] transition-shadow duration-200 placeholder:text-[#a0aec0] focus:border-[#e53e3e] focus:outline-none focus:ring-[3px] focus:ring-[rgba(229,62,62,0.2)]"
      />
    </div>
  );
}
