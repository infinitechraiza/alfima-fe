'use client';

import { useEffect } from 'react';

function urlBase64ToUint8Array(base64String: string) {

  if (!base64String) return new Uint8Array();
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function usePushNotification() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const setup = async () => {
      try {
        console.log('1️⃣ Registering SW...');
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ SW registered');

        console.log('2️⃣ Requesting permission...');
        const permission = await Notification.requestPermission();
        console.log('Permission:', permission);
        if (permission !== 'granted') return;

        console.log('3️⃣ Subscribing to push...');
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
          ) ?? undefined,
        });

        console.log('✅ Subscribed');

        const key  = subscription.getKey('p256dh');
        const auth = subscription.getKey('auth');

        console.log('4️⃣ Sending to Next.js proxy...');

        // 👇 Call Next.js API route instead of Laravel directly
        // This way the httpOnly cookie is automatically included
        const res = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            endpoint:   subscription.endpoint,
            public_key: key  ? btoa(String.fromCharCode(...new Uint8Array(key)))  : null,
            auth_token: auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : null,
          }),
        });

        console.log('Response status:', res.status);
        const data = await res.json();
        console.log('Response:', data);

      } catch (err) {
        console.error('❌ Push setup failed:', err);
      }
    };

    setup();
  }, []);
}