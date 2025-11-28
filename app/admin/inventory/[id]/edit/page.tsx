import { ProductFormContent } from "@/src/components/inventory/product-form-content"

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params
  return <ProductFormContent productId={id} />
}
