import { Suspense } from "react"
import { Metadata } from "next"
import { ProductFormContent } from "@/src/components/inventory/product-form-content"

export const metadata: Metadata = {
  title: "Editar Producto",
}

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params
  return (
    <Suspense>
      <ProductFormContent productId={id} />
    </Suspense>
  )
}
