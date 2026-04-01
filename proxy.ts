import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

/**
 * Next.js 16 Proxy for role-based routing and route protection.
 *
 * Route mapping:
 *   admin      → /admin/*
 *   salesman   → /salesman/*
 *   supervisor → /supervisor/*
 *   buyer      → /customers/*
 */

// Role → allowed route prefix
const roleRouteMap: Record<string, string> = {
  admin: "/admin",
  salesman: "/salesman",
  supervisor: "/supervisor",
  buyer: "/customers",
};

// Role → default landing page
const roleDashboardMap: Record<string, string> = {
  admin: "/admin/dashboard",
  salesman: "/salesman/dashboard",
  supervisor: "/supervisor/dashboard",
  buyer: "/customers/catalog/products",
};

// Routes that don't require authentication
const publicRoutes = ["/login", "/signup", "/auth"];

async function getSessionRole(request: NextRequest) {
  const sessionCookie = request.cookies.get("session")?.value;
  if (!sessionCookie) return { role: null, session: null };
  try {
    const session = await decrypt(sessionCookie);
    return { role: session?.user?.role ?? null, session };
  } catch {
    return { role: null, session: null };
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // static files like favicon.ico, logo.png, etc.
  ) {
    return NextResponse.next();
  }

  const isPublic = publicRoutes.some((r) => pathname.startsWith(r));

  // ── Public routes ──
  if (isPublic) {
    // Logged-in users hitting /login or /signup → redirect to their dashboard
    if (pathname === "/login" || pathname === "/signup") {
      const { role } = await getSessionRole(request);
      if (role && roleDashboardMap[role]) {
        return NextResponse.redirect(
          new URL(roleDashboardMap[role], request.url)
        );
      }
    }
    return NextResponse.next();
  }

  // ── Root path ──
  if (pathname === "/") {
    const { role } = await getSessionRole(request);
    if (role && roleDashboardMap[role]) {
      return NextResponse.redirect(
        new URL(roleDashboardMap[role], request.url)
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── Stakeholder routes: enforce role match ──
  const isStakeholderRoute = Object.values(roleRouteMap).some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isStakeholderRoute) {
    const { role } = await getSessionRole(request);

    if (!role) {
      // Not logged in → send to login
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Check if user's role matches the route prefix
    const allowedPrefix = roleRouteMap[role];
    if (!allowedPrefix || !pathname.startsWith(allowedPrefix)) {
      // Wrong role for this route → redirect to their own dashboard
      return NextResponse.redirect(
        new URL(roleDashboardMap[role] || "/login", request.url)
      );
    }

    return NextResponse.next();
  }

  // ── Any other unmatched route without session → redirect to login ──
  const { role } = await getSessionRole(request);
  if (!role) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
