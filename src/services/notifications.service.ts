import { createClient } from "@/lib/supabase/client"

export interface NotificationRow {
  id: string
  type: "order_created" | "order_updated"
  title: string
  description: string | null
  reference_id: string | null
  warehouse_id: string | null
  metadata: Record<string, unknown>
  created_at: string
  read: boolean
}

const supabase = createClient()

export const notificationsService = {
  async getAll(): Promise<NotificationRow[]> {
    // La campana avisa de pedidos que han llegado; los cambios de estado no se listan.
    const { data: notifs, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("type", "order_created")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) throw error

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !notifs) return []

    // Get read state for current user
    const notifIds = notifs.map((n) => n.id)
    const { data: reads } = await supabase
      .from("notification_reads")
      .select("notification_id")
      .eq("user_id", user.id)
      .in("notification_id", notifIds)

    const readSet = new Set((reads ?? []).map((r) => r.notification_id))

    return notifs.map((n) => ({ ...n, read: readSet.has(n.id) }))
  },

  async markAsRead(notificationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // `ignoreDuplicates`: si ya estaba marcada no se intenta actualizar la fila (las reglas
    // de la tabla solo permiten insertar y leer las propias).
    const { error } = await supabase
      .from("notification_reads")
      .upsert(
        { notification_id: notificationId, user_id: user.id },
        { onConflict: "notification_id,user_id", ignoreDuplicates: true }
      )
    if (error) throw error
  },

  async markAllAsRead(notificationIds: string[]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || notificationIds.length === 0) return

    const { error } = await supabase
      .from("notification_reads")
      .upsert(
        notificationIds.map((id) => ({ notification_id: id, user_id: user.id })),
        { onConflict: "notification_id,user_id", ignoreDuplicates: true }
      )
    if (error) throw error
  },
}
