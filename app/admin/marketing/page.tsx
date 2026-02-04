import { Metadata } from "next";
import { MarketingContent } from "@/src/components/marketing/marketing-content";

export const metadata: Metadata = {
  title: "Marketing",
};

export default function MarketingPage() {
  return <MarketingContent />;
}
