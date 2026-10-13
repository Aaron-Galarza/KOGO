'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchAdminOrders, updateOrderStatus } from '@/services/admin.service';
import { socketService } from '@/services/socket.service';
import { Order } from '@/types';

export function useKitchenOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const updatingIdRef = useRef<string | null>(null);

  useEffect(() => {
    socketService.initialize();
    socketService.joinKitchen();

    fetchAdminOrders('pending,confirmed,preparing,ready', 'today')
      .then(setOrders)
      .catch(() => setError('Error al cargar ordenes'))
      .finally(() => setLoading(false));

    const unsub1 = socketService.onOrderUpdated((data) => {
      if (data.orderId === updatingIdRef.current) return;
      setOrders((prev) => prev.map((o) => o._id === data.orderId ? { ...o, status: data.status } : o));
    });
    const unsub2 = socketService.onOrderDeleted((data) => {
      setOrders((prev) => prev.filter((o) => o._id !== data.orderId));
    });
    const unsub3 = socketService.onOrderCreated((order) => {
      setOrders((prev) => [order, ...prev]);
    });

    return () => { unsub1(); unsub2(); unsub3(); socketService.leaveKitchen(); };
  }, []);

  const updateStatus = useCallback(async (orderId: string, status: string) => {
    updatingIdRef.current = orderId;
    try {
      await updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status: status as Order['status'] } : o));
    } catch { setError('Error al actualizar'); }
    finally { updatingIdRef.current = null; }
  }, []);

  return { orders, loading, error, updateStatus };
}
