"use client"

import * as React from "react"
import { Label, Pie, PieChart, Sector } from "recharts"
import { type PieSectorDataItem } from "recharts/types/polar/Pie"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { DeliveryTypeStats } from "@/src/services/dashboard.service"

// Variaciones del color primario de la app (hue 17 = rojo-marrón)
// Light: primary = oklch(0.33 0.15 17)
const chartConfig = {
  count: { label: "Pedidos" },
  delivery: {
    label: "Delivery",
    theme: {
      light: "oklch(0.33 0.15 17)",   // primary exact
      dark: "oklch(0.65 0.18 17)",    // más claro sobre fondo oscuro
    },
  },
  pickup: {
    label: "Pickup",
    theme: {
      light: "oklch(0.58 0.13 17)",   // variación más clara
      dark: "oklch(0.45 0.13 17)",    // más oscuro sobre fondo oscuro
    },
  },
} satisfies ChartConfig

interface DeliveryTypeChartProps {
  deliveryTypeStats: DeliveryTypeStats
  isLoading: boolean
}

export function DeliveryTypeChart({ deliveryTypeStats, isLoading }: DeliveryTypeChartProps) {
  const id = "pie-delivery-type"
  const [activeType, setActiveType] = React.useState<"delivery" | "pickup">("delivery")

  const pieData = React.useMemo(() => [
    { type: "delivery", count: deliveryTypeStats.delivery, fill: "var(--color-delivery)" },
    { type: "pickup", count: deliveryTypeStats.pickup, fill: "var(--color-pickup)" },
  ], [deliveryTypeStats])

  const activeIndex = React.useMemo(
    () => pieData.findIndex((item) => item.type === activeType),
    [activeType, pieData]
  )

  const total = deliveryTypeStats.delivery + deliveryTypeStats.pickup

  if (isLoading) {
    return (
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <Skeleton className="h-[220px] w-[220px] rounded-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card data-chart={id} className="bg-muted/30 flex flex-col">
      <ChartStyle id={id} config={chartConfig} />
      <CardHeader className="flex-row items-start space-y-0 pb-0">
        <div className="grid gap-1">
          <CardTitle className="text-base">Pickup vs Delivery</CardTitle>
          <CardDescription>
            {total > 0 ? `${total} pedidos en el período` : "Sin pedidos en el período"}
          </CardDescription>
        </div>
        <Select value={activeType} onValueChange={(v) => setActiveType(v as "delivery" | "pickup")}>
          <SelectTrigger
            className="ml-auto h-7 w-[120px] rounded-lg pl-2.5"
            aria-label="Seleccionar tipo"
          >
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-xl">
            {(["delivery", "pickup"] as const).map((key) => (
              <SelectItem key={key} value={key} className="rounded-lg [&_span]:flex">
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className="flex h-3 w-3 shrink-0 rounded-xs"
                    style={{ backgroundColor: `var(--color-${key})` }}
                  />
                  {chartConfig[key].label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-4">
        <ChartContainer
          id={id}
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[260px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="type" />}
            />
            <Pie
              data={pieData}
              dataKey="count"
              nameKey="type"
              innerRadius={65}
              strokeWidth={5}
              activeIndex={activeIndex}
              activeShape={({ outerRadius = 0, ...props }: PieSectorDataItem) => (
                <g>
                  <Sector {...props} outerRadius={outerRadius + 10} />
                  <Sector
                    {...props}
                    outerRadius={outerRadius + 25}
                    innerRadius={outerRadius + 12}
                  />
                </g>
              )}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {pieData[activeIndex].count.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-sm"
                        >
                          {chartConfig[activeType].label}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
