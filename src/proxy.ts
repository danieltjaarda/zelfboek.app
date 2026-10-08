import { NextResponse, type NextRequest } from "next/server";

/** Zonder sessiecookie direct naar /login (de echte controle van de sessie gebeurt in de app-layout). */
export function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/app") && !req.cookies.get("bb_sessie")?.value) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url, 307);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/app/:path*"] };
