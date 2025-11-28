"use client"

import { createClient } from "@/lib/supabase/client"
import { PaginationParams, PaginatedResponse } from "@/src/types/pagination"

const supabase = createClient()

export type OrderStatus = "pending" | "confirmed" | "preparing" | "on_delivery" | "delivered" | "completed" | "cancelled"
export type PaymentStatus = "pending" | "verified" | "rejected"
export type DeliveryType = "pickup" | "delivery"
export type PaymentMethodType = "pago_movil" | "transferencia" | "zelle" | "banesco_panama"

export interface OrderItem {
  id: string
  productId: string
  productName: string
  productImageUrl: string | null
  quantity: number
  unitPriceUsd: number
  unitPriceBs: number
  totalUsd: number
  totalBs: number
}

export interface OrderCustomer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  phoneCode: string | null
}

export interface OrderWarehouse {
  id: string
  name: string
}

export interface OrderAddress {
  id: string
  label: string | null
  address1: string
  address2: string | null
  city: string
}

export interface OrderDeliveryPerson {
  id: string
  firstName: string
  lastName: string
}

export interface Order {
  id: string
  orderNumber: string
  customer: OrderCustomer
  warehouse: OrderWarehouse
  address: OrderAddress | null
  deliveryPerson: OrderDeliveryPerson | null
  deliveryType: DeliveryType
  deliveryCode: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethodType: PaymentMethodType
  paymentBank: string | null
  paymentReference: string | null
  paymentProofUrl: string | null
  subtotalUsd: number
  subtotalBs: number
  deliveryFeeUsd: number
  deliveryFeeBs: number
  totalUsd: number
  totalBs: number
  exchangeRate: number
  customerNotes: string | null
  adminNotes: string | null
  confirmedAt: string | null
  deliveredAt: string | null
  cancelledAt: string | null
  cancellationReason: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

export interface OrderListItem {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  totalUsd: number
  totalBs: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  createdAt: string
}

export interface UpdateOrderData {
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  deliveryPersonId?: string | null
  adminNotes?: string | null
  cancellationReason?: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToOrderListItem(row: any): OrderListItem {
  const customer = row.users
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: customer ? `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || customer.email : "Sin cliente",
    customerEmail: customer?.email || "",
    totalUsd: parseFloat(row.total_usd),
    totalBs: parseFloat(row.total_bs),
    status: row.status,
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToOrder(row: any): Order {
  const customer = row.users
  const warehouse = row.warehouses
  const address = row.addresses
  const deliveryPerson = row.delivery_person

  return {
    id: row.id,
    orderNumber: row.order_number,
    customer: customer ? {
      id: customer.id,
      firstName: customer.first_name || "",
      lastName: customer.last_name || "",
      email: customer.email,
      phone: customer.phone,
      phoneCode: customer.phone_code,
    } : {
      id: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: null,
      phoneCode: null,
    },
    warehouse: warehouse ? {
      id: warehouse.id,
      name: warehouse.name,
    } : {
      id: "",
      name: "",
    },
    address: address ? {
      id: address.id,
      label: address.label,
      address1: address.address_1,
      address2: address.address_2,
      city: address.city,
    } : null,
    deliveryPerson: deliveryPerson ? {
      id: deliveryPerson.id,
      firstName: deliveryPerson.first_name || "",
      lastName: deliveryPerson.last_name || "",
    } : null,
    deliveryType: row.delivery_type,
    deliveryCode: row.delivery_code,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethodType: row.payment_method_type,
    paymentBank: row.payment_bank,
    paymentReference: row.payment_reference,
    paymentProofUrl: row.payment_proof_url,
    subtotalUsd: parseFloat(row.subtotal_usd),
    subtotalBs: parseFloat(row.subtotal_bs),
    deliveryFeeUsd: parseFloat(row.delivery_fee_usd || 0),
    deliveryFeeBs: parseFloat(row.delivery_fee_bs || 0),
    totalUsd: parseFloat(row.total_usd),
    totalBs: parseFloat(row.total_bs),
    exchangeRate: parseFloat(row.exchange_rate),
    customerNotes: row.customer_notes,
    adminNotes: row.admin_notes,
    confirmedAt: row.confirmed_at,
    deliveredAt: row.delivered_at,
    cancelledAt: row.cancelled_at,
    cancellationReason: row.cancellation_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: (row.order_items || []).map((item: {
      id: string
      product_id: string
      product_name: string
      product_image_url: string | null
      quantity: number
      unit_price_usd: string
      unit_price_bs: string
      total_usd: string
      total_bs: string
    }) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      productImageUrl: item.product_image_url,
      quantity: item.quantity,
      unitPriceUsd: parseFloat(item.unit_price_usd),
      unitPriceBs: parseFloat(item.unit_price_bs),
      totalUsd: parseFloat(item.total_usd),
      totalBs: parseFloat(item.total_bs),
    })),
  }
}

class OrdersService {
  async getPaginated(
    params: PaginationParams,
    filters?: { status?: OrderStatus; paymentStatus?: PaymentStatus }
  ): Promise<PaginatedResponse<OrderListItem>> {
    const { page, pageSize } = params
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Build count query
    let countQuery = supabase
      .from("orders")
      .select("*", { count: "exact", head: true })

    if (filters?.status) {
      countQuery = countQuery.eq("status", filters.status)
    }
    if (filters?.paymentStatus) {
      countQuery = countQuery.eq("payment_status", filters.paymentStatus)
    }

    const { count: totalCount, error: countError } = await countQuery

    if (countError) {
      console.error("Error counting orders:", countError)
      throw new Error("Failed to count orders")
    }

    // Build data query
    let dataQuery = supabase
      .from("orders")
      .select(`
        id,
        order_number,
        total_usd,
        total_bs,
        status,
        payment_status,
        created_at,
        users!orders_user_id_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (filters?.status) {
      dataQuery = dataQuery.eq("status", filters.status)
    }
    if (filters?.paymentStatus) {
      dataQuery = dataQuery.eq("payment_status", filters.paymentStatus)
    }

    const { data, error } = await dataQuery

    if (error) {
      console.error("Error fetching orders:", error)
      throw new Error("Failed to fetch orders")
    }

    const items: OrderListItem[] = (data || []).map(mapRowToOrderListItem)

    return {
      data: items,
      totalCount: totalCount || 0,
      page,
      pageSize,
      totalPages: Math.ceil((totalCount || 0) / pageSize),
    }
  }

  async getById(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        users!orders_user_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone,
          phone_code
        ),
        warehouses (
          id,
          name
        ),
        addresses (
          id,
          label,
          address_1,
          address_2,
          city
        ),
        delivery_person:users!orders_delivery_person_id_fkey (
          id,
          first_name,
          last_name
        ),
        order_items (
          id,
          product_id,
          product_name,
          product_image_url,
          quantity,
          unit_price_usd,
          unit_price_bs,
          total_usd,
          total_bs
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      console.error("Error fetching order:", error)
      throw new Error("Failed to fetch order")
    }

    return mapRowToOrder(data)
  }

  async update(id: string, data: UpdateOrderData): Promise<Order> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (data.status !== undefined) {
      updateData.status = data.status

      // Set timestamps based on status
      if (data.status === "confirmed") {
        updateData.confirmed_at = new Date().toISOString()
      } else if (data.status === "delivered") {
        updateData.delivered_at = new Date().toISOString()
      } else if (data.status === "cancelled") {
        updateData.cancelled_at = new Date().toISOString()
        if (data.cancellationReason) {
          updateData.cancellation_reason = data.cancellationReason
        }
      }
    }

    if (data.paymentStatus !== undefined) {
      updateData.payment_status = data.paymentStatus

      // If payment is verified, also confirm the order
      if (data.paymentStatus === "verified") {
        updateData.confirmed_at = new Date().toISOString()
        // Only update status if it's still pending
        const { data: currentOrder } = await supabase
          .from("orders")
          .select("status")
          .eq("id", id)
          .single()

        if (currentOrder?.status === "pending") {
          updateData.status = "confirmed"
        }
      }
    }

    if (data.deliveryPersonId !== undefined) {
      updateData.delivery_person_id = data.deliveryPersonId
    }

    if (data.adminNotes !== undefined) {
      updateData.admin_notes = data.adminNotes
    }

    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id)

    if (error) {
      console.error("Error updating order:", error)
      throw new Error("Failed to update order")
    }

    const order = await this.getById(id)
    if (!order) throw new Error("Failed to retrieve updated order")
    return order
  }

  async getDeliveryMembers(): Promise<{ id: string; name: string }[]> {
    const { data: deliveryRole } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "delivery")
      .single()

    if (!deliveryRole) return []

    const { data, error } = await supabase
      .from("users")
      .select("id, first_name, last_name")
      .eq("role_id", deliveryRole.id)
      .eq("is_active", true)
      .eq("delivery_status", "available")
      .order("first_name")

    if (error) {
      console.error("Error fetching delivery members:", error)
      return []
    }

    return (data || []).map((user) => ({
      id: user.id,
      name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
    }))
  }
}

export const ordersService = new OrdersService()

// Helper functions for display
export function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    preparing: "Preparando",
    on_delivery: "En Camino",
    delivered: "Entregado",
    completed: "Completado",
    cancelled: "Cancelado",
  }
  return labels[status] || status
}

export function getStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    pending: "bg-yellow-500",
    confirmed: "bg-blue-500",
    preparing: "bg-purple-500",
    on_delivery: "bg-indigo-500",
    delivered: "bg-green-500",
    completed: "bg-gray-500",
    cancelled: "bg-red-500",
  }
  return colors[status] || "bg-gray-400"
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    pending: "Pendiente",
    verified: "Verificado",
    rejected: "Rechazado",
  }
  return labels[status] || status
}

export function getPaymentStatusColor(status: PaymentStatus): string {
  const colors: Record<PaymentStatus, string> = {
    pending: "bg-yellow-500",
    verified: "bg-green-500",
    rejected: "bg-red-500",
  }
  return colors[status] || "bg-gray-400"
}

export function getDeliveryTypeLabel(type: DeliveryType): string {
  const labels: Record<DeliveryType, string> = {
    pickup: "Retiro en Bodegón",
    delivery: "Delivery",
  }
  return labels[type] || type
}

export function getPaymentMethodLabel(type: PaymentMethodType): string {
  const labels: Record<PaymentMethodType, string> = {
    pago_movil: "Pago Móvil",
    transferencia: "Transferencia",
    zelle: "Zelle",
    banesco_panama: "Banesco Panamá",
  }
  return labels[type] || type
}

export function formatCurrency(amount: number, currency: "USD" | "BS"): string {
  if (currency === "USD") {
    return `$${amount.toFixed(2)}`
  }
  return `Bs. ${amount.toFixed(2)}`
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
