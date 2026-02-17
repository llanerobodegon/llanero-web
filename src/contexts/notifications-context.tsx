"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { notificationsService, NotificationRow } from "@/src/services/notifications.service"

export type { NotificationRow as AppNotification }

interface NotificationsContextType {
  notifications: NotificationRow[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    oscillator.frequency.setValueAtTime(830, audioContext.currentTime)
    oscillator.type = "sine"
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)

    setTimeout(() => {
      const osc2 = audioContext.createOscillator()
      const gain2 = audioContext.createGain()
      osc2.connect(gain2)
      gain2.connect(audioContext.destination)
      osc2.frequency.setValueAtTime(1046, audioContext.currentTime)
      osc2.type = "sine"
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime)
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
      osc2.start(audioContext.currentTime)
      osc2.stop(audioContext.currentTime + 0.4)
    }, 150)
  } catch (err) {
    console.log("Could not play notification sound:", err)
  }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationRow[]>([])

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationsService.getAll()
      setNotifications(data)
    } catch (err) {
      console.error("Error fetching notifications:", err)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Realtime: subscribe to new notifications inserted by DB triggers
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const newNotif = payload.new as NotificationRow
          // Mark as unread since it just arrived
          const notifWithRead: NotificationRow = { ...newNotif, read: false }

          setNotifications((prev) => [notifWithRead, ...prev])

          playNotificationSound()

          const toastMessage = newNotif.title
          const toastDescription = newNotif.description ?? undefined

          if (newNotif.type === "order_created") {
            toast.info(toastMessage, { description: toastDescription, duration: 5000 })
          } else {
            toast.message(toastMessage, { description: toastDescription, duration: 4000 })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    await notificationsService.markAsRead(id)
  }, [])

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length === 0) return

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    await notificationsService.markAllAsRead(unreadIds)
  }, [notifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider")
  }
  return context
}
