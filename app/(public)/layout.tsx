import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Barra superior negra */}
      <div className="bg-black text-white text-center py-2.5 text-sm sticky top-0 z-50">
        Envío gratis en tus primeros 3 pedidos - Usa el código: <span className="font-semibold">LLANERO3</span>
      </div>

      {/* Header con navegación */}
      <header className="bg-white border-b sticky top-[34px] z-50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="https://zykwuzuukrmgztpgnbth.supabase.co/storage/v1/object/public/adminapp/Llanero%20Logo.png"
                alt="Llanero Logo"
                width={120}
                height={120}
                className="w-28 h-28 object-contain"
              />
            </Link>

            {/* Botón Descargar */}
            <Button
              asChild
              className="bg-[#75010e] hover:bg-[#5a010b] text-white rounded-full px-6 py-2 font-medium"
            >
              <Link href="/auth">Descargar</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer público */}
      <footer className="bg-gray-50 py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <Image
                src="https://zykwuzuukrmgztpgnbth.supabase.co/storage/v1/object/public/adminapp/Llanero%20Logo.png"
                alt="Llanero Logo"
                width={60}
                height={60}
                className="w-15 h-15 object-contain"
              />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex gap-6 text-sm text-gray-600">
                <Link href="/terminos" className="hover:text-gray-900 transition-colors">Términos</Link>
                <Link href="/privacidad" className="hover:text-gray-900 transition-colors">Privacidad</Link>
                <a href="mailto:soporte@llanero.app" className="hover:text-gray-900 transition-colors">Contacto</a>
              </div>
              <p className="text-sm text-gray-500">
                © 2025 Llanero. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}