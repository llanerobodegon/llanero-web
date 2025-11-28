import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing env vars:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!serviceRoleKey
    })
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function getDeliveryRoleId(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>) {
  const { data } = await supabaseAdmin
    .from("roles")
    .select("id")
    .eq("name", "delivery")
    .single()

  return data?.id || null
}

export async function DELETE(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("id")

    if (!userId) {
      return NextResponse.json(
        { error: "ID de usuario requerido" },
        { status: 400 }
      )
    }

    // Delete warehouse assignments first
    await supabaseAdmin
      .from("warehouse_users")
      .delete()
      .eq("user_id", userId)

    // Delete user from users table
    const { error: deleteUserError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", userId)

    if (deleteUserError) {
      console.error("Error deleting user profile:", deleteUserError)
      return NextResponse.json(
        { error: "Error al eliminar el perfil del usuario" },
        { status: 500 }
      )
    }

    // Delete user from auth
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteAuthError) {
      console.error("Error deleting auth user:", deleteAuthError)
      return NextResponse.json(
        { error: "Error al eliminar el usuario de autenticación" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error inesperado" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phoneCode,
      phone,
      deliveryStatus,
      warehouseIds,
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    // Get delivery role ID
    const deliveryRoleId = await getDeliveryRoleId(supabaseAdmin)

    if (!deliveryRoleId) {
      return NextResponse.json(
        { error: "Rol de repartidor no encontrado" },
        { status: 500 }
      )
    }

    // Invite user by email - they will receive an email to set their password
    console.log("Inviting delivery user with email:", email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: "delivery",
        },
      }
    )

    if (authError) {
      console.error("Error inviting user:", authError)
      console.error("Auth error details:", JSON.stringify(authError, null, 2))
      if (authError.message?.includes("already been registered")) {
        return NextResponse.json(
          { error: "Este correo ya está registrado" },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: `Error al invitar el usuario: ${authError.message}` },
        { status: 500 }
      )
    }

    console.log("Delivery user invited successfully:", authData.user.id)

    const userId = authData.user.id

    // Check if user was created by trigger, if not insert manually
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", userId)
      .single()

    if (existingUser) {
      // Update the user record that was auto-created by the trigger
      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone_code: phoneCode || null,
          phone: phone || null,
          role_id: deliveryRoleId,
          is_active: true,
          delivery_status: deliveryStatus || "available",
        })
        .eq("id", userId)

      if (updateError) {
        console.error("Error updating user:", updateError)
        return NextResponse.json(
          { error: "Error al actualizar el usuario" },
          { status: 500 }
        )
      }
    } else {
      // Insert user manually (trigger may have failed or be disabled)
      const { error: insertError } = await supabaseAdmin
        .from("users")
        .insert({
          id: userId,
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone_code: phoneCode || null,
          phone: phone || null,
          role_id: deliveryRoleId,
          is_active: true,
          delivery_status: deliveryStatus || "available",
        })

      if (insertError) {
        console.error("Error inserting user:", insertError)
        return NextResponse.json(
          { error: "Error al crear el perfil del usuario" },
          { status: 500 }
        )
      }
    }

    // Assign warehouses if provided
    if (warehouseIds && warehouseIds.length > 0) {
      const warehouseAssignments = warehouseIds.map((warehouseId: string) => ({
        user_id: userId,
        warehouse_id: warehouseId,
      }))

      const { error: warehouseError } = await supabaseAdmin
        .from("warehouse_users")
        .insert(warehouseAssignments)

      if (warehouseError) {
        console.error("Error assigning warehouses:", warehouseError)
        // Don't fail the whole operation for warehouse assignment
      }
    }

    // Fetch the complete user data
    const { data: userData, error: fetchError } = await supabaseAdmin
      .from("users")
      .select(`
        *,
        roles (id, name, description),
        warehouse_users (
          warehouses (id, name)
        )
      `)
      .eq("id", userId)
      .single()

    if (fetchError) {
      console.error("Error fetching created user:", fetchError)
      return NextResponse.json(
        { error: "Usuario creado pero no se pudo obtener los datos" },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: userData }, { status: 201 })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error inesperado" },
      { status: 500 }
    )
  }
}
