import { TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatPercentage(value: number): string {
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(1)}%`
}

interface StatCardProps {
  title: string
  value: string
  change: number
  trendLabel: string
  detailText: string
}

export function StatCard({ title, value, change, trendLabel, detailText }: StatCardProps) {
  const isPositive = change >= 0
  const TrendIcon = isPositive ? TrendingUp : TrendingDown
  const changeColor = isPositive ? "text-green-600" : "text-red-600"

  return (
    <Card className="bg-muted/30 flex flex-col p-6">
      <CardContent className="p-0 flex flex-col flex-1">
        {/* Section 1: Title, value and percentage - aligned top */}
        <div className="mb-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{title}</span>
            <span className={`flex items-center gap-0.5 text-xs font-medium ${changeColor}`}>
              <TrendIcon className="h-3 w-3" />
              {formatPercentage(change)}
            </span>
          </div>
          <div className="text-3xl font-bold">{value}</div>
        </div>

        {/* Section 2: Trend and detail - aligned bottom */}
        <div className="mt-6">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-0.5">
            <span className="font-semibold">{trendLabel}</span>
            <TrendIcon className="h-4 w-4" />
          </div>
          <div className="text-xs text-muted-foreground">{detailText}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export function StatCardSkeleton() {
  return (
    <Card className="bg-muted/30">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-9 w-36 mb-4" />
        <Skeleton className="h-4 w-28 mb-1" />
        <Skeleton className="h-4 w-40" />
      </CardContent>
    </Card>
  )
}
