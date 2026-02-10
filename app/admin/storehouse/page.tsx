import { Metadata } from "next"
import { StorehouseContent } from "@/src/components/storehouse/storehouse-content"

export const metadata: Metadata = {
  title: "Almacén",
}

export default function StorehousePage() {
  return <StorehouseContent />
}
