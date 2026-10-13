import { getSocket, initializeSocket } from '@/lib/socket-client';

export const socketService = {
  initialize: initializeSocket,

  joinKitchen: () => { initializeSocket().emit('join-kitchen'); },
  leaveKitchen: () => { getSocket()?.emit('leave-kitchen'); },

  onOrderUpdated: (callback: (data: any) => void) => {
    const s = initializeSocket();
    s.on('order-updated', callback);
    return () => { s.off('order-updated', callback); };
  },

  onOrderCreated: (callback: (data: any) => void) => {
    const s = initializeSocket();
    s.on('order-created', callback);
    return () => { s.off('order-created', callback); };
  },

  onOrderDeleted: (callback: (data: any) => void) => {
    const s = initializeSocket();
    s.on('order-deleted', callback);
    return () => { s.off('order-deleted', callback); };
  },
};
