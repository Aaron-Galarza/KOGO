'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAdminOrders, updateOrderStatus } from '@/services/admin.service';
import { socketService } from '@/services/socket.service';
import { Order } from '@/types';

export function usePedidos() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [range, setRange] = useState('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const updatingIdRef = useRef<string | null>(null);
  const getCurrentUpdatingId = () => updatingIdRef.current;
  const setCurrentUpdatingId = (id: string | null) => {
    updatingIdRef.current = id;
    setUpdatingId(id);
  };
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(() => {
    if (range === 'custom' && (!customFrom || !customTo)) return;
    setLoading(true);
    fetchAdminOrders(status || undefined, range, customFrom || undefined, customTo || undefined)
      .then((data) => setOrders(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, range, customFrom, customTo]);

  useEffect(() => {
    socketService.initialize();
    socketService.joinKitchen();
    fetchOrders();

    const u1 = socketService.onOrderUpdated((d) => {
      setOrders((prev) => {
        if (d.orderId === getCurrentUpdatingId()) return prev;
        const updated = prev.map((o) => o._id === d.orderId ? { ...o, status: d.status } : o);
        if (status) return updated.filter((o) => o.status === status);
        return updated;
      });
    });
    const u2 = socketService.onOrderDeleted((d) => {
      setOrders((prev) => prev.filter((o) => o._id !== d.orderId));
    });
    const u3 = socketService.onOrderCreated((order) => {
      setOrders((prev) => [order, ...prev]);
    });
    return () => { u1(); u2(); u3(); socketService.leaveKitchen(); };
  }, [status, range, customFrom, customTo, fetchOrders]);

  const updateStatus = useCallback(async (id: string, newStatus: string) => {
    setUpdatingId(id); setCurrentUpdatingId(id);
    try {
      await updateOrderStatus(id, newStatus);
      setOrders((prev) => {
        const updated = prev.map((o) => o._id === id ? { ...o, status: newStatus as Order['status'] } : o);
        if (status) return updated.filter((o) => o.status === status);
        return updated;
      });
    } catch {
      setError('Error al actualizar estado');
    } finally {
      setUpdatingId(null); setCurrentUpdatingId(null);
    }
  }, [status]);

  return { orders, loading, status, setStatus, range, setRange, customFrom, setCustomFrom, customTo, setCustomTo, updatingId, error, updateStatus };
}
