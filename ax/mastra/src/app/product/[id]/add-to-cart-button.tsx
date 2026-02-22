"use client";

import { useState } from "react";
import { useCart } from "@/components/CartContext";

interface Props {
  productId: string;
  name: string;
  price: number;
  image: string;
}

export function AddToCartButton({ productId, name, price, image }: Props) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      onClick={() => {
        addToCart({ productId, name, price, image });
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
      className="inline-block bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors"
    >
      {added ? "Added!" : "Add to Cart"}
    </button>
  );
}
