import { Metadata } from "next"
import { DeliveryContent } from "@/src/components/delivery/delivery-content"

export const metadata: Metadata = {
  title: "Repartidores",
}

export default function DeliveryPage() {
  return <DeliveryContent />
}
