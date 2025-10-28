import { notFound } from "next/navigation"
import { UsersView } from "@/components/admin/users-view"
import { SettingsView } from "@/components/admin/settings-view"
import { FilesView } from "@/components/admin/files-view"

interface AdminViewPageProps {
  params: Promise<{
    view: string
  }>
}

// Definir las vistas disponibles
const AVAILABLE_VIEWS = {
  users: UsersView,
  settings: SettingsView,
  files: FilesView,
} as const

export default async function AdminViewPage({ params }: AdminViewPageProps) {
  const { view } = await params
  
  // Verificar si la vista existe
  if (!(view in AVAILABLE_VIEWS)) {
    notFound()
  }

  // Obtener el componente de la vista
  const ViewComponent = AVAILABLE_VIEWS[view as keyof typeof AVAILABLE_VIEWS]

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <ViewComponent />
    </div>
  )
}

// Generar metadata dinámicamente
export async function generateMetadata({ params }: AdminViewPageProps) {
  const { view } = await params
  
  const titles = {
    users: "Usuarios",
    settings: "Configuración", 
    files: "Archivos",
  }

  return {
    title: `${titles[view as keyof typeof titles] || "Vista"} - Admin`,
  }
}