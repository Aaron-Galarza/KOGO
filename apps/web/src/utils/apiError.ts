// Mensaje de error legible para cualquier fallo de la API (axios o Error común).

interface ApiErrorShape {
  response?: {
    data?: {
      error?: unknown;
      message?: unknown;
    };
  };
}

export function getApiError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const response = (err as ApiErrorShape).response;
    const apiMessage = response?.data?.error ?? response?.data?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage;
    if (err instanceof Error && err.message) return err.message;
  }
  return fallback;
}
