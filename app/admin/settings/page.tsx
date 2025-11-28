import { Metadata } from "next"
import { SettingsContent } from "@/src/components/settings/settings-content"

export const metadata: Metadata = {
  title: "Configuración",
}

export default function SettingsPage() {
  return <SettingsContent />
}
