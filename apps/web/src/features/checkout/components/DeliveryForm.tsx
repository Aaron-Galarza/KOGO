'use client';

import { useCartStore } from '@/stores/cart.store';

interface DeliveryFormProps {
  disabled?: boolean;
}

export function DeliveryForm({ disabled = false }: DeliveryFormProps) {
  const deliveryType = useCartStore((s) => s.deliveryType);
  const setDeliveryType = useCartStore((s) => s.setDeliveryType);
  const deliveryAddress = useCartStore((s) => s.deliveryAddress);
  const setDeliveryAddressRaw = useCartStore((s) => s.setDeliveryAddress);
  const handleAddressChange = (value: string) => setDeliveryAddressRaw(value, { lat: 0, lng: 0 });

  const radioClass = (selected: boolean) =>
    `flex items-center p-3 border-2 rounded-lg cursor-pointer transition ${
      selected ? 'border-red-600 bg-red-50' : 'border-gray-200 hover:border-gray-300'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <h2 className="text-lg font-bold mb-4 font-[var(--font-montserrat)] text-[#212121]">Tipo de entrega</h2>
      <div className="space-y-3">
        <label className={radioClass(deliveryType === 'pickup')}>
          <input type="radio" name="delivery" value="pickup" checked={deliveryType === 'pickup'}
            onChange={(e) => setDeliveryType(e.target.value as 'pickup' | 'delivery')}
            className="mr-3 w-5 h-5 accent-red-600" disabled={disabled} />
          <div>
            <p className="font-semibold text-[#212121]">Retiro en el local</p>
            <p className="text-sm text-[#757575]">Retira sin costo</p>
          </div>
        </label>
        <label className={radioClass(deliveryType === 'delivery')}>
          <input type="radio" name="delivery" value="delivery" checked={deliveryType === 'delivery'}
            onChange={(e) => setDeliveryType(e.target.value as 'pickup' | 'delivery')}
            className="mr-3 w-5 h-5 accent-red-600" disabled={disabled} />
          <div>
            <p className="font-semibold text-[#212121]">A domicilio</p>
            <p className="text-sm text-[#757575]">Se calcula segun distancia</p>
          </div>
        </label>
      </div>
      {deliveryType === 'delivery' && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <label className="block text-sm font-semibold mb-2 text-[#212121]">Tu direccion</label>
          <input type="text" placeholder="Calle y numero, ciudad" value={deliveryAddress || ''}
            onChange={(e) => handleAddressChange(e.target.value.replace(/<[^>]*>/g, ''))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            maxLength={120}
            disabled={disabled} />
        </div>
      )}
    </div>
  );
}
