import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import app from './app';
import { connectDB } from './config/db';
import { DEFAULT_PORT, ALLOWED_ORIGINS } from './constants';

declare global {
  var io: Server | undefined;
}

dotenv.config();

const PORT = process.env.PORT || DEFAULT_PORT;
const JWT_SECRET = process.env.JWT_SECRET as string;

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true,
  },
});

globalThis.io = io;

io.on('connection', (socket) => {
  const token = socket.handshake.auth?.token as string | undefined;
  let isAdmin = false;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { role?: string };
      isAdmin = decoded.role === 'admin';
    } catch {
      isAdmin = false;
    }
  }

  if (!isAdmin) {
    socket.disconnect(true);
    return;
  }

  socket.data.isAdmin = true;
  console.log(`✅ Admin conectado: ${socket.id}`);

  socket.on('join-kitchen', () => {
    if (!socket.data.isAdmin) {
      socket.disconnect(true);
      return;
    }
    socket.join('kitchen');
    console.log(`${socket.id} joined kitchen room`);
  });

  socket.on('leave-kitchen', () => {
    if (!socket.data.isAdmin) {
      socket.disconnect(true);
      return;
    }
    socket.leave('kitchen');
    console.log(`${socket.id} left kitchen room`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Admin desconectado: ${socket.id}`);
  });
});

const startServer = async () => {
  try {
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET no está configurado. Revisá apps/api/.env');
      process.exit(1);
    }

    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
    return { httpServer, io };
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

export { httpServer, io, startServer };
