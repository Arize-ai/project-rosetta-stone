"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-purple-800 mb-2">
            Wonder Toys
          </h1>
          <p className="text-gray-600">
            Your AI-powered toy shopping assistant
          </p>
        </div>

        <div className="mb-6">
          <div className="text-6xl mb-4">🧸</div>
          <p className="text-sm text-gray-500">
            Sign in to start shopping for the perfect toys
          </p>
        </div>

        <button
          onClick={() => signIn("twitter", { callbackUrl: "/" })}
          className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Sign in with X
        </button>
      </div>
    </div>
  );
}
