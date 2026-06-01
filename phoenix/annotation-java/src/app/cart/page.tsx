"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartContext";
import { CartIcon } from "@/components/CartIcon";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();

  function handleCheckout() {
    const itemList = items
      .map((i) => `${i.quantity}x ${i.name}`)
      .join(", ");
    clearCart();
    router.push(`/?ask=${encodeURIComponent(`I'd like to purchase: ${itemList}`)}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/product-images/wonder-toys-logo.png" alt="Wonder Toys" className="w-8 h-8" />
          <h1 className="text-xl font-bold text-purple-800">Wonder Toys</h1>
        </Link>
        <CartIcon />
      </header>

      <div className="max-w-3xl mx-auto w-full px-4 py-8 flex-1">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h2>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🛒</div>
            <p className="text-gray-500 mb-4">Your cart is empty</p>
            <Link
              href="/"
              className="inline-block bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4"
                >
                  <Link href={`/product/${item.productId}`}>
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.productId}`}
                      className="font-medium text-gray-900 hover:text-purple-700 truncate block"
                    >
                      {item.name}
                    </Link>
                    <div className="text-purple-600 font-semibold">
                      ${item.price.toFixed(2)}
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium text-gray-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      +
                    </button>
                  </div>

                  {/* Line total */}
                  <div className="text-right w-20">
                    <div className="font-semibold text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-purple-600">
                  ${cartTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/"
                  className="flex-1 text-center border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Continue Shopping
                </Link>
                <button
                  onClick={handleCheckout}
                  className="flex-1 bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Checkout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
