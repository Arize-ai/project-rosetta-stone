import { products } from "@/lib/inventory";
import { NextResponse } from "next/server";

export async function GET() {
  const popular = [...products]
    .sort((a, b) => a.bestSellersRank - b.bestSellersRank)
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      rating: p.rating,
      category: p.category,
      ageRange: `${p.ageRange.min}-${p.ageRange.max} years`,
    }));

  const categories = [...new Set(products.map((p) => p.category))].sort();

  return NextResponse.json({ popular, categories });
}
