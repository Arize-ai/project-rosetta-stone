import { products } from "@/lib/inventory";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BackButton } from "./back-button";
import { AddToCartButton } from "./add-to-cart-button";
import { ProductHeaderActions } from "./product-header-actions";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = products.find((p) => p.id === id);

  if (!product) {
    notFound();
  }

  const stars = product.rating.stars;
  const fullStars = Math.floor(stars);
  const hasHalf = stars - fullStars >= 0.5;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
        <BackButton />
        <Link href="/" className="flex items-center gap-2">
          <img src="/product-images/wonder-toys-logo.png" alt="Wonder Toys" className="w-8 h-8" />
          <span className="text-xl font-bold text-purple-800">Wonder Toys</span>
        </Link>
        <ProductHeaderActions />
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="md:flex">
            {/* Image */}
            <div className="md:w-1/2 p-6 flex items-center justify-center bg-gray-50">
              <img
                src={product.image}
                alt={product.name}
                className="w-full max-w-sm rounded-xl object-cover aspect-square"
              />
            </div>

            {/* Details */}
            <div className="md:w-1/2 p-6">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                {product.category}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-bold text-purple-600">
                  ${product.price.toFixed(2)}
                </span>
                <span className="text-sm text-gray-400">
                  Best Seller Rank #{product.bestSellersRank}
                </span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                <span className="text-yellow-400 text-lg">
                  {"★".repeat(fullStars)}
                  {hasHalf ? "½" : ""}
                  {"☆".repeat(5 - fullStars - (hasHalf ? 1 : 0))}
                </span>
                <span className="text-sm text-gray-500">
                  {stars.toFixed(1)} ({product.rating.numberOfRatings.toLocaleString()} ratings)
                </span>
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                <div>
                  <span className="text-gray-400">Ages</span>
                  <div className="font-medium text-gray-700">
                    {product.ageRange.min}–{product.ageRange.max} years
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Manufacturer</span>
                  <div className="font-medium text-gray-700">
                    {product.manufacturer}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Dimensions</span>
                  <div className="font-medium text-gray-700">
                    {product.dimensions.lengthInches} × {product.dimensions.widthInches} × {product.dimensions.heightInches} in
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Weight</span>
                  <div className="font-medium text-gray-700">
                    {product.dimensions.weightLbs} lbs
                  </div>
                </div>
              </div>

              {/* Stock */}
              <div className="mb-6">
                {product.inventory > 0 ? (
                  <span className="text-green-600 text-sm font-medium">
                    In Stock — {product.inventory} available
                  </span>
                ) : (
                  <span className="text-red-500 text-sm font-medium">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <AddToCartButton
                  productId={product.id}
                  name={product.name}
                  price={product.price}
                  image={product.image}
                />
                <Link
                  href={`/?ask=${encodeURIComponent(`Tell me about ${product.name}`)}`}
                  className="inline-block bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Ask about this product
                </Link>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="border-t border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">About this toy</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {product.description}
            </p>
            <p className="text-gray-600 leading-relaxed">{product.marketingCopy}</p>
          </div>

          {/* Keywords */}
          <div className="border-t border-gray-100 px-6 py-4">
            <div className="flex flex-wrap gap-2">
              {product.keywords.map((kw) => (
                <span
                  key={kw}
                  className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
