import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-12 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-block mb-6">
            <span className="bg-[#75010e]/10 text-[#75010e] px-4 py-2 rounded-full text-sm font-medium">
              El bodegón #1 del estado Lara 🔥
            </span>
          </div>

          {/* Título principal */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Toda la experiencia{" "}
            <span className="block">
              <span className="bg-gradient-to-r from-[#75010e] to-[#a0011a] bg-clip-text text-transparent">
                Llanero
              </span>{" "}
              en tu bolsillo
            </span>
          </h1>

          {/* Subtítulo */}
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Descubre bodegones y restaurantes cerca de ti, disfruta de ofertas exclusivas y sigue tus pedidos en tiempo real.
          </p>

          {/* Botones de descarga */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button className="bg-black text-white hover:bg-gray-800 rounded-xl px-6 py-3 h-14 flex items-center gap-3 text-base font-medium shadow-sm">
              <svg className="w-9 h-9" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Descargar en App Store
            </Button>

            <Button className="bg-black text-white hover:bg-gray-800 rounded-xl px-6 py-3 h-14 flex items-center gap-3 text-base font-medium shadow-sm">
              <svg className="w-9 h-9" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
              Obtener en Google Play
            </Button>
          </div>

          {/* Slider de logos */}
          <div className="relative overflow-hidden py-4">
            {/* Gradiente izquierdo */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
            {/* Gradiente derecho */}
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

            <div className="flex animate-scroll gap-6">
              {/* Primera serie de logos */}
              <div className="flex gap-6 shrink-0">
                <div className="w-56 h-32 flex items-center justify-center shrink-0">
                  <Image
                    src="https://zykwuzuukrmgztpgnbth.supabase.co/storage/v1/object/public/adminapp/locations/Location_s-09.png"
                    alt="Partner 1"
                    width={224}
                    height={128}
                    className="object-contain"
                  />
                </div>
                <div className="w-56 h-32 flex items-center justify-center shrink-0">
                  <Image
                    src="https://zykwuzuukrmgztpgnbth.supabase.co/storage/v1/object/public/adminapp/locations/location-01.png"
                    alt="Partner 2"
                    width={224}
                    height={128}
                    className="object-contain"
                  />
                </div>
                <div className="w-56 h-32 flex items-center justify-center shrink-0">
                  <Image
                    src="https://zykwuzuukrmgztpgnbth.supabase.co/storage/v1/object/public/adminapp/locations/location-02.png"
                    alt="Partner 3"
                    width={224}
                    height={128}
                    className="object-contain"
                  />
                </div>
                <div className="w-56 h-32 flex items-center justify-center shrink-0">
                  <Image
                    src="https://zykwuzuukrmgztpgnbth.supabase.co/storage/v1/object/public/adminapp/locations/location-03.png"
                    alt="Partner 4"
                    width={224}
                    height={128}
                    className="object-contain"
                  />
                </div>
                <div className="w-56 h-32 flex items-center justify-center shrink-0">
                  <Image
                    src="https://zykwuzuukrmgztpgnbth.supabase.co/storage/v1/object/public/adminapp/locations/location-04.png"
                    alt="Partner 5"
                    width={224}
                    height={128}
                    className="object-contain"
                  />
                </div>
                <div className="w-56 h-32 flex items-center justify-center shrink-0">
                  <Image
                    src="https://zykwuzuukrmgztpgnbth.supabase.co/storage/v1/object/public/adminapp/locations/location-05.png"
                    alt="Partner 6"
                    width={224}
                    height={128}
                    className="object-contain"
                  />
                </div>
                <div className="w-56 h-32 flex items-center justify-center shrink-0">
                  <Image
                    src="https://zykwuzuukrmgztpgnbth.supabase.co/storage/v1/object/public/adminapp/locations/location-06.png"
                    alt="Partner 7"
                    width={224}
                    height={128}
                    className="object-contain"
                  />
                </div>
                <div className="w-56 h-32 flex items-center justify-center shrink-0">
                  <Image
                    src="https://zykwuzuukrmgztpgnbth.supabase.co/storage/v1/object/public/adminapp/locations/location-07.png"
                    alt="Partner 8"
                    width={224}
                    height={128}
                    className="object-contain"
                  />
                </div>
              </div>
              {/* Segunda serie de logos (duplicada para loop infinito) */}
              <div className="flex gap-6 shrink-0">
                <div className="w-56 h-32 flex items-center justify-center shrink-0">
                  <Image
                    src="https://zykwuzuukrmgztpgnbth.supabase.co/storage/v1/object/public/adminapp/locations/Location_s-09.png"
                    alt="Partner 1"
                    width={224}
                    height={128}
                    className="object-contain"
                  />
                </div>
                <div className="w-56 h-32 flex items-center justify-center shrink-0">
                  <Image
                    src="https://zykwuzuukrmgztpgnbth.supabase.co/storage/v1/object/public/adminapp/locations/location-01.png"
                    alt="Partner 2"
                    width={224}
                    height={128}
                    className="object-contain"
                  />
                </div>
                <div className="w-56 h-32 flex items-center justify-center shrink-0">
                  <Image
                    src="https://zykwuzuukrmgztpgnbth.supabase.co/storage/v1/object/public/adminapp/locations/location-02.png"
                    alt="Partner 3"
                    width={224}
                    height={128}
                    className="object-contain"
                  />
                </div>
                <div className="w-56 h-32 flex items-center justify-center shrink-0">
                  <Image
                    src="https://zykwuzuukrmgztpgnbth.supabase.co/storage/v1/object/public/adminapp/locations/location-03.png"
                    alt="Partner 4"
                    width={224}
                    height={128}
                    className="object-contain"
                  />
                </div>
                <div className="w-56 h-32 flex items-center justify-center shrink-0">
                  <Image
                    src="https://zykwuzuukrmgztpgnbth.supabase.co/storage/v1/object/public/adminapp/locations/location-04.png"
                    alt="Partner 5"
                    width={224}
                    height={128}
                    className="object-contain"
                  />
                </div>
                <div className="w-56 h-32 flex items-center justify-center shrink-0">
                  <Image
                    src="https://zykwuzuukrmgztpgnbth.supabase.co/storage/v1/object/public/adminapp/locations/location-05.png"
                    alt="Partner 6"
                    width={224}
                    height={128}
                    className="object-contain"
                  />
                </div>
                <div className="w-56 h-32 flex items-center justify-center shrink-0">
                  <Image
                    src="https://zykwuzuukrmgztpgnbth.supabase.co/storage/v1/object/public/adminapp/locations/location-06.png"
                    alt="Partner 7"
                    width={224}
                    height={128}
                    className="object-contain"
                  />
                </div>
                <div className="w-56 h-32 flex items-center justify-center shrink-0">
                  <Image
                    src="https://zykwuzuukrmgztpgnbth.supabase.co/storage/v1/object/public/adminapp/locations/location-07.png"
                    alt="Partner 8"
                    width={224}
                    height={128}
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de mockups de teléfonos */}
      <section className="relative pb-0 overflow-hidden h-[420px] md:h-[480px]">
        {/* Fondo con degradado */}
        <div className="absolute bottom-0 left-0 right-0 h-[70%] bg-gradient-to-t from-[#75010e]/20 via-[#75010e]/10 to-transparent"></div>

        <div className="container mx-auto px-6 relative h-full">
          <div className="flex items-start justify-center gap-4 md:gap-8 max-w-6xl mx-auto h-full pt-0">
            {/* Teléfono izquierdo */}
            <div className="flex-shrink-0 transform translate-y-12 md:translate-y-16">
              <div className="w-52 md:w-64 h-[420px] md:h-[520px] bg-black rounded-[2.5rem] md:rounded-[3rem] p-2 shadow-2xl">
                <div className="w-full h-full bg-gradient-to-b from-gray-100 to-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden relative">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 md:w-32 h-5 md:h-6 bg-black rounded-b-2xl z-10"></div>

                  {/* Placeholder para contenido de app */}
                  <div className="p-4 md:p-6 pt-10 md:pt-12 h-full flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <div className="w-20 h-20 md:w-24 md:h-24 mx-auto bg-gray-200 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl md:text-4xl">📱</span>
                      </div>
                      <p className="text-xs md:text-sm text-gray-500 font-medium">App Screenshot 1</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Teléfono central (más grande) */}
            <div className="flex-shrink-0 z-10">
              <div className="w-60 md:w-80 h-[550px] md:h-[700px] bg-black rounded-[2.5rem] md:rounded-[3rem] p-2 shadow-2xl">
                <div className="w-full h-full bg-gradient-to-b from-gray-100 to-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden relative">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 md:w-36 h-5 md:h-6 bg-black rounded-b-2xl z-10"></div>

                  {/* Placeholder para contenido de app */}
                  <div className="p-5 md:p-8 pt-12 md:pt-14 h-full flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-28 h-28 md:w-32 md:h-32 mx-auto bg-gray-200 rounded-2xl flex items-center justify-center">
                        <span className="text-5xl md:text-6xl">📱</span>
                      </div>
                      <p className="text-sm md:text-base text-gray-500 font-medium">Main App Screenshot</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Teléfono derecho */}
            <div className="flex-shrink-0 transform translate-y-12 md:translate-y-16">
              <div className="w-52 md:w-64 h-[420px] md:h-[520px] bg-black rounded-[2.5rem] md:rounded-[3rem] p-2 shadow-2xl">
                <div className="w-full h-full bg-gradient-to-b from-gray-100 to-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden relative">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 md:w-32 h-5 md:h-6 bg-black rounded-b-2xl z-10"></div>

                  {/* Placeholder para contenido de app */}
                  <div className="p-4 md:p-6 pt-10 md:pt-12 h-full flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <div className="w-20 h-20 md:w-24 md:h-24 mx-auto bg-gray-200 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl md:text-4xl">📱</span>
                      </div>
                      <p className="text-xs md:text-sm text-gray-500 font-medium">App Screenshot 3</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
