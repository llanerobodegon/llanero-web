import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function AdminPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
    </div>
  );
}
