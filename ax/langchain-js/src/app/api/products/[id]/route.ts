import { products } from "@/lib/inventory";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = products.find((p) => p.id === id);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: product.id,
    name: product.name,
    description: product.description,
    marketingCopy: product.marketingCopy,
    keywords: product.keywords,
    ageRange: `${product.ageRange.min}-${product.ageRange.max} years`,
    price: product.price,
    inventory: product.inventory,
    category: product.category,
    image: product.image,
    rating: product.rating,
    manufacturer: product.manufacturer,
    dimensions: product.dimensions,
    bestSellersRank: product.bestSellersRank,
  });
}
