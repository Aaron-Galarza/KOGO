import rateLimit from 'express-rate-limit';

const standardResponse = {
  success: false,
  error: 'Demasiadas peticiones. Intentá de nuevo más tarde',
};

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: standardResponse,
  // El webhook de Mercado Pago se excluye: MP reintenta y no debe bloquearse.
  skip: (req) => req.path === '/payments/webhook',
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: standardResponse,
});

export const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: standardResponse,
});

// Inicio de pagos online: más laxo que crear pedidos, pero acotado.
export const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: standardResponse,
});
