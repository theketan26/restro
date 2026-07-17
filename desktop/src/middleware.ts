import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  let role = request.cookies.get("user-role")?.value;
  if (!role || role === "undefined" || role === "null") {
    role = "admin";
  }

  if (request.nextUrl.pathname.startsWith("/users")) {
    if (role !== "admin" && role !== "manager") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (request.nextUrl.pathname.startsWith("/items")) {
    if (role !== "admin" && role !== "manager" && role !== "chef") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/users/:path*", "/users", "/items/:path*", "/items"],
};
