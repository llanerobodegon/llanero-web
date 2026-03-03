import { createClient } from "jsr:@supabase/supabase-js@2"

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

interface RequestBody {
  order_id: string
  order_number: string
  user_id: string
  new_status: string
}

const STATUS_MESSAGES: Record<string, { title: string; body: (orderNumber: string) => string }> = {
  confirmed: {
    title: "Pedido confirmado",
    body: (n) => `Tu pedido #${n} ha sido confirmado y está siendo preparado`,
  },
  on_delivery: {
    title: "Pedido en camino",
    body: (n) => `Tu pedido #${n} está en camino, pronto llegará`,
  },
  completed: {
    title: "Pedido entregado",
    body: (n) => `Tu pedido #${n} ha sido entregado. ¡Buen provecho!`,
  },
  cancelled: {
    title: "Pedido cancelado",
    body: (n) => `Tu pedido #${n} ha sido cancelado`,
  },
}

Deno.serve(async (req: Request) => {
  try {
    const body: RequestBody = await req.json()
    const { order_id, order_number, user_id, new_status } = body

    if (!order_id || !order_number || !user_id || !new_status) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Only notify for relevant status changes
    const message = STATUS_MESSAGES[new_status]
    if (!message) {
      return new Response(JSON.stringify({ message: "Status does not trigger notification" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // Get customer push token
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("push_token, app_notification")
      .eq("id", user_id)
      .single()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (!user.app_notification || !user.push_token) {
      return new Response(JSON.stringify({ message: "Notifications disabled or no token" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Send push notification
    const response = await fetch(EXPO_PUSH_URL, {
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
        data: { order_id, order_number, status: new_status },
        sound: "default",
        priority: "high",
      }),
    })

    const expoResult = await response.json()

    return new Response(JSON.stringify({ success: true, expo: expoResult }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("notify-order-status error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
