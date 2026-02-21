"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface FeaturedProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: { stars: number; numberOfRatings: number };
  category: string;
  ageRange: string;
}

export function Chat() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("chat-messages");
      if (saved) {
        try { return JSON.parse(saved); } catch { /* ignore */ }
      }
    }
    return [];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [popular, setPopular] = useState<FeaturedProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    sessionStorage.setItem("chat-messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const ask = searchParams.get("ask");
    if (ask) {
      setInput(ask);
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    fetch("/api/products/featured")
      .then((res) => res.json())
      .then((data) => {
        setPopular(data.popular);
        setCategories(data.categories);
      })
      .catch(() => {});
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-purple-600">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
    };
    setMessages([...updatedMessages, assistantMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                assistantContent += parsed.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: assistantContent,
                  };
                  return updated;
                });
              }
            } catch {
              // skip unparseable chunks
            }
          }
        }
      }
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: "Sorry, something went wrong. Please try again.",
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }

  function productIdFromImage(src: string | undefined): string | null {
    if (!src) return null;
    const match = src.match(/\/product-images\/(toy-\d+)\./);
    return match ? match[1] : null;
  }

  function formatCategory(cat: string) {
    return cat
      .split(/[-&]/)
      .map((w) => w.trim())
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" & ");
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" onClick={() => { setMessages([]); setInput(""); sessionStorage.removeItem("chat-messages"); }}>
          <img src="/product-images/wonder-toys-logo.png" alt="Wonder Toys" className="w-8 h-8" />
          <h1 className="text-xl font-bold text-purple-800">Wonder Toys</h1>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {session.user?.name || session.user?.email}
          </span>
          <button
            onClick={() => signOut()}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🎁</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Welcome to Wonder Toys!
            </h2>
            <p className="text-gray-500 mb-6">
              I can help you find toys, answer questions about products, place
              orders, and check order status.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {[
                "What toys do you have for a 5-year-old?",
                "Show me STEM toys",
                "I need a gift for a toddler",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="text-sm bg-purple-50 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Popular Products */}
            {popular.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Popular Right Now
                </h3>
                <div className="grid grid-cols-5 gap-3">
                  {popular.map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      className="bg-white border border-gray-200 rounded-xl p-3 hover:border-purple-300 hover:shadow-md transition-all text-left group block"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full aspect-square object-cover rounded-lg mb-2"
                      />
                      <div className="text-sm font-medium text-gray-800 truncate group-hover:text-purple-700">
                        {product.name}
                      </div>
                      <div className="text-sm font-semibold text-purple-600">
                        ${product.price.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {"★".repeat(Math.round(product.rating.stars))}{" "}
                        {product.rating.stars.toFixed(1)}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Browse by Category
                </h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() =>
                        setInput(`Show me ${formatCategory(cat)} toys`)
                      }
                      className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full hover:bg-purple-50 hover:text-purple-700 transition-colors"
                    >
                      {formatCategory(cat)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-purple-600 text-white"
                  : "bg-white border border-gray-200 text-gray-800"
              }`}
            >
              {message.role === "user" ? (
                <div className="whitespace-pre-wrap">{message.content}</div>
              ) : (
                <div className="prose prose-sm prose-gray max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 prose-headings:my-2 prose-pre:bg-gray-100 prose-pre:text-gray-800 prose-code:text-purple-600 prose-code:before:content-none prose-code:after:content-none">
                  <ReactMarkdown
                    components={{
                      img: ({ src, alt }) => {
                        const productId = productIdFromImage(src);
                        const image = (
                          <img
                            src={src}
                            alt={alt || "Product image"}
                            className="rounded-xl w-40 h-40 object-cover border border-gray-200 shadow-sm not-prose"
                          />
                        );
                        return productId ? (
                          <Link href={`/product/${productId}`}>{image}</Link>
                        ) : (
                          image
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.content === "" && (
          <div className="flex justify-start mb-4">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <form
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about toys, search products, or check your orders..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
