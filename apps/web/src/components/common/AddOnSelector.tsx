import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/format';
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
                ? 'border-[#D95A2B] bg-[#D95A2B] text-white'
                : 'border-[#e0e0e0] bg-white text-[#757575] hover:border-[#D95A2B]'
            )}
          >
            {addon.title}
            {addon.price > 0 ? ` +${formatCurrency(addon.price)}` : ''}
          </button>
        );
      })}
    </div>
  );
}
