import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
  };
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn("rounded-2xl bg-white p-5 shadow-sm border border-gray-50", className)}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-400">{label}</span>
          <span className="text-2xl font-bold text-gray-900">{value}</span>
        </div>
        <div className="rounded-xl bg-green-50 p-2 text-green-600">
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1">
          <span className={cn(
            "text-xs font-semibold",
            trend.isUp ? "text-green-600" : "text-red-600"
          )}>
            {trend.isUp ? "+" : "-"}{Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-gray-400">vs last month</span>
        </div>
      )}
    </div>
  );
}

interface CustomerCardProps {
  name: string;
  email: string;
  phone?: string;
  storeName?: string;
  joinedDate: string;
  className?: string;
}

export function CustomerCard({ name, email, phone, storeName, joinedDate, className }: CustomerCardProps) {
  return (
    <div className={cn("rounded-2xl bg-white p-5 shadow-sm border border-gray-50 flex flex-col gap-3", className)}>
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-lg">
          {name.charAt(0)}
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-gray-900 leading-tight">{name}</span>
          {storeName && <span className="text-sm text-green-600 font-medium">{storeName}</span>}
        </div>
      </div>

      <div className="space-y-1.5 pt-2 border-t border-gray-50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Email</span>
          <span className="text-gray-700 font-medium">{email}</span>
        </div>
        {phone && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Phone</span>
            <span className="text-gray-700 font-medium">{phone}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Joined</span>
          <span className="text-gray-700 font-medium">{new Date(joinedDate).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

interface ProductCardProps {
  name: string;
  category: string;
  price: number;
  imageUrl?: string;
  stock?: number;
  className?: string;
}

export function ProductCard({ name, category, price, imageUrl, stock, className }: ProductCardProps) {
  return (
    <div className={cn("rounded-2xl bg-white p-4 shadow-sm border border-gray-50 flex gap-4", className)}>
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-50">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <IconPackage className="h-8 w-8" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between py-0.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-green-600">{category}</span>
          <h3 className="font-bold text-gray-900 line-clamp-1">{name}</h3>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">${price.toLocaleString()}</span>
          {stock !== undefined && (
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              stock > 10 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            )}>
              {stock} left
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

import { Package as IconPackage } from "lucide-react";
