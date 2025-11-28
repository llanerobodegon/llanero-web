import { Metadata } from "next"
import { CustomersContent } from "@/src/components/customers/customers-content"

export const metadata: Metadata = {
  title: "Clientes",
}

export default function CustomersPage() {
  return <CustomersContent />
}
