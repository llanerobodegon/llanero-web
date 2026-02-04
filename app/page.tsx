import { Navbar } from "@/components/landing/navbar";
import { PromoBanner } from "@/components/landing/promo-banner";
import { Hero } from "@/components/landing/hero";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/50">
      <Navbar />
      <PromoBanner />

      <main className="flex flex-col">
        <Hero />
      </main>

      <Footer />
    </div>
  );
}
