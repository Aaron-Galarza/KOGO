import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { requestLogger } from './middlewares/logger.middleware';
import { apiLimiter } from './middlewares/rateLimit.middleware';
import { ALLOWED_ORIGINS } from './constants';

const app: Express = express();

// En producción la API suele estar detrás de un proxy (Render, Railway, nginx).
// Sin esto, todas las peticiones se ven como una sola IP y el rate limit se dispara.
const trustProxyValue = process.env.TRUST_PROXY ?? (process.env.NODE_ENV === 'production' ? '1' : 'false');
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
