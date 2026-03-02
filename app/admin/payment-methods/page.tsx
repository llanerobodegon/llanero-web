import { Metadata } from "next"
import { BankAccountsContent } from "@/src/components/payment-methods/bank-accounts-content"

export const metadata: Metadata = {
  title: "Métodos de Pago",
}

export default function PaymentMethodsPage() {
  return <BankAccountsContent />
}
