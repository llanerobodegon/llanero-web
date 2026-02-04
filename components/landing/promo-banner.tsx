import { Truck, ArrowRight } from "lucide-react";

export function PromoBanner() {
  return (
    <div className="fixed top-[52px] md:top-[64px] left-0 right-0 z-40 bg-gradient-to-r from-primary via-primary/90 to-primary">
      <div className="flex items-center justify-center gap-3 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-medium text-primary-foreground">
          <Truck className="h-4 w-4" />
          <span>
            <strong>Delivery GRATIS</strong> en tu primer pedido
          </span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
