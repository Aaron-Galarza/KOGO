// ============================================================
// Caché en memoria con expiración (TTL) y tope de entradas.
//
// Objetivo: que una misma consulta a un proveedor pago (Google) se resuelva
// sin volver a gastar cuota. Es deliberadamente simple: sin dependencias y con
// limpieza de las entradas más viejas al alcanzar el tope.
// ============================================================

interface Entry<V> {
  value: V;
  expiresAt: number;
}

export class TtlCache<V> {
  private store = new Map<string, Entry<V>>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries = 500
  ) {}

  get(key: string): V | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: V): void {
    if (this.store.size >= this.maxEntries) {
      // Map conserva el orden de inserción: se descarta la entrada más antigua.
      const oldest = this.store.keys().next();
      if (!oldest.done) this.store.delete(oldest.value);
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  get size(): number {
    return this.store.size;
  }
}

// ============================================================
// Contador de consumo mensual.
//
// Protege la capa gratuita: si se alcanza el tope, se deja de llamar al
// proveedor (se responde con lo cacheado o un aviso) en vez de seguir gastando.
// ============================================================

export class MonthlyCounter {
  private month = '';
  private count = 0;
  private capped = false;

  constructor(private readonly limitPerMonth: number) {}

  private currentMonth(): string {
    const now = new Date();
    return `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`;
  }

  private sync(): void {
    const month = this.currentMonth();
    if (month !== this.month) {
      this.month = month;
      this.count = 0;
      this.capped = false;
    }
  }

  /** true si todavía se puede llamar al proveedor. */
  canConsume(): boolean {
    this.sync();
    return this.count < this.limitPerMonth;
  }

  consume(): void {
    this.sync();
    this.count += 1;
    if (this.count >= this.limitPerMonth) this.capped = true;
  }

  /** Reintegra un consumo que no llegó a concretarse (error del proveedor). */
  refund(): void {
    this.sync();
    if (this.count > 0) this.count -= 1;
    if (this.count < this.limitPerMonth) this.capped = false;
  }

  snapshot(): { count: number; limit: number; capped: boolean } {
    this.sync();
    return { count: this.count, limit: this.limitPerMonth, capped: this.capped };
  }
}
