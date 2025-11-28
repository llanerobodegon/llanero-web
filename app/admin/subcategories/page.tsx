import { Metadata } from "next";
import { SubcategoriesContent } from "@/src/components/subcategories/subcategories-content";

export const metadata: Metadata = {
  title: "Subcategorías",
};

export default function SubcategoriesPage() {
  return <SubcategoriesContent />;
}
