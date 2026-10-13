export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(price);
};

export const formatCurrency = formatPrice;

export const formatDistance = (km: number): string => {
  return `${km.toFixed(1)} km`;
};

export const formatOrderNumber = (id: string): string => {
  return `#${id.substring(id.length - 4).toUpperCase()}`;
};

export function formatDate(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatTime(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatDateTime(date: Date | string | undefined): string {
  if (!date) return '';
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function parsePromoText(text: string): string {
  let result = text;
  result = result.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/##([^#]+)##/g, '<span style="color:#e53e3e">$1</span>');
  return result;
}