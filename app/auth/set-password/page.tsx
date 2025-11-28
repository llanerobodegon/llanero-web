import { Metadata } from "next";
import { SetPasswordForm } from "@/src/views/SetPasswordForm"

export const metadata: Metadata = {
  title: "Crear Contraseña",
};

export default function SetPasswordPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <img src="/llanero-logo.png" alt="Llanero Admin" className="h-10" />
        </a>
        <SetPasswordForm />
      </div>
    </div>
  )
}
