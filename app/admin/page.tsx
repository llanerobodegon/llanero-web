import { Metadata } from "next";
import { DashboardContent } from "@/src/components/dashboard/dashboard-content";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function AdminPage() {
  return <DashboardContent />;
}
