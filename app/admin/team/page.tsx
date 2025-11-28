import { Metadata } from "next"
import { TeamContent } from "@/src/components/team/team-content"

export const metadata: Metadata = {
  title: "Equipo",
}

export default function TeamPage() {
  return <TeamContent />
}
