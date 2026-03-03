import { createClient } from "jsr:@supabase/supabase-js@2"

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
const EXPO_BATCH_SIZE = 100

interface RequestBody {
  order_id: string
  order_number: string
  warehouse_id: string
  total_usd: number
}

interface ExpoPushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: string
  priority?: string
}

async function sendExpoBatch(messages: ExpoPushMessage[]) {
  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
    body: JSON.stringify(messages),
  })
  return response.json()
}

Deno.serve(async (req: Request) => {
  try {
    const body: RequestBody = await req.json()
    const { order_id, order_number, warehouse_id, total_usd } = body

    if (!order_id || !order_number || !warehouse_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // Get all admins with push token enabled
    const { data: admins } = await supabase
      .from("users")
      .select("push_token")
      .eq("role_id", 2)
      .eq("app_notification", true)
      .not("push_token", "is", null)

    // Get managers assigned to this warehouse with push token enabled
    const { data: managers } = await supabase
      .from("warehouse_users")
      .select("users!inner(push_token, app_notification, role_id)")
      .eq("warehouse_id", warehouse_id)
      .eq("users.role_id", 3)
      .eq("users.app_notification", true)
      .not("users.push_token", "is", null)

    // Collect all tokens (deduplicated)
    const tokenSet = new Set<string>()

    for (const admin of admins ?? []) {
      if (admin.push_token) tokenSet.add(admin.push_token)
    }
    for (const wu of managers ?? []) {
      const user = wu.users as { push_token: string | null }
      if (user?.push_token) tokenSet.add(user.push_token)
    }

    if (tokenSet.size === 0) {
      return new Response(JSON.stringify({ message: "No recipients found" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Build push messages
    const tokens = Array.from(tokenSet)
    const messages: ExpoPushMessage[] = tokens.map((token) => ({
      to: token,
      title: "Nuevo pedido recibido",
      body: `Pedido #${order_number} por $${total_usd.toFixed(2)}`,
      data: { order_id, order_number, warehouse_id },
      sound: "default",
      priority: "high",
    }))

    // Send in batches of 100
    const results = []
    for (let i = 0; i < messages.length; i += EXPO_BATCH_SIZE) {
      const batch = messages.slice(i, i + EXPO_BATCH_SIZE)
      const result = await sendExpoBatch(batch)
      results.push(result)
    }

    return new Response(
      JSON.stringify({ success: true, recipients: tokens.length, results }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("notify-order-created error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
