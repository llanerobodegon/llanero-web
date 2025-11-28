import { Metadata } from "next"
import { OrdersContent } from "@/src/components/orders/orders-content"

export const metadata: Metadata = {
  title: "Pedidos",
}

export default function OrdersPage() {
  return <OrdersContent />
}
