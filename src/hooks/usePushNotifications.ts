'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

const isSupported =
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'PushManager' in window

export function usePushNotifications(eventId: string) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)

  // Initialise: read current permission state and check existing subscription
  useEffect(() => {
    if (!isSupported) {
      setLoading(false)
      return
    }

    setPermission(Notification.permission)

    if (Notification.permission !== 'granted') {
      setLoading(false)
      return
    }

    navigator.serviceWorker.ready
      .then(async (registration) => {
        const subscription = await registration.pushManager.getSubscription()
        if (!subscription) {
          setIsSubscribed(false)
          return
        }

        // Check if this endpoint is saved for this specific event
        const supabase = createClient()
        const { data } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('event_id', eventId)
          .eq('endpoint', subscription.endpoint)
          .maybeSingle()

        setIsSubscribed(!!data)
      })
      .catch(() => setIsSubscribed(false))
      .finally(() => setLoading(false))
  }, [eventId])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false

    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return false

      // Register (or re-use existing) service worker
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      await navigator.serviceWorker.ready

      // Get or create the PushSubscription for this browser
      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidPublicKey) {
          console.error('[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set')
          return false
        }
        const keyBytes = urlBase64ToUint8Array(vapidPublicKey)
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyBytes.buffer as ArrayBuffer,
        })
      }

      const { endpoint, keys } = subscription.toJSON() as {
        endpoint: string
        keys: { p256dh: string; auth: string }
      }

      const supabase = createClient()
      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          event_id: eventId,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
        { onConflict: 'event_id,endpoint' }
      )

      if (error) {
        console.error('[push] Failed to save subscription:', error.message)
        return false
      }

      setIsSubscribed(true)
      return true
    } catch (err) {
      console.error('[push] subscribe error:', err)
      return false
    }
  }, [eventId])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        const supabase = createClient()
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('event_id', eventId)
          .eq('endpoint', subscription.endpoint)
      }

      setIsSubscribed(false)
      return true
    } catch (err) {
      console.error('[push] unsubscribe error:', err)
      return false
    }
  }, [eventId])

  return {
    permission,
    isSubscribed,
    isSupported,
    loading,
    subscribe,
    unsubscribe,
  }
}
