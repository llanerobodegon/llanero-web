import { Metadata } from "next"
import { InventoryContent } from "@/src/components/inventory/inventory-content"

export const metadata: Metadata = {
  title: "Inventario",
}

export default function InventoryPage() {
  return <InventoryContent />
}
