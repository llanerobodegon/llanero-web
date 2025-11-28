import { Metadata } from "next";
import { WarehousesContent } from "@/src/components/warehouses/warehouses-content";

export const metadata: Metadata = {
  title: "Bodegones",
};

export default function WarehousesPage() {
  return <WarehousesContent />;
}
