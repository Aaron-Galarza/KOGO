import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { requestLogger } from './middlewares/logger.middleware';
import { apiLimiter } from './middlewares/rateLimit.middleware';
import { ALLOWED_ORIGINS } from './constants';

const app: Express = express();

// En producción la API siempre está detrás de un proxy (Render, Railway, nginx)
// y en desarrollo no debería haber X-Forwarded-For. Por defecto se confía en un
// hop (`1`): si no, express-rate-limit no puede identificar la IP real y dispara
// el ValidationError ERR_ERL_UNEXPECTED_X_FORWARDED_FOR. Se puede desactivar con
// TRUST_PROXY=false.
const trustProxyValue = process.env.TRUST_PROXY ?? '1';
app.set('trust proxy', trustProxyValue === 'false' ? false : Number(trustProxyValue));

// Middlewares de seguridad
app.use(helmet());

// Rate limit global por IP
app.use('/api', apiLimiter);

// CORS
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger
app.use(requestLogger);

// Routes
app.use('/api', routes);

// 404 para rutas no encontradas
app.use('/api', (_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
  });
});

// Error handler (al final de todos)
app.use(errorHandler);

export default app;
