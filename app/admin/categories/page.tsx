import { Metadata } from "next";
import { CategoriesContent } from "@/src/components/categories/categories-content";

export const metadata: Metadata = {
  title: "Categorías",
};

export default function CategoriesPage() {
  return <CategoriesContent />;
}
