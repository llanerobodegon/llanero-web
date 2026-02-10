import { Metadata } from "next"
import { ProductFormContent } from "@/src/components/inventory/product-form-content"

export const metadata: Metadata = {
  title: "Agregar Producto",
}

export default function AddProductPage() {
  return <ProductFormContent />
}
