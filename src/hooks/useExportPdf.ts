"use client"

import { useRef, useState, useCallback } from "react"

export function useExportPdf() {
  const printRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  const exportPdf = useCallback(async (filename: string) => {
    const element = printRef.current
    if (!element) return

    setIsExporting(true)

    try {
      // Collect all CSS rules from the current document
      const cssText = Array.from(document.styleSheets)
        .map((sheet) => {
          try {
            return Array.from(sheet.cssRules)
              .map((rule) => rule.cssText)
              .join("\n")
          } catch {
            return ""
          }
        })
        .join("\n")

      const printWindow = window.open("", "_blank", "width=850,height=700")
      if (!printWindow) {
        alert("No se pudo abrir la ventana de impresión. Permite ventanas emergentes para este sitio.")
        return
      }

      printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${filename}</title>
  <style>${cssText}</style>
  <style>
    body { margin: 0; padding: 0; background: white; }
    @media print {
      body { margin: 0; }
      @page { margin: 10mm; }
    }
  </style>
</head>
<body>${element.outerHTML}</body>
</html>`)
      printWindow.document.close()

      // Wait for images to load before printing
      const images = printWindow.document.querySelectorAll("img")
      const imagePromises = Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve()
        return new Promise<void>((resolve) => {
          img.onload = () => resolve()
          img.onerror = () => resolve()
        })
      })
      await Promise.all(imagePromises)

      // Small delay to ensure styles are applied
      await new Promise((resolve) => setTimeout(resolve, 300))

      printWindow.print()
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setIsExporting(false)
    }
  }, [])

  return { printRef, isExporting, exportPdf }
}
