"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

export function Navbar() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white px-4 py-3 md:px-[100px] md:py-4">
        <nav className="flex items-center justify-between">
          <Link href="/">
            <img src="/llanero-logo.png" alt="Llanero" className="h-7 md:h-8" />
          </Link>

          <Button className="rounded-full gap-2 text-sm md:text-base" size="sm" onClick={() => setIsModalOpen(true)}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Descargar App</span>
            <span className="sm:hidden">Descargar</span>
          </Button>
        </nav>
      </header>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative z-10 mx-4 w-full max-w-2xl rounded-3xl bg-background p-4 md:p-8 shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground">Descarga la App</h2>
              <p className="mt-2 text-muted-foreground">
                Escanea el código QR o haz clic para descargar
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {/* iOS Card */}
              <a
                href="https://apps.apple.com/br/app/llanero-bodeg%C3%B3n/id6752811237"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl"
              >
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
                <div className="relative flex gap-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://apps.apple.com/br/app/llanero-bodeg%C3%B3n/id6752811237"
                      alt="QR iOS"
                      className="h-full w-full"
                    />
                  </div>
                  <div className="flex flex-col justify-between py-1">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Para iOS</h3>
                      <p className="text-sm text-zinc-400">iOS 15.0+</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-zinc-500"
                      >
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                      </svg>
                      <span className="text-sm text-zinc-500">App Store</span>
                    </div>
                  </div>
                </div>
              </a>

              {/* Android Card */}
              <a
                href="https://play.google.com/store/apps/details?id=com.llanerobodegon.llanero"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl"
              >
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
                <div className="relative flex gap-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://play.google.com/store/apps/details?id=com.llanerobodegon.llanero"
                      alt="QR Android"
                      className="h-full w-full"
                    />
                  </div>
                  <div className="flex flex-col justify-between py-1">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Para Android</h3>
                      <p className="text-sm text-zinc-400">Android 8.0+</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-emerald-500"
                      >
                        <path d="M17.523 2.238a.844.844 0 0 0-1.156.294l-1.457 2.504a8.472 8.472 0 0 0-5.819 0L7.634 2.532a.844.844 0 1 0-1.45.862l1.33 2.286C5.299 7.095 3.75 9.461 3.75 12.188h16.5c0-2.727-1.549-5.093-3.764-6.508l1.33-2.286a.844.844 0 0 0-.293-1.156zM8.625 10.125a.938.938 0 1 1 0-1.875.938.938 0 0 1 0 1.875zm6.75 0a.938.938 0 1 1 0-1.875.938.938 0 0 1 0 1.875zM3.75 13.313v5.624a1.875 1.875 0 0 0 1.875 1.876h.938v2.343a.844.844 0 1 0 1.687 0v-2.343h1.875v2.343a.844.844 0 1 0 1.688 0v-2.343h1.874v2.343a.844.844 0 1 0 1.688 0v-2.343h.938a1.875 1.875 0 0 0 1.874-1.876v-5.624H3.75zm-2.063 0a.844.844 0 0 0-.843.844v4.687a.844.844 0 1 0 1.687 0v-4.687a.844.844 0 0 0-.844-.844zm20.626 0a.844.844 0 0 0-.844.844v4.687a.844.844 0 1 0 1.687 0v-4.687a.844.844 0 0 0-.843-.844z" />
                      </svg>
                      <span className="text-sm text-zinc-500">Google Play</span>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
