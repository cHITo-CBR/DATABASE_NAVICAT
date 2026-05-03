import { redirect } from "next/navigation";
import { Manrope, Inter } from "next/font/google";
import { getProducts } from "@/app/actions/products";
import { getSession } from "@/lib/session";
import BuyerCatalogClient from "@/app/(roles)/buyer/catalog/buyer-catalog-client";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default async function CustomerCatalogProductsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "buyer") redirect("/login");

  const products = await getProducts();
  const categories = Array.from(
    new Set(
      products
        .map((p) => p.category_name || "Other")
        .filter((name) => name && name.trim())
    )
  );

  const displayName =
    session.user.full_name ||
    session.user.name ||
    session.user.email ||
    "Buyer";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className={`${manrope.variable} ${inter.variable} font-[var(--font-inter)]`}>
      <BuyerCatalogClient
        products={products}
        categories={categories}
        userInitials={initials || "B"}
        userName={displayName}
        basePath="/customers"
      />
    </div>
  );
}
