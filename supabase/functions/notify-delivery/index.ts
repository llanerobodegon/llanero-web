import { createClient } from "jsr:@supabase/supabase-js@2"

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

interface RequestBody {
  order_id: string
  order_number: string
  delivery_person_id: string
  /** Qué se le avisa al repartidor. Sin este campo se asume `assigned` (llamadas antiguas). */
  type?: "assigned" | "cancelled"
}

const MESSAGES: Record<string, { title: string; body: (orderNumber: string) => string }> = {
  assigned: {
    title: "Nuevo pedido asignado",
    body: (n) => `Se te ha asignado el pedido #${n}`,
  },
  cancelled: {
    title: "Pedido cancelado",
    body: (n) => `El pedido #${n} fue cancelado. Ya no tienes que entregarlo`,
  },
}

Deno.serve(async (req: Request) => {
  try {
    const body: RequestBody = await req.json()
    const { order_id, order_number, delivery_person_id } = body
    const type = body.type && MESSAGES[body.type] ? body.type : "assigned"
    const message = MESSAGES[type]

    if (!order_id || !order_number || !delivery_person_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // Get delivery person push token
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("push_token, app_notification, first_name")
      .eq("id", delivery_person_id)
      .single()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Delivery person not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Skip if user has disabled notifications or has no token
    if (!user.app_notification || !user.push_token) {
      return new Response(JSON.stringify({ message: "Notifications disabled or no token" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Send push notification via Expo
    const expoPushResponse = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify({
        to: user.push_token,
        title: message.title,
        body: message.body(order_number),
        data: { order_id, order_number, type },
        sound: "default",
        priority: "high",
      }),
    })

    const expoResult = await expoPushResponse.json()

    return new Response(JSON.stringify({ success: true, expo: expoResult }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("notify-delivery error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
