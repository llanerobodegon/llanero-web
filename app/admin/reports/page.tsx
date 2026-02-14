import { Metadata } from "next";
import { ReportsContent } from "@/src/components/reports/reports-content";

export const metadata: Metadata = {
  title: "Reportes",
};

export default function ReportsPage() {
  return <ReportsContent />;
}
