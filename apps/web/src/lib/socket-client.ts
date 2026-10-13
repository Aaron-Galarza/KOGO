import io, { Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';

let socket: Socket | null = null;

export const initializeSocket = (): Socket => {
  if (socket) return socket;
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const token = useAuthStore.getState().getToken();
  socket = io(url, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });
  return socket;
};

export const getSocket = (): Socket | null => socket;

export const closeSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};
