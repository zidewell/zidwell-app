'use server'

import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js';

// Define type for push subscription with keys
interface PushSubscriptionWithKeys {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Initialize Supabase admin client with service role key
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize webpush with VAPID details
webpush.setVapidDetails(
  'mailto:' + process.env.EMAIL_USER!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// Subscribe user to push notifications
export async function subscribeUser(sub: PushSubscriptionWithKeys) {
  try {
    console.log('Attempting to subscribe...')

    // Store subscription in Supabase
    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .insert({
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      })

    if (error) {
      // If duplicate, update instead
      if (error.code === '23505') { // Unique violation
        const { error: updateError } = await supabaseAdmin
          .from('push_subscriptions')
          .update({
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
            updated_at: new Date().toISOString()
          })
          .eq('endpoint', sub.endpoint)

        if (updateError) throw updateError
      } else {
        throw error
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error subscribing:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to subscribe' }
  }
}

// Unsubscribe user from push notifications
export async function unsubscribeUser(endpoint: string) {
  try {
    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error unsubscribing:', error)
    return { success: false, error: 'Failed to unsubscribe' }
  }
}

// Send notification to all subscribers (for admin use)
export async function sendNotificationToAll(message: string) {
  try {
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')

    if (subError) throw subError
    if (!subscriptions || subscriptions.length === 0) {
      throw new Error('No subscriptions found')
    }

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify({
            title: 'Zidwell',
            body: message,
            icon: '/icon-192x192.png',
            badge: '/icon-72x72.png',
            data: {
              url: '/',
              date: Date.now(),
            },
          })
        )
      })
    )

    // Remove invalid subscriptions
    const failedSubscriptions = results
      .map((result, index) => ({ result, index }))
      .filter(({ result }) => result.status === 'rejected')

    if (failedSubscriptions.length > 0) {
      const invalidEndpoints = failedSubscriptions.map(
        ({ index }) => subscriptions[index].endpoint
      )
      
      await supabaseAdmin
        .from('push_subscriptions')
        .delete()
        .in('endpoint', invalidEndpoints)
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending notification:', error)
    return { success: false, error: 'Failed to send notification' }
  }
}