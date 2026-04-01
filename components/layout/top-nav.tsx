"use client";

import * as React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, Search, Sun, Moon, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getUnreadCount } from "@/app/actions/notifications";
import { globalSearch, type SearchResult } from "@/app/actions/search";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/app/actions/auth";

export function TopNav() {
  const [unreadCount, setUnreadCount] = React.useState(0);
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);

  React.useEffect(() => {
    getUnreadCount().then(setUnreadCount);
  }, []);

  React.useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSearchOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const data = await globalSearch(query);
      setResults(data);
      setSearchOpen(true);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 shadow-sm transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-16">
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger className="-ml-2 text-gray-500 hover:text-[#005914]" />

        {/* Global Search */}
        <div className="hidden sm:flex relative max-w-md w-full ml-4 group z-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
            placeholder="Search products, customers, users..."
            className="pl-10 bg-gray-50 border-gray-200 h-10 rounded-full focus-visible:ring-[#005914] w-full"
          />
          {searchOpen && (
            <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden flex flex-col max-h-[400px]">
              {isSearching ? (
                <div className="p-4 text-sm text-gray-500 text-center">Searching...</div>
              ) : results.length > 0 ? (
                <div className="overflow-y-auto py-2">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex flex-col"
                      onClick={() => {
                        setSearchOpen(false);
                        setQuery("");
                        router.push(r.url);
                      }}
                    >
                      <span className="font-medium text-sm text-gray-900">{r.title}</span>
                      <span className="text-xs text-gray-500">{r.type.toUpperCase()} &bull; {r.subtitle}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-sm text-gray-500 text-center">No results found for "{query}"</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/notifications">
          <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-[#005914] hover:bg-gray-50 rounded-full">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-2 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-500 hover:text-[#005914] hover:bg-gray-50 rounded-full dark:hover:bg-gray-800"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-5 w-5 dark:hidden" />
          <Moon className="hidden h-5 w-5 dark:block" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full dark:hover:bg-red-900/30"
          onClick={() => logoutUser()}
          title="Sign out"
        >
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
