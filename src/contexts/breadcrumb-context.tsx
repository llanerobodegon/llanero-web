"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface BreadcrumbOverride {
  segment: string
  label: string
}

interface BreadcrumbContextType {
  overrides: BreadcrumbOverride[]
  setOverride: (segment: string, label: string) => void
  clearOverrides: () => void
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined)

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<BreadcrumbOverride[]>([])

  const setOverride = (segment: string, label: string) => {
    setOverrides((prev) => {
      const existing = prev.find((o) => o.segment === segment)
      if (existing) {
        return prev.map((o) => (o.segment === segment ? { segment, label } : o))
      }
      return [...prev, { segment, label }]
    })
  }

  const clearOverrides = () => {
    setOverrides([])
  }

  return (
    <BreadcrumbContext.Provider value={{ overrides, setOverride, clearOverrides }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext)
  if (!context) {
    throw new Error("useBreadcrumb must be used within a BreadcrumbProvider")
  }
  return context
}
