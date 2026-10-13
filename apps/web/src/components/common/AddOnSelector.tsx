import { cn } from '@/utils/cn';
import { SelectedAddOn, IAddOn } from '@/types';

interface AddOnSelectorProps {
  availableAddOns: IAddOn[];
  selectedAddOns: SelectedAddOn[];
  onToggle: (addon: IAddOn) => void;
  className?: string;
}

export function AddOnSelector({
  availableAddOns,
  selectedAddOns,
  onToggle,
  className = '',
}: AddOnSelectorProps) {
  if (availableAddOns.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {availableAddOns.map((addon) => {
        const isSelected = selectedAddOns.some((s) => s._id === addon._id);
        return (
          <button
            key={addon._id}
            onClick={() => onToggle(addon)}
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all duration-200',
              isSelected
                ? 'border-[#D9383A] bg-[#D9383A] text-white'
                : 'border-[#e0e0e0] bg-white text-[#757575] hover:border-[#D9383A]'
            )}
          >
            {addon.name || (addon as any).title}
          </button>
        );
      })}
    </div>
  );
}
