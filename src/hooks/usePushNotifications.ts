import { useState, useEffect, useCallback } from 'react';
import { getVapidPublicKey, subscribePushApi, unsubscribePushApi, testPushNotificationApi } from '../services/api';
import { WebPushStatus } from '../domain/types';

/**
 * Converts a URL-safe Base64 string to a Uint8Array for PushManager subscription.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface UsePushNotificationsResult {
  status: WebPushStatus;
  isIOS: boolean;
  isLoading: boolean;
  error: string | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  sendTestNotification: () => Promise<{ dispatched: number; failed: number } | null>;
  clearError: () => void;
}

export function usePushNotifications(): UsePushNotificationsResult {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Detect platform features & standalone mode
  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    setIsSupported(supported);

    if (typeof window !== 'undefined') {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true;
      setIsStandalone(standalone);

      const ios =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);
      setIsIOS(ios);

      if ('Notification' in window) {
        setPermission(Notification.permission);
      }
    }
  }, []);

  // Check if browser already has an active push subscription
  useEffect(() => {
    if (!isSupported) return;

    let mounted = true;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (mounted) {
          setIsSubscribed(!!sub);
        }
      })
      .catch((err) => {
        console.warn('Could not inspect push subscription status:', err);
      });

    return () => {
      mounted = false;
    };
  }, [isSupported]);

  const clearError = useCallback(() => setError(null), []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Este navegador no soporta notificaciones Web Push.');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Request permission explicitly via user gesture
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        if (perm === 'denied') {
          setError('El permiso para notificaciones fue denegado en el navegador.');
        }
        setIsLoading(false);
        return false;
      }

      // 2. Fetch VAPID public key
      const vapidPublicKey = await getVapidPublicKey();
      if (!vapidPublicKey) {
        throw new Error('No se pudo obtener la clave pública VAPID del servidor.');
      }

      // 3. Obtain Service Worker registration
      const reg = await navigator.serviceWorker.ready;
      let subscription = await reg.pushManager.getSubscription();

      // 4. Create new push subscription if not already present
      if (!subscription) {
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as unknown as BufferSource,
        });
      }

      // 5. Send subscription endpoint & keys to backend
      const subJson = subscription.toJSON();
      const p256dh = subJson.keys?.p256dh;
      const auth = subJson.keys?.auth;
      if (!p256dh || !auth) {
        throw new Error('La suscripción push no contiene las claves criptográficas necesarias.');
      }

      await subscribePushApi({
        endpoint: subscription.endpoint,
        keys: {
          p256dh,
          auth,
        },
        userAgent: navigator.userAgent,
      });

      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Error subscribing to push notifications:', err);
      setError(err?.message || 'Error al suscribirse a las notificaciones.');
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    setIsLoading(true);
    setError(null);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        try {
          await unsubscribePushApi(sub.endpoint);
        } catch (apiErr) {
          console.warn('Backend unsubscribe failed, continuing local unsubscribe:', apiErr);
        }
        await sub.unsubscribe();
      }

      setIsSubscribed(false);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Error unsubscribing from push notifications:', err);
      setError(err?.message || 'Error al cancelar la suscripción.');
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  const sendTestNotification = useCallback(async () => {
    try {
      return await testPushNotificationApi({
        title: 'Aura: Notificación de prueba',
        message: '¡Excelente! Las alertas Web Push de Aura están configuradas en este dispositivo.',
        url: '/#eventos',
      });
    } catch (err: any) {
      console.error('Error sending test push notification:', err);
      setError(err?.message || 'Error al enviar notificación de prueba.');
      return null;
    }
  }, []);

  return {
    status: {
      isSupported,
      isSubscribed,
      permission,
      isStandalone,
    },
    isIOS,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
    clearError,
  };
}
