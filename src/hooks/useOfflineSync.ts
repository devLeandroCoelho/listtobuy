'use client';

import { useEffect, useState, useCallback } from 'react';
import localforage from 'localforage';
import { useOnlineStatus } from './useOnlineStatus';

interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  method: string;
  body?: unknown;
  timestamp: number;
}

const PENDING_QUEUE_KEY = 'pending_sync_queue';

export function useOfflineSync() {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const getQueue = useCallback(async (): Promise<PendingAction[]> => {
    try {
      const queue = await localforage.getItem<PendingAction[]>(PENDING_QUEUE_KEY);
      return queue || [];
    } catch {
      return [];
    }
  }, []);

  const setQueue = useCallback(async (queue: PendingAction[]) => {
    await localforage.setItem(PENDING_QUEUE_KEY, queue);
    setPendingCount(queue.length);
  }, []);

  const addToQueue = useCallback(async (action: Omit<PendingAction, 'id' | 'timestamp'>) => {
    const queue = await getQueue();
    const newAction: PendingAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
    };
    queue.push(newAction);
    await setQueue(queue);
  }, [getQueue, setQueue]);

  const processQueue = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      const queue = await getQueue();
      if (queue.length === 0) return;

      const failed: PendingAction[] = [];

      for (const action of queue) {
        try {
          const response = await fetch(action.endpoint, {
            method: action.method,
            headers: { 'Content-Type': 'application/json' },
            body: action.body ? JSON.stringify(action.body) : undefined,
          });

          if (!response.ok) {
            failed.push(action);
          }
        } catch {
          failed.push(action);
        }
      }

      await setQueue(failed);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, getQueue, setQueue]);

  useEffect(() => {
    if (!isOnline) return;
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await processQueue();
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isOnline, processQueue]);

  useEffect(() => {
    getQueue().then((queue) => setPendingCount(queue.length));
  }, [getQueue]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    addToQueue,
    processQueue,
  };
}