"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Menu,
  ShoppingCart,
  Minus,
  Plus,
  X,
  Package,
  LayoutGrid,
  Home,
  ReceiptText,
  User,
} from "lucide-react";
import { submitBuyerRequest } from "@/app/actions/buyer-requests";

interface ProductCard {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  packaging_price?: number | null;
  total_cases?: number | null;
  category_name?: string | null;
  brand_name?: string | null;
  packaging_type_name?: string | null;
  total_packaging?: string | null;
}

interface BuyerCatalogClientProps {
  products: ProductCard[];
  categories: string[];
  userInitials: string;
  userName: string;
  basePath?: string;
}

interface CartItem {
  product: ProductCard;
  quantity: number;
}

export default function BuyerCatalogClient({
  products,
  categories,
  userInitials,
  userName,
  basePath = "/buyer",
}: BuyerCatalogClientProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );
  const totalAmount = useMemo(
    () =>
      cartItems.reduce((sum, item) => {
        const price = item.product.packaging_price ?? 0;
        return sum + price * item.quantity;
      }, 0),
    [cartItems]
  );

  const normalizedBase = basePath.endsWith("/")
    ? basePath.slice(0, -1)
    : basePath;
  const isCustomerPath = normalizedBase === "/customers";
  const navLinks = {
    home: isCustomerPath ? "/customers" : `${normalizedBase}/dashboard`,
    catalog: isCustomerPath ? "/customers/catalog/products" : `${normalizedBase}/catalog`,
    orders: isCustomerPath ? "/customers/bookings" : `${normalizedBase}/dashboard`,
    account: isCustomerPath ? "/customers/profile" : `${normalizedBase}/dashboard`,
  };

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.brand_name?.toLowerCase().includes(term);
      const category = product.category_name || "Other";
      const matchesCategory =
        activeCategory === "All" || category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, activeCategory]);

  const updateQuantity = (product: ProductCard, delta: number) => {
    setCart((prev) => {
      const next = { ...prev };
      const current = next[product.id]?.quantity ?? 0;
      const newQty = current + delta;
      if (newQty <= 0) {
        delete next[product.id];
      } else {
        next[product.id] = { product, quantity: newQty };
      }
      return next;
    });
  };

  const handleRequest = (product: ProductCard) => {
    updateQuantity(product, 1);
  };

  const handleSubmitRequest = async () => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);
    const items = cartItems.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.product.packaging_price ?? 0,
    }));
    const result = await submitBuyerRequest(items);
    if (result?.success) {
      setCart({});
      setIsCartOpen(false);
      setNotice({ type: "success", message: "Request submitted successfully." });
    } else {
      setNotice({ type: "error", message: result?.error || "Failed to submit request." });
    }
    setIsSubmitting(false);
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-slate-50/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button className="h-10 w-10 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 flex items-center justify-center md:hidden">
              <Menu className="h-5 w-5 text-[#0061FF]" />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Buyer Catalog
              </p>
              <h1 className="text-lg font-extrabold font-[var(--font-manrope)] text-[#0061FF]">
                Vantage Pro
              </h1>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
            <Link href={navLinks.home} className="hover:text-[#0061FF] transition-colors">Home</Link>
            <Link href={navLinks.catalog} className="text-[#0061FF]">Catalog</Link>
            <Link href={navLinks.orders} className="hover:text-[#0061FF] transition-colors">Orders</Link>
            <Link href={navLinks.account} className="hover:text-[#0061FF] transition-colors">Account</Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200/60 md:flex">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                className="ml-2 w-56 bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder="Search products, brands..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative h-10 w-10 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 flex items-center justify-center"
            >
              <ShoppingCart className="h-5 w-5 text-[#0061FF]" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#0061FF] text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0061FF]/10 text-sm font-bold text-[#0061FF]">
              {userInitials}
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 pb-4 md:hidden">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-11 w-full rounded-2xl bg-white pl-11 pr-4 text-sm shadow-sm ring-1 ring-slate-200/60 outline-none placeholder:text-slate-400"
              placeholder="Search products, brands..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["All", ...categories].map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition ${
                  activeCategory === category
                    ? "bg-[#0061FF] text-white shadow-lg shadow-blue-500/30"
                    : "bg-white text-slate-500 shadow-sm ring-1 ring-slate-200/60"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-6">
        {notice && (
          <div
            className={`mb-4 rounded-2xl px-4 py-3 text-sm font-semibold ${
              notice.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {notice.message}
          </div>
        )}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => {
            const quantity = cart[product.id]?.quantity ?? 0;
            const label =
              product.total_packaging ||
              product.packaging_type_name ||
              "Per Case";
            const lowStock =
              typeof product.total_cases === "number" &&
              product.total_cases <= 5;

            return (
              <div
                key={product.id}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-lg"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-100">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <Package className="h-12 w-12" />
                    </div>
                  )}
                  {lowStock && (
                    <span className="absolute left-3 top-3 rounded-full bg-[#0061FF] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      Low stock
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {label}
                  </span>
                  <h3 className="mt-2 min-h-[2.5rem] text-sm font-semibold text-slate-900">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {product.brand_name || "FlowStock"}
                  </p>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] uppercase text-slate-400">Price</p>
                      <p className="text-lg font-extrabold text-[#0061FF]">
                        ₱{(product.packaging_price ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center rounded-xl bg-slate-100 px-1 py-1">
                      <button
                        onClick={() => updateQuantity(product, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:text-[#0061FF]"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[20px] text-center text-xs font-bold text-slate-900">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:text-[#0061FF]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRequest(product)}
                    className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#0061FF] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-[#0B6BFF]"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Request
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      </main>

      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm">
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Request Cart
                </p>
                <h2 className="text-lg font-bold text-slate-900">
                  {userName}
                </h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="h-9 w-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex h-[calc(100%-220px)] flex-col gap-4 overflow-y-auto px-6 py-4">
              {cartItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                  <ShoppingCart className="h-12 w-12" />
                  <p className="mt-3 text-sm font-semibold">No items yet</p>
                  <p className="text-xs">Add products from the catalog.</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-white">
                      {item.product.image_url ? (
                        <Image
                          src={item.product.image_url}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <Package className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        ₱{(item.product.packaging_price ?? 0).toLocaleString()} per
                        case
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product, -1)}
                          className="h-6 w-6 rounded-full bg-white text-slate-500"
                        >
                          <Minus className="h-3 w-3 mx-auto" />
                        </button>
                        <span className="text-xs font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product, 1)}
                          className="h-6 w-6 rounded-full bg-white text-slate-500"
                        >
                          <Plus className="h-3 w-3 mx-auto" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => updateQuantity(item.product, -item.quantity)}
                      className="text-slate-400 hover:text-[#0061FF]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-4">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
                <span>Total items</span>
                <span className="text-slate-900">{totalItems}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-base font-bold text-slate-900">
                <span>Estimated total</span>
                <span className="text-[#0061FF]">
                  ₱{totalAmount.toLocaleString()}
                </span>
              </div>
              <button
                disabled={isSubmitting || totalItems === 0}
                onClick={handleSubmitRequest}
                className="mt-4 w-full rounded-2xl bg-[#0061FF] py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0061FF] text-white shadow-2xl shadow-blue-500/40 md:hidden"
      >
        <div className="relative">
          <ShoppingCart className="h-6 w-6" />
          {totalItems > 0 && (
            <span className="absolute -right-3 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#0061FF]">
              {totalItems}
            </span>
          )}
        </div>
      </button>

      <nav className="fixed bottom-0 z-30 flex w-full items-center justify-around border-t border-slate-200/60 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
        <Link
          href={navLinks.home}
          className="flex flex-col items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400"
        >
          <Home className="h-5 w-5" />
          Home
        </Link>
        <Link
          href={navLinks.catalog}
          className="flex flex-col items-center gap-1 rounded-2xl bg-[#0061FF] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white"
        >
          <LayoutGrid className="h-5 w-5" />
          Catalog
        </Link>
        <Link
          href={navLinks.orders}
          className="flex flex-col items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400"
        >
          <ReceiptText className="h-5 w-5" />
          Orders
        </Link>
        <Link
          href={navLinks.account}
          className="flex flex-col items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400"
        >
          <User className="h-5 w-5" />
          Account
        </Link>
      </nav>
    </div>
  );
}
