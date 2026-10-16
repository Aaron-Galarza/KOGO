// ============================================================
// Presentación del estado de pago de un pedido (texto + tono visual).
//
// Fuente única para el cliente: la usa la página de retorno de MP y la de
// confirmación, para que ambas cuenten lo mismo y nunca mientan sobre el pago.
// ============================================================

export type PaymentTone = 'success' | 'warning' | 'danger';

export interface PaymentPresentation {
  tone: PaymentTone;
  title: string;
  message: string;
  /** true = conviene ofrecer reintentar el pago / avisar por WhatsApp. */
  recovery: boolean;
}

export interface PaymentLike {
  paymentMethod: string;
  paymentStatus?: string | null;
}

/**
 * @param verifying true mientras todavía se está verificando el pago con el
 *   backend (no conviene anunciar "no cobrado" hasta terminar de verificar).
 */
export function paymentPresentation(
  order: PaymentLike,
  opts: { verifying: boolean }
): PaymentPresentation {
  const ps = order.paymentStatus ?? 'not_required';

  // Efectivo / transferencia: se cobran al retirar/entregar, no online.
  if (order.paymentMethod !== 'mercadopago') {
    return {
      tone: 'success',
      title: '¡Gracias por tu pedido!',
      message: 'Te avisaremos por WhatsApp cuando esté listo.',
      recovery: false,
    };
  }

  switch (ps) {
    case 'approved':
      return {
        tone: 'success',
        title: '¡Pago aprobado!',
        message: 'Gracias por tu pedido. Te avisaremos por WhatsApp cuando esté listo.',
        recovery: false,
      };
    case 'refunded':
      return {
        tone: 'warning',
        title: 'Pago reembolsado',
        message: 'El pago de este pedido fue devuelto.',
        recovery: false,
      };
    case 'rejected':
      return {
        tone: 'danger',
        title: 'El pago no se completó',
        message: 'Mercado Pago rechazó el pago. Podés reintentar ahora o avisarnos por WhatsApp.',
        recovery: true,
      };
    case 'cancelled':
      return {
        tone: 'danger',
        title: 'El pago no se realizó',
        message: 'No quedó registrado el pago de este pedido. Podés intentarlo de nuevo o escribirnos por WhatsApp.',
        recovery: true,
      };
    default:
      // pending / in_process
      return opts.verifying
        ? {
            tone: 'warning',
            title: 'Estamos confirmando tu pago',
            message: 'Mercado Pago todavía no acreditó el pago. Esta pantalla se actualiza sola.',
            recovery: false,
          }
        : {
            tone: 'warning',
            title: 'Tu pedido no fue cobrado',
            message:
              'No registramos el pago de Mercado Pago. Podés reintentar el pago ahora o avisarnos por WhatsApp y lo coordinamos.',
            recovery: true,
          };
  }
}
