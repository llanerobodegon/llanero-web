"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { notificationsService, NotificationRow } from "@/src/services/notifications.service"

export type { NotificationRow as AppNotification }

interface NotificationsContextType {
  /** Pedidos que han llegado y siguen pendientes de revisar (los ya vistos no se listan). */
  notifications: NotificationRow[]
  unreadCount: number
  /** Quita una notificación de la lista (queda como vista para este usuario). */
  markAsRead: (id: string) => void
  /** "Limpiar": quita todas las pendientes. */
  clearAll: () => void
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
          // Solo los pedidos nuevos se avisan: suenan, muestran el aviso y quedan pendientes
          // en la campana. Los cambios de estado (que casi siempre hace el propio equipo desde
          // aquí) no generan aviso.
          if (newNotif.type !== "order_created") return

          setNotifications((prev) =>
            prev.some((n) => n.id === newNotif.id) ? prev : [{ ...newNotif, read: false }, ...prev]
          )
          playNotificationSound()
          toast.info(newNotif.title, {
            description: newNotif.description ?? undefined,
            duration: 8000,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Si no se pudo guardar, se vuelve a cargar la lista real en vez de dejarla desfasada.
  const markAsRead = useCallback(
    async (id: string) => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      try {
        await notificationsService.markAsRead(id)
      } catch (err) {
        console.error("Error marking notification as read:", err)
        fetchNotifications()
      }
    },
    [fetchNotifications]
  )

  const clearAll = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length === 0) return

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    try {
      await notificationsService.markAllAsRead(unreadIds)
    } catch (err) {
      console.error("Error clearing notifications:", err)
      toast.error("No se pudieron limpiar las notificaciones")
      fetchNotifications()
    }
  }, [notifications, fetchNotifications])

  // Solo las pendientes: una notificación vista o limpiada sale de la lista.
  const pending = notifications.filter((n) => !n.read)
  const unreadCount = pending.length

  return (
    <NotificationsContext.Provider value={{ notifications: pending, unreadCount, markAsRead, clearAll }}>
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
