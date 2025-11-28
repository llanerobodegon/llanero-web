import { Metadata } from "next"
import { PaymentMethodsContent } from "@/src/components/payment-methods/payment-methods-content"

export const metadata: Metadata = {
  title: "Métodos de Pago",
}

export default function PaymentMethodsPage() {
  return <PaymentMethodsContent />
}
