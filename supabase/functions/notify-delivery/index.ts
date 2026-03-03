import { createClient } from "jsr:@supabase/supabase-js@2"

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

interface RequestBody {
  order_id: string
  order_number: string
  delivery_person_id: string
}

Deno.serve(async (req: Request) => {
  try {
    const body: RequestBody = await req.json()
    const { order_id, order_number, delivery_person_id } = body

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
        title: "Nuevo pedido asignado",
        body: `Se te ha asignado el pedido #${order_number}`,
        data: { order_id, order_number },
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
