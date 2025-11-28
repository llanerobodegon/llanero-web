import { Metadata } from "next"
import { AccountContent } from "@/src/components/account/account-content"

export const metadata: Metadata = {
  title: "Configuración de cuenta",
}

export default function AccountPage() {
  return <AccountContent />
}
